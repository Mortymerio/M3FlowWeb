import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// Tipado y Exposición segura hacia el explorador
try {
  console.log('[Preload] Attempting to expose dbAPI...');
  contextBridge.exposeInMainWorld('dbAPI', {
    getNotes: () => ipcRenderer.invoke('get-notes'),
    saveNote: (note: any) => ipcRenderer.invoke('save-note', note),
    getNotebooks: () => ipcRenderer.invoke('get-notebooks'),
    exportMarkdown: (title: string, content: string) => ipcRenderer.invoke('export-markdown', { title, content }),
    exportPDF: (title: string) => ipcRenderer.invoke('export-pdf', { title }),
    importWorkspace: () => ipcRenderer.invoke('import-workspace'),
    moveNotebook: (id: string, parentId: string | null) => ipcRenderer.invoke('move-notebook', { id, parentId }),
    moveNote: (noteId: string, notebookId: string) => ipcRenderer.invoke('db:moveNote', noteId, notebookId),
    updateNoteStatus: (noteId: string, status: string) => ipcRenderer.invoke('db:updateNoteStatus', noteId, status),
    updateNoteReminder: (noteId: string, reminderAt: number | null) => ipcRenderer.invoke('db:updateNoteReminder', noteId, reminderAt),
    getTags: () => ipcRenderer.invoke('db:getTags'),
    getNoteTags: () => ipcRenderer.invoke('db:getNoteTags'),
    createTag: (tag: any) => ipcRenderer.invoke('db:createTag', tag),
    updateTag: (tag: any) => ipcRenderer.invoke('db:updateTag', tag),
    deleteTag: (id: string) => ipcRenderer.invoke('db:deleteTag', id),
    toggleNoteTag: (noteId: string, tagId: string) => ipcRenderer.invoke('db:toggleNoteTag', noteId, tagId),
    deleteNote: (id: string) => ipcRenderer.invoke('delete-note', id),
    deleteNotebook: (id: string) => ipcRenderer.invoke('delete-notebook', id),
    saveNotebook: (nb: any) => ipcRenderer.invoke('save-notebook', nb),
    closeApp: () => ipcRenderer.invoke('window:close'),
    minimizeApp: () => ipcRenderer.invoke('window:minimize'),
    maximizeApp: () => ipcRenderer.invoke('window:maximize'),
    isFallbackMode: () => ipcRenderer.invoke('db:isFallbackMode'),
    githubTestConnection: (token: string) => ipcRenderer.invoke('github:testConnection', token),
    githubSync: (opts: any) => ipcRenderer.invoke('github:sync', opts),
    githubImportDb: (opts: any) => ipcRenderer.invoke('github:importDb', opts),
    onGithubProgress: (callback: (data: { current: number; total: number; message: string }) => void) => {
      ipcRenderer.on('github:progress', (_, data) => callback(data));
    },
  })
  console.log('[Preload] dbAPI exposed successfully.');
} catch (error) {
  console.error('[Preload] Failed to expose dbAPI:', error);
}

// APIs específicas para la ventana de carga (Splash)
contextBridge.exposeInMainWorld('electronAPI', {
  onLoadingLog: (callback: (message: string) => void) => {
    ipcRenderer.on('loading-log', (_event, message) => callback(message));
  }
});
