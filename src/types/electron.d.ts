/**
 * Type declarations for the Electron preload bridge (window.dbAPI).
 * Eliminates all `(window as any).dbAPI` casts across the codebase.
 */

interface DbAPI {
  // Notes CRUD
  getNotes: () => Promise<any[]>;
  saveNote: (note: { id: string; title: string; body: string; notebookId: string | null; status?: string; reminderAt?: number | null }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  moveNote: (noteId: string, notebookId: string) => Promise<void>;
  updateNoteStatus: (noteId: string, status: string) => Promise<void>;
  updateNoteReminder: (noteId: string, reminderAt: number | null) => Promise<void>;

  // Notebooks CRUD
  getNotebooks: () => Promise<any[]>;
  saveNotebook: (nb: { id: string; name: string; parentId: string | null; config?: string | null; createdAt?: number }) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;
  moveNotebook: (notebookId: string, parentId: string | null) => Promise<void>;

  // Tags
  getTags: () => Promise<any[]>;
  getNoteTags: () => Promise<any[]>;
  createTag: (tag: { id: string; name: string; color: string }) => Promise<void>;
  updateTag: (tag: { id: string; name: string; color: string }) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  toggleNoteTag: (noteId: string, tagId: string) => Promise<void>;

  // Search & Backlinks
  searchNotes: (query: string) => Promise<any[]>;
  getBacklinks: (noteId: string) => Promise<any[]>;

  // Export
  exportMarkdown: (title: string, content: string) => Promise<boolean>;
  exportPDF: (title: string) => Promise<boolean>;
  importWorkspace: () => Promise<boolean>;

  // Window controls
  closeApp: () => Promise<void>;
  minimizeApp: () => Promise<void>;
  maximizeApp: () => Promise<void>;

  // System
  isFallbackMode: () => Promise<boolean>;

  // GitHub Sync
  githubTestConnection: (token: string) => Promise<{ success: boolean; username?: string; error?: string }>;
  githubSync: (opts: any) => Promise<{ success: boolean; error?: string }>;
  githubImportDb: (opts: any) => Promise<{ success: boolean; error?: string }>;
  githubRecoverNotes: (opts: any) => Promise<{ success: boolean; count?: number; error?: string }>;
  onGithubProgress: (callback: (data: { current: number; total: number; message: string }) => void) => void;
}

declare global {
  interface Window {
    dbAPI: DbAPI;
  }
}

export {};
