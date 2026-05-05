const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Intentar cargar better-sqlite3 del node_modules del proyecto
const projectRoot = 'c:/Users/Mariano/Desktop/AGI WS/M3Flow';
const sqlitePath = path.join(projectRoot, 'node_modules', 'better-sqlite3');
const sqlite3 = require(sqlitePath);

const dbPath = path.join(process.env.APPDATA, 'm3flow', 'm3flow.db');
console.log('Using DB:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('DB not found!');
  process.exit(1);
}

const db = new sqlite3(dbPath);
const notes = db.prepare('SELECT * FROM Notes').all();
const notebooks = db.prepare('SELECT * FROM Notebooks').all();

console.log(`Pushing ${notes.length} notes and ${notebooks.length} notebooks...`);

function ghPut(repoPath, content, message) {
  const contentBase64 = Buffer.from(content).toString('base64');
  let sha = '';
  try {
    sha = execSync(`gh api /repos/Mortymerio/M3Flow/contents/${repoPath} --jq .sha`, { stdio: 'pipe' }).toString().trim();
  } catch (e) {}

  const shaFlag = sha ? `-f sha=${sha}` : '';
  execSync(`gh api -X PUT /repos/Mortymerio/M3Flow/contents/${repoPath} -f message="${message}" -f content="${contentBase64}" ${shaFlag}`, { stdio: 'inherit' });
}

// 1. Notebooks
ghPut('system/notebooks.json', JSON.stringify(notebooks, null, 2), 'backup: structure');

// 2. Notes
for (const note of notes) {
  const safeTitle = note.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Untitled';
  console.log(`Uploading: ${safeTitle}...`);
  ghPut(`notes/${safeTitle}.md`, note.body, `backup: ${safeTitle}`);
}

console.log('DONE!');
