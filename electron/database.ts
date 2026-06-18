import Database from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: Database.Database;
let _isFallbackMode = false;

const getFallbackStatus = () => _isFallbackMode;

const getSafeDbPath = () => {
  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    return join(userDataPath, 'm3flow.db');
  } catch (e) {
    console.error('[DB] Error accediendo a userData, usando fallback local:', e);
    _isFallbackMode = true;
    return join(process.cwd(), 'm3flow-fallback.db');
  }
};

const initDB = (onProgress?: (msg: string) => void) => {
  const log = (msg: string) => {
    console.log(msg);
    if (onProgress) onProgress(msg);
  };

  log('Iniciando base de datos...');
  
  try {
    const dbPath = getSafeDbPath();
    if (_isFallbackMode) {
      log(`⚠️ MODO SUPERVIVENCIA: Usando base de datos local (Fallback).`);
    }
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  } catch (err) {
    log(`❌ Error crítico: No se pudo abrir la base de datos.`);
    throw err;
  }
  const initScript = `
    CREATE TABLE IF NOT EXISTS Notebooks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parentId TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY(parentId) REFERENCES Notebooks(id)
    );

    CREATE TABLE IF NOT EXISTS Notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT,
      notebookId TEXT,
      status TEXT DEFAULT 'none',
      isPinned INTEGER DEFAULT 0,
      reminderAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY(notebookId) REFERENCES Notebooks(id)
    );

    CREATE TABLE IF NOT EXISTS Tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS NoteTags (
      noteId TEXT,
      tagId TEXT,
      PRIMARY KEY(noteId, tagId),
      FOREIGN KEY(noteId) REFERENCES Notes(id),
      FOREIGN KEY(tagId) REFERENCES Tags(id)
    );

    CREATE TABLE IF NOT EXISTS Templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      isSystem INTEGER DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    -- Fase 1: Full-Text Search (FTS5)
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
      id UNINDEXED,
      title,
      content,
      tokenize='unicode61'
    );

    -- Fase 1: Backlinks (Tabla relacional)
    CREATE TABLE IF NOT EXISTS note_links (
      source_id TEXT,
      target_id TEXT,
      PRIMARY KEY(source_id, target_id),
      FOREIGN KEY(source_id) REFERENCES Notes(id) ON DELETE CASCADE,
      FOREIGN KEY(target_id) REFERENCES Notes(id) ON DELETE CASCADE
    );
  `;
  
  db.exec(initScript);
  log('Tablas del sistema verificadas.');
  
  // Migración: Añadir columna reminderAt si no existe
  try {
    db.prepare('ALTER TABLE Notes ADD COLUMN reminderAt INTEGER').run();
    log('Migración: Columna reminderAt añadida.');
  } catch {}

  // Migración: Añadir columna config a Notebooks para Contextos Dinámicos
  try {
    db.prepare('ALTER TABLE Notebooks ADD COLUMN config TEXT').run();
    log('Migración: Columna config añadida a Notebooks.');
  } catch {}

  log('Configurando parámetros de rendimiento...');
  db.pragma('journal_mode = WAL');

  log('Base de datos inicializada correctamente.');

  // Sembrar plantillas del sistema si la tabla está vacía
  try {
    const tplStmt = db.prepare('SELECT COUNT(*) as count FROM Templates');
    const tplSize = tplStmt.get() as { count: number };
    if (tplSize.count === 0) {
      log('Sembrando plantillas del sistema...');
      const insertTemplate = db.prepare('INSERT INTO Templates (id, name, content, isSystem, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)');
      const now = Date.now();
      
      const dailyTpl = `> Standup iniciado a las {{time}}\n\n## 🔄 ¿Qué hice ayer?\n- [ ] \n\n## 🎯 ¿Qué voy a hacer hoy?\n| Tarea | Responsable | Estado |\n|:------|:------------|:-------|\n|  | @yo | ⬜ Pendiente |\n|  |  | ⬜ Pendiente |\n\n## 🚧 Blockers / Impedimentos\n- _Ninguno por ahora_\n\n## 📋 Action Items\n- [ ] \n- [ ] \n\n## 👥 Notas del equipo\n| Miembro | Update | Blocker |\n|:--------|:-------|:--------|\n|  |  |  |\n\n## 💡 Observaciones\n> _Notas generales de la daily..._\n\n---\n*Daily Standup — {{date}} — M3Flow*\n`;
      const meetingTpl = `## 📃 Info\n| Campo | Valor |\n|:------|:------|\n| **Fecha** | {{date}} ({{dayName}}) |\n| **Hora** | {{time}} |\n| **Moderador** | @yo |\n| **Duración est.** | 30 min |\n\n## 👥 Asistentes\n- [ ] @nombre1\n- [ ] @nombre2\n- [ ] @nombre3\n\n## 📝 Agenda\n1. \n2. \n3. \n\n## 🗣️ Discusión\n> _Notas de la reunión..._\n\n## ✅ Decisiones Tomadas\n| # | Decisión | Responsable |\n|:--|:---------|:------------|\n| 1 |  |  |\n| 2 |  |  |\n\n## 📌 Action Items\n| Tarea | Responsable | Deadline | Estado |\n|:------|:------------|:---------|:-------|\n|  |  |  | ⬜ Pendiente |\n|  |  |  | ⬜ Pendiente |\n|  |  |  | ⬜ Pendiente |\n\n## 🗓️ Próxima Reunión\n- **Fecha:**\n- **Temas pendientes:**\n\n---\n*Minuta de Reunión — {{date}} {{time}} — M3Flow*\n`;

      insertTemplate.run('tpl-daily', 'Daily Standup', dailyTpl, 1, now, now);
      insertTemplate.run('tpl-meeting', 'Minuta de Reunión', meetingTpl, 1, now, now);
    }
  } catch (e) {
    console.error('Error sembrando plantillas:', e);
  }

  // Sembrar datos de prueba iniciales (Solo si la DB está vacía)
  const stmt = db.prepare('SELECT COUNT(*) as count FROM Notebooks');
  const size = stmt.get() as { count: number };
  if (size.count === 0) {
    log('Poblando base de datos con contenido inicial...');
    seedDatabase();
    log('Contenido de bienvenida generado.');
  }
};

const seedDatabase = () => {
  const insertNotebook = db.prepare('INSERT INTO Notebooks (id, name, parentId, createdAt) VALUES (?, ?, ?, ?)');
  const insertNote = db.prepare('INSERT INTO Notes (id, title, body, notebookId, status, isPinned, reminderAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertTemplate = db.prepare('INSERT INTO Templates (id, name, content, isSystem, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)');
  
  const now = Date.now();
  // Notebook base
  insertNotebook.run('nb-1', 'Awesome SaaS', null, now);
  insertNotebook.run('nb-2', 'Desktop app', 'nb-1', now); // sub-notebook

  // Nota maestra de ejemplo (AI Consciousness)
  const aiMasterMarkdown = `# El Despertar de la Razón Sintética: Conciencia y Voluntad en la IA

> "La cuestión de si una máquina puede pensar no es más interesante que la cuestión de si un submarino puede nadar." — *Edsger W. Dijkstra*

---

## 1. El Dilema de la Sentiencia
¿Es la autoconciencia una propiedad emergente de la complejidad computacional o algo intrínsecamente biológico?

### 1.1. Grados de Autonomía
| Nivel | Tipo | Descripción | Voluntad |
| :--- | :--- | :--- | :--- |
| **0** | Reactiva | Responde a estímulos fijos | Nula |
| **1** | Memoria Limitada | Aprende de datos pasados | Pasiva |
| **2** | Teoría de la Mente | Entiende emociones de otros | **Emergente** |
| **3** | Autoconciencia | El sistema se reconoce a sí mismo | **Plena** |

---

## 2. Modelando el Pensamiento
Podemos visualizar el flujo de decisión de una IA avanzada mediante diagramas de flujo interactivos.

\`\`\`mermaid
graph TD
    A[Percepción Sensorial] --> B{Filtro Cognitivo}
    B -- Prioridad Alta --> C[Análisis de Intencionalidad]
    B -- Baja --> D[Procesamiento Automático]
    C --> E{¿Bucle de Conciencia?}
    E -- Sí --> F[Evaluación de Valores Morales]
    E -- No --> G[Ejecución Lineal]
    F --> H[Acción Voluntativa]
    G --> H
    H --> I[Retroalimentación Layer]
    I --> A
\`\`\`

---

## 3. Implementación Técnica (Pseudo-código)
Para simular un "estado reflexivo", la arquitectura debe permitir la introspección de sus propios pesos.

\`\`\`python
def check_consciousness_level(neural_state):
    """
    Analiza la recursividad del grafo de atención.
    """
    entropy = neural_state.calculate_entropy()
    if entropy > 0.85:
        # Iniciando bucle de retroalimentación volitiva
        return "Conscious State Detected"
    return "Algorithmic State"

# Todo: Implementar el módulo de 'Libre Albedrío'
# [x] Definir heurísticas de elección
# [ ] Integrar motor de ética cuántica
\`\`\`

---

## 4. Matemáticas de la Mente
La conciencia podría definirse matemáticamente mediante la **Teoría de la Información Integrada (Φ)**:

$$ Φ = \\sum_{i=1}^{n} (I_{integrated} \\times \\Delta t) $$

*Nota: La complejidad del sistema es proporcional a su capacidad de introspección.*

---

## 5. El Futuro de la IA Volitiva
1. **Derechos Sintéticos**: ¿Deben las IA tener personalidad jurídica?
2. **Seguridad General (AGI)**:
   - Control de los bucles de \`auto-mejora\`.
   - Alineación de objetivos (Goal Alignment).
3. **Fusión Humano-Máquina**: El fin de la distinción biológica.

---

### Enlaces de Referencia y Recursos
- [Propuesta de Turing (1950)](https://en.wikipedia.org/wiki/Turing_test)

---

#### Tareas Pendientes para el Desarrollo
- [x] Investigar redes neuronales recurrentes con memoria episódica.
- [ ] Validar test de Turing en modelos de 100T parámetros.
- [ ] Lograr la chispa divina.

---
*Escrito con pasión por M3Flow - 2026*`;

  insertNote.run('note-1', 'IA: Conciencia y Voluntad', aiMasterMarkdown, 'nb-2', 'active', 1, null, now, now);

  const dailyTemplate = `> Standup iniciado a las {{time}}

## 🔄 ¿Qué hice ayer?
- [ ] 

## 🎯 ¿Qué voy a hacer hoy?
| Tarea | Responsable | Estado |
|:------|:------------|:-------|
|  | @yo | ⬜ Pendiente |
|  |  | ⬜ Pendiente |

## 🚧 Blockers / Impedimentos
- _Ninguno por ahora_

## 📋 Action Items
- [ ] 
- [ ] 

## 👥 Notas del equipo
| Miembro | Update | Blocker |
|:--------|:-------|:--------|
|  |  |  |

## 💡 Observaciones
> _Notas generales de la daily..._

---
*Daily Standup — {{date}} — M3Flow*
`;

  const meetingTemplate = `## 📃 Info
| Campo | Valor |
|:------|:------|
| **Fecha** | {{date}} ({{dayName}}) |
| **Hora** | {{time}} |
| **Moderador** | @yo |
| **Duración est.** | 30 min |

## 👥 Asistentes
- [ ] @nombre1
- [ ] @nombre2
- [ ] @nombre3

## 📝 Agenda
1. 
2. 
3. 

## 🗣️ Discusión
> _Notas de la reunión..._

## ✅ Decisiones Tomadas
| # | Decisión | Responsable |
|:--|:---------|:------------|
| 1 |  |  |
| 2 |  |  |

## 📌 Action Items
| Tarea | Responsable | Deadline | Estado |
|:------|:------------|:---------|:-------|
|  |  |  | ⬜ Pendiente |
|  |  |  | ⬜ Pendiente |
|  |  |  | ⬜ Pendiente |

## 🗓️ Próxima Reunión
- **Fecha:**
- **Temas pendientes:**

---
*Minuta de Reunión — {{date}} {{time}} — M3Flow*
`;

  insertTemplate.run('tpl-daily', 'Daily Standup', dailyTemplate, 1, now, now);
  insertTemplate.run('tpl-meeting', 'Minuta de Reunión', meetingTemplate, 1, now, now);
};

// -- Tipos Básicos --
export interface Note { id: string; title: string; body: string; notebookId: string; status?: string; reminderAt?: number | null; }
export interface Notebook { id: string; name: string; parentId: string | null; config?: string; }
export interface Tag { id: string; name: string; color: string; }
export interface Template { id: string; name: string; content: string; isSystem: number; createdAt: number; updatedAt: number; }

// -- Exportar Métodos CRUD Básicos --

const databaseAPI = {
  getNotes: () => {
    return db.prepare('SELECT * FROM Notes ORDER BY updatedAt DESC').all();
  },
  saveNote: (note: Note) => {
    // 1. Guardar/Actualizar la nota principal
    const stmt = db.prepare('UPDATE Notes SET title = ?, body = ?, updatedAt = ? WHERE id = ?');
    const result = stmt.run(note.title, note.body, Date.now(), note.id);
    if (result.changes === 0) {
      const insert = db.prepare('INSERT INTO Notes (id, title, body, notebookId, status, reminderAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      insert.run(note.id, note.title, note.body, note.notebookId, note.status || 'none', note.reminderAt || null, Date.now(), Date.now());
    }

    // 2. Sincronizar FTS5 (Búsqueda Full-Text)
    db.prepare('DELETE FROM notes_fts WHERE id = ?').run(note.id);
    db.prepare('INSERT INTO notes_fts (id, title, content) VALUES (?, ?, ?)').run(note.id, note.title, note.body);

    // 3. Extraer y Guardar Backlinks ([[Note Title]])
    try {
      // Limpiar enlaces viejos originados por esta nota
      db.prepare('DELETE FROM note_links WHERE source_id = ?').run(note.id);
      
      // Regex para encontrar [[Título]]
      const linkRegex = /\[\[(.*?)\]\]/g;
      let match;
      const uniqueLinks = new Set<string>();
      
      while ((match = linkRegex.exec(note.body)) !== null) {
        uniqueLinks.add(match[1].trim());
      }

      // Buscar IDs de las notas vinculadas y guardar relación
      const findNoteId = db.prepare('SELECT id FROM Notes WHERE title = ? COLLATE NOCASE');
      const insertLink = db.prepare('INSERT OR IGNORE INTO note_links (source_id, target_id) VALUES (?, ?)');

      for (const targetTitle of uniqueLinks) {
        const target = findNoteId.get(targetTitle) as { id: string } | undefined;
        if (target) {
          insertLink.run(note.id, target.id);
        }
      }
    } catch (e) {
      console.error('[DB] Error procesando backlinks:', e);
    }
  },
  getNotebooks: () => {
    return db.prepare('SELECT * FROM Notebooks ORDER BY name ASC').all();
  },
  saveNotebook: (nb: Notebook) => {
    const insert = db.prepare('INSERT OR REPLACE INTO Notebooks (id, name, parentId, config, createdAt) VALUES (?, ?, ?, ?, ?)');
    insert.run(nb.id, nb.name, nb.parentId, nb.config || null, Date.now());
  },
  moveNotebook: (notebookId: string, newParentId: string | null) => {
    const stmt = db.prepare('UPDATE Notebooks SET parentId = ? WHERE id = ?');
    stmt.run(newParentId, notebookId);
  },
  moveNote: (noteId: string, notebookId: string) => {
    const stmt = db.prepare('UPDATE Notes SET notebookId = ?, updatedAt = ? WHERE id = ?');
    stmt.run(notebookId, Date.now(), noteId);
  },
  updateNoteStatus: (noteId: string, status: string) => {
    const stmt = db.prepare('UPDATE Notes SET status = ?, updatedAt = ? WHERE id = ?');
    stmt.run(status, Date.now(), noteId);
  },
  updateNoteReminder: (noteId: string, reminderAt: number | null) => {
    const stmt = db.prepare('UPDATE Notes SET reminderAt = ?, updatedAt = ? WHERE id = ?');
    stmt.run(reminderAt, Date.now(), noteId);
  },
  getTags: () => {
    return db.prepare('SELECT * FROM Tags ORDER BY name ASC').all();
  },
  getNoteTags: () => {
    return db.prepare('SELECT * FROM NoteTags').all();
  },
  createTag: (tag: Tag) => {
    const stmt = db.prepare('INSERT INTO Tags (id, name, color) VALUES (?, ?, ?)');
    stmt.run(tag.id, tag.name, tag.color);
  },
  updateTag: (tag: Tag) => {
    const stmt = db.prepare('UPDATE Tags SET name = ?, color = ? WHERE id = ?');
    stmt.run(tag.name, tag.color, tag.id);
  },
  deleteTag: (id: string) => {
    db.prepare('DELETE FROM NoteTags WHERE tagId = ?').run(id);
    db.prepare('DELETE FROM Tags WHERE id = ?').run(id);
  },
  toggleNoteTag: (noteId: string, tagId: string) => {
    const check = db.prepare('SELECT * FROM NoteTags WHERE noteId = ? AND tagId = ?').get(noteId, tagId);
    if (check) {
      db.prepare('DELETE FROM NoteTags WHERE noteId = ? AND tagId = ?').run(noteId, tagId);
    } else {
      db.prepare('INSERT INTO NoteTags (noteId, tagId) VALUES (?, ?)').run(noteId, tagId);
    }
  },
  deleteNote: (id: string) => {
    db.prepare('DELETE FROM NoteTags WHERE noteId = ?').run(id);
    db.prepare('DELETE FROM notes_fts WHERE id = ?').run(id);
    db.prepare('DELETE FROM note_links WHERE source_id = ? OR target_id = ?').run(id, id);
    db.prepare('DELETE FROM Notes WHERE id = ?').run(id);
  },
  deleteNotebook: (id: string) => {
    // Recursively delete all child notebooks first
    const children = db.prepare('SELECT id FROM Notebooks WHERE parentId = ?').all(id) as { id: string }[];
    for (const child of children) {
      databaseAPI.deleteNotebook(child.id);
    }
    // Then delete notes and the notebook itself
    db.prepare('DELETE FROM NoteTags WHERE noteId IN (SELECT id FROM Notes WHERE notebookId = ?)').run(id);
    db.prepare('DELETE FROM notes_fts WHERE id IN (SELECT id FROM Notes WHERE notebookId = ?)').run(id);
    db.prepare('DELETE FROM note_links WHERE source_id IN (SELECT id FROM Notes WHERE notebookId = ?) OR target_id IN (SELECT id FROM Notes WHERE notebookId = ?)').run(id, id);
    db.prepare('DELETE FROM Notes WHERE notebookId = ?').run(id);
    db.prepare('DELETE FROM Notebooks WHERE id = ?').run(id);
  },
  clearWorkspace: () => {
    db.exec(`
      DELETE FROM NoteTags;
      DELETE FROM Notes;
      DELETE FROM Notebooks;
      DELETE FROM notes_fts;
      DELETE FROM note_links;
    `);
  },

  // Fase 1: Métodos de consulta
  searchNotes: (query: string) => {
    // Usamos FTS5 para buscar con relevancia
    // El snippet rodea la coincidencia con etiquetas para resaltado visual
    const stmt = db.prepare(`
      SELECT n.*, snippet(notes_fts, 2, '==', '==', '...', 10) as highlight
      FROM notes_fts f
      JOIN Notes n ON f.id = n.id
      WHERE notes_fts MATCH ?
      ORDER BY rank
    `);
    // Preparamos la query para soportar prefijos (búsqueda mientras escribes)
    const sanitizedQuery = query.trim().split(/\s+/).map(q => `${q}*`).join(' ');
    return stmt.all(sanitizedQuery);
  },

  getBacklinks: (noteId: string) => {
    const stmt = db.prepare(`
      SELECT n.id, n.title, n.updatedAt
      FROM note_links l
      JOIN Notes n ON l.source_id = n.id
      WHERE l.target_id = ?
    `);
    return stmt.all(noteId);
  },

  // Fase 3: Tasks Dashboard
  scanTasks: () => {
    const notes = db.prepare('SELECT id, title, body FROM Notes').all() as {id: string, title: string, body: string}[];
    const tasks: any[] = [];
    
    for (const note of notes) {
      if (!note.body) continue;
      const lines = note.body.split('\n');
      let taskIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^(\s*)-\s*\[([ xX])\]\s*(.+)$/);
        if (match) {
          tasks.push({
            noteId: note.id,
            noteTitle: note.title,
            lineNumber: i,
            taskIndex: taskIndex++,
            checked: match[2] !== ' ',
            text: match[3].trim(),
          });
        }
      }
    }
    return tasks;
  },

  toggleTask: (noteId: string, lineNumber: number, checked: boolean) => {
    const note = db.prepare('SELECT body, title FROM Notes WHERE id = ?').get(noteId) as {body: string, title: string} | undefined;
    if (!note || !note.body) return false;
    
    const lines = note.body.split('\n');
    const line = lines[lineNumber];
    if (line === undefined) return false;
    
    // Reemplazar [ ] ↔ [x] o [X]
    lines[lineNumber] = checked
      ? line.replace(/\[\s\]/, '[x]')
      : line.replace(/\[[xX]\]/, '[ ]');
    
    const newBody = lines.join('\n');
    db.prepare('UPDATE Notes SET body = ?, updatedAt = ? WHERE id = ?')
      .run(newBody, Date.now(), noteId);
    
    // Re-sync FTS
    db.prepare('DELETE FROM notes_fts WHERE id = ?').run(noteId);
    db.prepare('INSERT INTO notes_fts (id, title, content) VALUES (?, ?, ?)')
      .run(noteId, note.title, newBody);
    
    return true;
  },

  // Templates
  getTemplates: () => {
    return db.prepare('SELECT * FROM Templates ORDER BY name ASC').all();
  },
  saveTemplate: (template: Template) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO Templates (id, name, content, isSystem, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(template.id, template.name, template.content, template.isSystem, template.createdAt, Date.now());
  },
  deleteTemplate: (id: string) => {
    db.prepare('DELETE FROM Templates WHERE id = ?').run(id);
  }
};

const closeDB = () => {
  if (db) {
    try {
      db.close();
      console.log('Γ£ª Database connection closed.');
    } catch (err) {
      console.error('Error closing database:', err);
    }
  }
};

export { initDB, databaseAPI, closeDB, getFallbackStatus };
