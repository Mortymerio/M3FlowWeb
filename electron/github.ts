import fs from 'fs';
import { databaseAPI } from './database';

interface GithubNote {
  id: string;
  title: string;
  body: string;
  notebookId: string;
  status?: string;
}

interface SyncProgress {
  current: number;
  total: number;
  message: string;
}

// 1. Definir Headers y Helper primero
const githubHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
});

const fetchGithub = async (url: string, token: string, options: RequestInit = {}): Promise<any> => {
  const res = await fetch(url, {
    ...options,
    headers: { ...githubHeaders(token), ...options.headers },
  });
  if (!res.ok) {
    let errorMsg = res.statusText;
    try { const data = await res.json() as any; errorMsg = data.message || errorMsg; } catch (e) { }
    throw new Error(`GitHub API Error: ${res.status} - ${errorMsg}`);
  }
  return res.json();
};

// 2. Funciones exportadas
export const testConnection = async (token: string) => {
  try {
    const user = await fetchGithub('https://api.github.com/user', token);
    return { success: true, username: user.login };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

const ensureRepoExists = async (token: string, repoName: string, username: string) => {
  try {
    await fetchGithub(`https://api.github.com/repos/${username}/${repoName}`, token);
  } catch (err: any) {
    if (err.message.includes('404')) {
      await fetchGithub(`https://api.github.com/user/repos`, token, {
        method: 'POST',
        body: JSON.stringify({ name: repoName, private: true, auto_init: true })
      });
    } else {
      throw err;
    }
  }
};

export const syncToGithub = async (
  token: string,
  repoName: string,
  notes: GithubNote[],
  notebooks: any[],
  dbPath: string,
  syncMarkdown: boolean,
  syncDb: boolean,
  onProgress?: (progress: SyncProgress) => void
) => {
  try {
    if (onProgress) onProgress({ current: 0, total: 100, message: 'Connecting...' });
    const user = await fetchGithub('https://api.github.com/user', token);
    const username = user.login;
    await ensureRepoExists(token, repoName, username);

    let latestCommitSha: string | null = null;
    let baseTreeSha: string | null = null;
    let branch = 'main';

    try {
      const refData = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/refs/heads/main`, token);
      latestCommitSha = refData.object.sha;
    } catch {
      branch = 'master';
      const refData = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/refs/heads/master`, token);
      latestCommitSha = refData.object.sha;
    }

    const commitData = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/commits/${latestCommitSha}`, token);
    baseTreeSha = commitData.tree.sha;

    const treePayload: any[] = [];
    if (syncMarkdown) {
      // 1. Sincronizar Notas con Metadatos (YAML Frontmatter)
      for (const note of notes) {
        const safeTitle = note.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Untitled';

        // Inyectar metadatos en la parte superior del archivo
        const yamlMetadata = `---
id: ${note.id}
title: ${note.title}
notebookId: ${note.notebookId}
status: ${note.status || 'none'}
updatedAt: ${Date.now()}
---

`;
        const fullContent = yamlMetadata + note.body;

        const blob = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/blobs`, token, {
          method: 'POST',
          body: JSON.stringify({ content: fullContent, encoding: 'utf-8' })
        });
        // Usar note.id como nombre de archivo es mucho más robusto para evitar duplicados
        treePayload.push({ path: `notes/${note.id}.md`, mode: '100644', type: 'blob', sha: blob.sha });
      }

      // 2. Sincronizar Estructura de Notebooks (Contextos)
      const notebooksJson = JSON.stringify(notebooks, null, 2);
      const nbBlob = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/blobs`, token, {
        method: 'POST',
        body: JSON.stringify({ content: notebooksJson, encoding: 'utf-8' })
      });
      treePayload.push({ path: `system/notebooks.json`, mode: '100644', type: 'blob', sha: nbBlob.sha });
    }

    if (syncDb && fs.existsSync(dbPath)) {
      const dbContent = fs.readFileSync(dbPath).toString('base64');
      const blob = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/blobs`, token, {
        method: 'POST',
        body: JSON.stringify({ content: dbContent, encoding: 'base64' })
      });
      treePayload.push({ path: `system/m3flow.db`, mode: '100644', type: 'blob', sha: blob.sha });
    }

    if (treePayload.length === 0) return { success: true };

    const newTree = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/trees`, token, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treePayload })
    });

    const newCommit = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/commits`, token, {
      method: 'POST',
      body: JSON.stringify({ message: `Sync ${new Date().toISOString()}`, tree: newTree.sha, parents: [latestCommitSha] })
    });

    await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/git/refs/heads/${branch}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ sha: newCommit.sha })
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const importDbFromGithub = async (token: string, repoName: string, localDbPath: string) => {
  try {
    const user = await fetchGithub('https://api.github.com/user', token);
    const username = user.login;
    const contentData = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/contents/system/m3flow.db`, token);
    const response = await fetch(contentData.download_url, { headers: { 'Authorization': `Bearer ${token}` } });
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(localDbPath, buffer);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const importNotesFromGithub = async (token: string, repoName: string, onProgress?: (p: SyncProgress) => void) => {
  try {
    const user = await fetchGithub('https://api.github.com/user', token);
    const username = user.login;

    // 1. Intentar recuperar estructura de Notebooks (Contextos)
    let targetNotebookId = 'nb-recovered';
    try {
      const nbFile = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/contents/system/notebooks.json`, token);
      if (nbFile && nbFile.content) {
        const decodedNb = Buffer.from(nbFile.content, 'base64').toString('utf-8');
        const notebooksData = JSON.parse(decodedNb);
        if (onProgress) onProgress({ current: 5, total: 100, message: 'Restoring structure...' });

        for (const nb of notebooksData) {
          databaseAPI.saveNotebook(nb);
        }
        if (notebooksData.length > 0) targetNotebookId = notebooksData[0].id;
      }
    } catch (e) {
      console.log('[Sync] No system/notebooks.json found, creating default recovery folder.');
      databaseAPI.saveNotebook({ id: 'nb-recovered', name: 'Recovered Notes', parentId: null });
    }

    const files = await fetchGithub(`https://api.github.com/repos/${username}/${repoName}/contents/notes`, token);
    if (!Array.isArray(files)) throw new Error('No se encontraron notas.');

    const mdFiles = files.filter(f => f.name.endsWith('.md'));
    const existingNotes = databaseAPI.getNotes() as any[];

    for (const [index, file] of mdFiles.entries()) {
      const res = await fetch(file.download_url, { headers: { 'Authorization': `Bearer ${token}` } });
      let body = await res.text();

      let noteTitle = file.name.replace('.md', '').replace(/__/g, ' - ').replace(/_/g, ' ');
      let noteNotebookId = targetNotebookId;
      let noteStatus = 'active';
      let noteId = file.name.replace('.md', ''); // Usar nombre de archivo como ID inicial

      // Lógica robusta de Frontmatter
      if (body.startsWith('---')) {
        const parts = body.split('---');
        if (parts.length >= 3) {
          const fmContent = parts[1];
          body = parts.slice(2).join('---').trim();

          const idMatch = fmContent.match(/id:\s*(.*)/);
          const titleMatch = fmContent.match(/title:\s*(.*)/);
          const nbMatch = fmContent.match(/notebookId:\s*(.*)/);
          const stMatch = fmContent.match(/status:\s*(.*)/);

          if (idMatch) noteId = idMatch[1].trim();
          if (titleMatch) noteTitle = titleMatch[1].trim();
          if (nbMatch) noteNotebookId = nbMatch[1].trim();
          if (stMatch) noteStatus = stMatch[1].trim();
        }
      }

      if (onProgress) onProgress({ current: 10 + (index / mdFiles.length) * 90, total: 100, message: `Recovering: ${noteTitle}` });
      
      // EVITAR DUPLICADOS: Si el ID ya existe, sobreescribir. Si no, crear.
      databaseAPI.saveNote({
        id: noteId,
        title: noteTitle,
        body: body,
        notebookId: noteNotebookId,
        status: noteStatus
      });
    }
    return { success: true, count: mdFiles.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
