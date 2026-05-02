import fs from 'fs';

interface GithubNote {
  title: string;
  body: string;
}

const githubHeaders = (token: string) => ({
  'Authorization': `token ${token}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
});

// Helper para hacer peticiones a GitHub
const fetchGithub = async (url: string, token: string, options: RequestInit = {}): Promise<any> => {
  const res = await fetch(url, {
    ...options,
    headers: { ...githubHeaders(token), ...options.headers },
  });
  if (!res.ok) {
    let errorMsg = res.statusText;
    try { const data = await res.json() as any; errorMsg = data.message || errorMsg; } catch (e) {}
    throw new Error(`GitHub API Error: ${res.status} - ${errorMsg}`);
  }
  return res.json();
};

export const testConnection = async (token: string) => {
  try {
    const user = await fetchGithub('https://api.github.com/user', token);
    return { success: true, username: user.login };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

const ensureRepoExists = async (token: string, repoName: string, username: string, isPrivate: boolean = true) => {
  try {
    await fetchGithub(`https://api.github.com/repos/${username}/${repoName}`, token);
    return true; // Existe
  } catch (err: any) {
    if (err.message.includes('404')) {
      // Crear repositorio
      await fetchGithub(`https://api.github.com/user/repos`, token, {
        method: 'POST',
        body: JSON.stringify({
          name: repoName,
          private: isPrivate,
          auto_init: true // Para que tenga una rama principal
        })
      });
      return true;
    }
    throw err;
  }
};

export const syncToGithub = async (
  token: string,
  repoName: string,
  notes: GithubNote[],
  dbPath: string,
  syncMarkdown: boolean,
  syncDb: boolean,
  onProgress?: (progress: { current: number; total: number; message: string }) => void
) => {
  try {
    if (onProgress) onProgress({ current: 0, total: 100, message: 'Validating GitHub connection...' });
    
    // 1. Obtener usuario
    const user = await fetchGithub('https://api.github.com/user', token);
    const username = user.login;

    if (onProgress) onProgress({ current: 5, total: 100, message: 'Ensuring repository exists...' });
    // 2. Asegurar que el repo existe
    await ensureRepoExists(token, repoName, username, true);

    if (onProgress) onProgress({ current: 10, total: 100, message: 'Fetching latest commit...' });
    // 3. Obtener el commit y tree actual de main/master
    let refData;
    let branch = 'main';
    try {
      refData = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/refs/heads/main`, token);
    } catch {
      branch = 'master';
      refData = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/refs/heads/master`, token);
    }
    
    const latestCommitSha = refData.object.sha;
    const commitData = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/commits/${latestCommitSha}`, token);
    const baseTreeSha = commitData.tree.sha;

    // 4. Crear Blobs para cada archivo
    const treePayload: any[] = [];
    
    let totalFiles = (syncMarkdown ? notes.length : 0) + (syncDb ? 1 : 0);
    let processedFiles = 0;

    if (syncMarkdown && notes.length > 0) {
      for (const note of notes) {
        if (onProgress) onProgress({ current: 10 + (processedFiles / totalFiles) * 70, total: 100, message: `Uploading: ${note.title}.md` });
        // Normalizar título para nombre de archivo
        const safeTitle = note.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Untitled';
        const blob = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/blobs`, token, {
          method: 'POST',
          body: JSON.stringify({ content: note.body, encoding: 'utf-8' })
        });
        treePayload.push({
          path: `notes/${safeTitle}.md`,
          mode: '100644',
          type: 'blob',
          sha: blob.sha
        });
        processedFiles++;
      }
    }

    if (syncDb && fs.existsSync(dbPath)) {
      if (onProgress) onProgress({ current: 10 + (processedFiles / totalFiles) * 70, total: 100, message: 'Uploading Database (m3flow.db)...' });
      const dbContent = fs.readFileSync(dbPath).toString('base64');
      const blob = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/blobs`, token, {
        method: 'POST',
        body: JSON.stringify({ content: dbContent, encoding: 'base64' })
      });
      treePayload.push({
        path: `system/m3flow.db`,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
    }

    if (treePayload.length === 0) {
      if (onProgress) onProgress({ current: 100, total: 100, message: 'Nothing to sync' });
      return { success: true, message: 'Nothing to sync' };
    }

    if (onProgress) onProgress({ current: 85, total: 100, message: 'Creating Git Tree...' });
    // 5. Crear el Tree
    const newTree = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/trees`, token, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treePayload
      })
    });

    if (onProgress) onProgress({ current: 90, total: 100, message: 'Creating Commit...' });
    // 6. Crear el Commit
    const dateStr = new Date().toISOString();
    const newCommit = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/commits`, token, {
      method: 'POST',
      body: JSON.stringify({
        message: `Auto-sync: ${dateStr}`,
        tree: newTree.sha,
        parents: [latestCommitSha]
      })
    });

    if (onProgress) onProgress({ current: 95, total: 100, message: 'Updating reference branch...' });
    // 7. Actualizar la referencia
    await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/refs/heads/${branch}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ sha: newCommit.sha })
    });

    if (onProgress) onProgress({ current: 100, total: 100, message: 'Sync complete!' });
    return { success: true, message: 'Synced successfully' };

  } catch (error: any) {
    console.error('GitHub Sync Error:', error);
    return { success: false, error: error.message };
  }
};

export const importDbFromGithub = async (token: string, repoName: string, localDbPath: string) => {
  try {
    const user = await fetchGithub('https://api.github.com/user', token);
    const username = user.login;

    // Buscar el archivo usando Contents API
    const contentData = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/contents/system/m3flow.db`, token);
    
    if (contentData.encoding !== 'base64') {
      throw new Error('Formato de archivo no soportado por la API.');
    }

    // Sobrescribir localmente
    const buffer = Buffer.from(contentData.content, 'base64');
    fs.writeFileSync(localDbPath, buffer);

    return { success: true };
  } catch (error: any) {
    console.error('GitHub Import Error:', error);
    return { success: false, error: error.message };
  }
};
