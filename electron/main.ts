import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import fs from 'fs';
import { join, basename } from 'path';




// Configuración de rutas robusta para CommonJS
process.env.DIST_ELECTRON = __dirname;
// En producción, 'dist' suele estar al mismo nivel que 'dist-electron'
process.env.DIST = join(__dirname, '../dist');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(__dirname, '../public')
  : process.env.DIST;

// Importar la base de datos usando require
import { initDB, databaseAPI, closeDB, getFallbackStatus } from './database';
import { testConnection, syncToGithub, importDbFromGithub } from './github';
import type { Note, Notebook, Tag } from './database';



// Catch unhandled errors to help debug production crashes
process.on('uncaughtException', (error) => {
  dialog.showErrorBox('Main Process Exception', error.message + '\n' + error.stack);
});
process.on('unhandledRejection', (reason) => {
  dialog.showErrorBox('Main Process Rejection', (reason as Error)?.message || String(reason));
});

// Intercomunicación Segura (IPC)
ipcMain.handle('get-notes', () => databaseAPI.getNotes())
ipcMain.handle('save-note', (_, note: Note) => databaseAPI.saveNote(note))
ipcMain.handle('get-notebooks', () => databaseAPI.getNotebooks())
ipcMain.handle('save-notebook', (_, nb: Notebook) => databaseAPI.saveNotebook(nb))
ipcMain.handle('delete-notebook', (_, id: string) => databaseAPI.deleteNotebook(id))
ipcMain.handle('delete-note', (_, id: string) => databaseAPI.deleteNote(id))
ipcMain.handle('db:moveNotebook', (_, id: string, parentId: string | null) => databaseAPI.moveNotebook(id, parentId));
ipcMain.handle('db:moveNote', (_, noteId: string, notebookId: string) => databaseAPI.moveNote(noteId, notebookId));
ipcMain.handle('db:updateNoteStatus', (_, noteId: string, status: string) => databaseAPI.updateNoteStatus(noteId, status));
ipcMain.handle('db:updateNoteReminder', (_, noteId: string, reminderAt: number | null) => databaseAPI.updateNoteReminder(noteId, reminderAt));
ipcMain.handle('db:getTags', () => databaseAPI.getTags());
ipcMain.handle('db:getNoteTags', () => databaseAPI.getNoteTags());
ipcMain.handle('db:createTag', (_, tag: Tag) => databaseAPI.createTag(tag));
ipcMain.handle('db:updateTag', (_, tag: Tag) => databaseAPI.updateTag(tag));
ipcMain.handle('db:deleteTag', (_, id: string) => databaseAPI.deleteTag(id));
ipcMain.handle('db:toggleNoteTag', (_, noteId: string, tagId: string) => databaseAPI.toggleNoteTag(noteId, tagId));
ipcMain.handle('db:isFallbackMode', () => getFallbackStatus());

// Fase 1: Handlers de Búsqueda y Conexiones
ipcMain.handle('db:search', (_, query: string) => databaseAPI.searchNotes(query));
ipcMain.handle('db:getBacklinks', (_, noteId: string) => databaseAPI.getBacklinks(noteId));

// GitHub Sync Handlers
ipcMain.handle('github:testConnection', (_, token: string) => testConnection(token));
ipcMain.handle('github:sync', async (_, { token, repoName, notes, syncMarkdown, syncDb }) => {
  const dbPath = getFallbackStatus() 
    ? join(process.cwd(), 'm3flow-fallback.db') 
    : join(app.getPath('userData'), 'm3flow.db');
  return syncToGithub(token, repoName, notes, dbPath, syncMarkdown, syncDb, (progress) => {
    if (win) win.webContents.send('github:progress', progress);
  });
});
ipcMain.handle('github:importDb', async (_, { token, repoName }) => {
  const dbPath = getFallbackStatus() 
    ? join(process.cwd(), 'm3flow-fallback.db') 
    : join(app.getPath('userData'), 'm3flow.db');
  
  // Cerrar conexión actual temporalmente para evitar locks
  closeDB();
  const result = await importDbFromGithub(token, repoName, dbPath);
  
  // Enviar mensaje para recargar la app por completo (forzar reinicio de UI y DB)
  if (result.success && win) {
    win.reload();
  }
  return result;
});

ipcMain.handle('window:close', () => win?.close());
ipcMain.handle('window:minimize', () => win?.minimize());
ipcMain.handle('window:maximize', () => {
  if (win?.isMaximized()) { win?.unmaximize(); } else { win?.maximize(); }
});

ipcMain.handle('export-markdown', async (_, { title, content }: { title: string, content: string }) => {
  const result = await dialog.showSaveDialog({
    title: 'Export active note to Markdown',
    defaultPath: `${title || 'untitled'}.md`,
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content);
    return true;
  }
  return false;
});

ipcMain.handle('export-pdf', async (_, { title }: { title: string }) => {
  const result = await dialog.showSaveDialog({
    title: 'Export active note to PDF',
    defaultPath: `${title || 'untitled'}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (!result.canceled && result.filePath) {
    try {
      const data = await win!.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        displayHeaderFooter: false
      });
      fs.writeFileSync(result.filePath, data);
      return true;
    } catch (error) {
      console.error('PDF Export Error:', error);
      return false;
    }
  }
  return false;
});

ipcMain.handle('import-workspace', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Workspace Folder',
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) return false;

  // Limpiar workspace actual para evitar duplicados
  databaseAPI.clearWorkspace();

  const rootPath = result.filePaths[0];
  const rootId = 'nb-' + Date.now();

  databaseAPI.saveNotebook({ id: rootId, name: basename(rootPath), parentId: null });

  const scanDir = (dirPath: string, pid: string) => {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules') continue;
      const fullPath = join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const sid = 'nb-' + Math.random().toString(36).substr(2, 9);
        databaseAPI.saveNotebook({ id: sid, name: item, parentId: pid });
        scanDir(fullPath, sid);
      } else if (item.endsWith('.md')) {
        const nid = 'note-' + Math.random().toString(36).substr(2, 9);
        const body = fs.readFileSync(fullPath, 'utf8');
        databaseAPI.saveNote({ id: nid, title: item.replace('.md', ''), body, notebookId: pid });
      }
    }
  };

  scanDir(rootPath, rootId);
  return true;
});

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    transparent: true,
    titleBarStyle: 'hidden',
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false
    },
  })

  // Interceptar navegación hacia enlaces externos
  win.webContents.on('will-navigate', (event, url) => {
    // Si la URL no es la del servidor de desarrollo o el archivo local, abrir externamente
    const isDev = process.env.VITE_DEV_SERVER_URL && url.startsWith(process.env.VITE_DEV_SERVER_URL);
    const isFile = url.startsWith('file://');

    if (!isDev && !isFile) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Interceptar window.open (clics con target="_blank")
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.once('ready-to-show', () => {
    win?.show();
  });

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    dialog.showErrorBox('Load Failure', `Failed to load: ${validatedURL}\nError: ${errorDescription} (${errorCode})`);
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win!.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    const indexPath = join(process.env.DIST as string, 'index.html');
    win!.loadFile(indexPath).catch((err: Error) => {
      dialog.showErrorBox('File Load Error', `Could not load index.html from: ${indexPath}\n${err.message}`);
    });
  }
}

let splashWin: BrowserWindow | null = null;

function createSplashWindow() {
  splashWin = new BrowserWindow({
    width: 500,
    height: 350,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    splashWin!.loadURL(`${process.env.VITE_DEV_SERVER_URL}splash.html`);
  } else {
    const splashPath = join(process.env.DIST as string, 'splash.html');
    splashWin!.loadFile(splashPath).catch((err: Error) => {
      console.error('Failed to load splash screen:', err);
    });
  }
  splashWin.center();
}

async function initializeApp() {
  createSplashWindow();

  const sendLog = (msg: string) => {
    if (splashWin && !splashWin.isDestroyed()) {
      splashWin.webContents.send('loading-log', msg);
    }
    console.log(`[Init] ${msg}`);
  };

  await new Promise(resolve => setTimeout(resolve, 500));

  sendLog('Cargando motor de base de datos...');
  try {
    initDB((msg) => sendLog(msg));
  } catch (err) {
    sendLog('⚠️ Error de DB: Iniciando en MODO NAVEGADOR (Memoria Temporal)');
    console.error('Database initialization failed:', err);
    // Notificamos a la ventana que use fallback web si es necesario
  }

  await new Promise(resolve => setTimeout(resolve, 300));
  sendLog('Preparando interfaz de usuario...');

  createWindow();

  // Esperar a que la ventana principal esté lista para mostrarse
  win!.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWin && !splashWin.isDestroyed()) {
        splashWin.close();
      }
      win!.show();
    }, 800); // Pequeño buffer para una transición suave
  });
}

app.whenReady().then(initializeApp)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// Asegurar cierre limpio de recursos
app.on('will-quit', () => {
  closeDB();
});

app.on('quit', () => {
  process.exit(0);
});
