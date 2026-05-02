import { create } from 'zustand';

interface Notebook {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

interface Note {
  id: string;
  title: string;
  body: string;
  notebookId: string;
  status: string;
  isPinned: number;
  reminderAt: number | null;
  createdAt: number;
  updatedAt: number;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface NoteTag {
  noteId: string;
  tagId: string;
}

interface AppState {
  notebooks: Notebook[];
  notes: Note[];
  tags: Tag[];
  noteTags: NoteTag[];
  isSidebarCollapsed: boolean;
  isNoteListCollapsed: boolean;
  toggleSidebar: () => void;
  toggleNoteList: () => void;
  isAiPanelOpen: boolean;
  toggleAiPanel: () => void;
  activeNotebookId: string | null;
  activeNoteId: string | null;
  activeStatusId: string | null;
  activeTagId: string | null;
  searchQuery: string;
  sortOrder: 'default' | 'alphabetical';
  editorMode: 'normal' | 'vim' | 'emacs';
  editorType: 'raw' | 'rich';
  theme: string;
  customColors: {
    sidebarBg: string;
    sidebarHeader: string;
    listBg: string;
    listHeader: string;
    editorBg: string;
    editorHeader: string;
    previewBg: string;
  };
  isCustomMenuOpen: boolean;
  editorFontSize: number;
  showHelpOverlay: boolean;
  showAboutModal: boolean;
  isFallbackMode: boolean;
  isBrowserMode: boolean;
  isSyncModalOpen: boolean;
  setSyncModalOpen: (val: boolean) => void;
  
  // GitHub Sync State
  githubSyncToken: string;
  githubSyncRepo: string;
  githubSyncMarkdown: boolean;
  githubSyncDb: boolean;
  syncStatus: 'idle' | 'pending' | 'syncing' | 'error' | 'success';
  syncErrorMsg: string | null;
  syncProgress: { current: number; total: number; message: string } | null;
  hasUnsyncedChanges: boolean;
  lastSyncTime: number | null;
  
  setGithubSyncConfig: (config: Partial<{githubSyncToken: string, githubSyncRepo: string, githubSyncMarkdown: boolean, githubSyncDb: boolean}>) => void;
  setSyncStatus: (status: 'idle' | 'pending' | 'syncing' | 'error' | 'success', errorMsg?: string | null) => void;
  setSyncProgress: (progress: { current: number; total: number; message: string } | null) => void;
  setUnsyncedChanges: (val: boolean) => void;
  triggerManualSync: () => Promise<void>;
  
  // AI Config
  openAiKey: string;
  geminiKey: string;
  claudeKey: string;
  githubToken: string;
  azureUrl: string;
  azureKey: string;
  ollamaUrl: string;
  ollamaModel: string;
  lmStudioUrl: string;
  webLlmModelUrl: string;
  activeAiProvider: 'ollama' | 'openai' | 'gemini' | 'claude' | 'lmstudio' | 'github' | 'azure' | 'webllm';
  
  // WebLLM State
  isWebLlmLoaded: boolean;
  webLlmProgress: number;
  webLlmStatusText: string;
  
  // Acciones
  setSearchQuery: (query: string) => void;
  setSortOrder: (order: 'default' | 'alphabetical') => void;
  setActiveNotebook: (id: string | null) => void;
  setActiveStatus: (statusId: string | null) => void;
  setActiveTag: (tagId: string | null) => void;
  setActiveNote: (id: string | null) => void;
  setEditorMode: (mode: 'normal' | 'vim' | 'emacs') => void;
  setEditorType: (type: 'raw' | 'rich') => void;
  setTheme: (theme: string) => void;
  setCustomColor: (key: string, color: string) => void;
  setCustomMenuOpen: (open: boolean) => void;
  setEditorFontSize: (size: number) => void;
  setShowHelpOverlay: (show: boolean) => void;
  setShowAboutModal: (show: boolean) => void;
  
  // AI Acciones
  setAiConfig: (key: string, value: string) => void;
  setActiveAiProvider: (provider: 'ollama' | 'openai' | 'gemini' | 'claude' | 'lmstudio' | 'github' | 'azure' | 'webllm') => void;
  setWebLlmState: (state: Partial<{isWebLlmLoaded: boolean, webLlmProgress: number, webLlmStatusText: string}>) => void;

  loadInitialData: () => Promise<void>;
  saveNote: (id: string, title: string, body: string) => Promise<void>;
  createNote: () => void;
  moveNotebook: (notebookId: string, newParentId: string | null) => Promise<void>;
  moveNote: (noteId: string, notebookId: string) => Promise<void>;
  updateNoteStatus: (noteId: string, status: string) => Promise<void>;
  createTag: (name: string, color: string) => Promise<string>;
  updateTag: (id: string, name: string, color: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  toggleNoteTag: (noteId: string, tagId: string) => Promise<void>;
  updateNoteReminder: (noteId: string, reminderAt: number | null) => Promise<void>;
  createNotebook: (name: string, parentId: string | null) => Promise<void>;
  deleteNote: (id: string | null) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  isSidebarCollapsed: false,
  isNoteListCollapsed: false,
  toggleSidebar: () => set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toggleNoteList: () => set(state => ({ isNoteListCollapsed: !state.isNoteListCollapsed })),
  isAiPanelOpen: localStorage.getItem('isAiPanelOpen') === 'true',
  toggleAiPanel: () => set(state => {
    const newVal = !state.isAiPanelOpen;
    localStorage.setItem('isAiPanelOpen', newVal ? 'true' : 'false');
    return { isAiPanelOpen: newVal };
  }),
  notebooks: [],
  notes: [],
  tags: [],
  noteTags: [],
  activeNotebookId: null,
  activeNoteId: null,
  activeStatusId: null,
  activeTagId: null,
  searchQuery: '',
  sortOrder: 'default',
  editorMode: (localStorage.getItem('editorMode') as any) || 'normal',
  editorType: (localStorage.getItem('editorType') as 'raw' | 'rich') || 'raw',
  theme: (localStorage.getItem('theme') as any) || 'cyber-ronin',
  customColors: JSON.parse(localStorage.getItem('customColors') || '{"sidebarBg":"#1e2329","sidebarHeader":"#171b1f","listBg":"#252b33","listHeader":"#1e2329","editorBg":"#15191e","editorHeader":"#1e2329","previewBg":"#1a1e24"}'),
  isCustomMenuOpen: false,
  editorFontSize: parseInt(localStorage.getItem('fontSize') || '14') || 14,
  showHelpOverlay: localStorage.getItem('hasSeenHelp') !== 'true',
  showAboutModal: false,
  isFallbackMode: false,
  isBrowserMode: false,
  isSyncModalOpen: false,

  // GitHub Sync Defaults
  githubSyncToken: localStorage.getItem('githubSyncToken') || '',
  githubSyncRepo: localStorage.getItem('githubSyncRepo') || 'm3flow-vault-backup',
  githubSyncMarkdown: localStorage.getItem('githubSyncMarkdown') !== 'false',
  githubSyncDb: localStorage.getItem('githubSyncDb') !== 'false',
  syncStatus: 'idle',
  syncErrorMsg: null,
  syncProgress: null,
  hasUnsyncedChanges: false,
  lastSyncTime: parseInt(localStorage.getItem('lastSyncTime') || '0') || null,

  // AI Defaults
  openAiKey: localStorage.getItem('openAiKey') || '',
  geminiKey: localStorage.getItem('geminiKey') || '',
  claudeKey: localStorage.getItem('claudeKey') || '',
  githubToken: localStorage.getItem('githubToken') || '',
  azureUrl: localStorage.getItem('azureUrl') || '',
  azureKey: localStorage.getItem('azureKey') || '',
  ollamaUrl: localStorage.getItem('ollamaUrl') || 'http://localhost:11434',
  ollamaModel: localStorage.getItem('ollamaModel') || 'llama3',
  lmStudioUrl: localStorage.getItem('lmStudioUrl') || 'http://localhost:1234',
  webLlmModelUrl: localStorage.getItem('webLlmModelUrl') || '',
  activeAiProvider: (localStorage.getItem('activeAiProvider') as any) || 'ollama',
  
  isWebLlmLoaded: false,
  webLlmProgress: 0,
  webLlmStatusText: '',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setActiveNotebook: (id) => set({ activeNotebookId: id, activeStatusId: null, activeTagId: null, activeNoteId: null }),
  setActiveStatus: (id) => set({ activeStatusId: id, activeNotebookId: null, activeTagId: null, activeNoteId: null }),
  setActiveTag: (id) => set({ activeTagId: id, activeNotebookId: null, activeStatusId: null, activeNoteId: null }),
  setActiveNote: (id) => set({ activeNoteId: id }),
  setSyncModalOpen: (val) => set({ isSyncModalOpen: val }),
  setEditorMode: (mode) => {
    localStorage.setItem('editorMode', mode);
    set({ editorMode: mode });
  },
  setEditorType: (type) => {
    localStorage.setItem('editorType', type);
    set({ editorType: type });
  },
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  setCustomColor: (key, color) => {
    const { customColors } = get();
    const newColors = { ...customColors, [key]: color };
    localStorage.setItem('customColors', JSON.stringify(newColors));
    set({ customColors: newColors });
  },
  setCustomMenuOpen: (open) => set({ isCustomMenuOpen: open }),
  setEditorFontSize: (size) => {
    localStorage.setItem('fontSize', size.toString());
    set({ editorFontSize: size });
  },
  setShowHelpOverlay: (show) => {
    localStorage.setItem('hasSeenHelp', 'true');
    set({ showHelpOverlay: show });
  },
  setShowAboutModal: (show) => set({ showAboutModal: show }),

  setAiConfig: (key, value) => {
    set({ [key]: value } as any);
    localStorage.setItem(key, value);
  },
  setActiveAiProvider: (provider) => {
    set({ activeAiProvider: provider });
    localStorage.setItem('activeAiProvider', provider);
  },
  setWebLlmState: (newState) => {
    set((state) => ({ ...state, ...newState }));
  },
  
  setGithubSyncConfig: (config) => {
    set((state) => {
      const newState = { ...state, ...config };
      if (config.githubSyncToken !== undefined) localStorage.setItem('githubSyncToken', config.githubSyncToken);
      if (config.githubSyncRepo !== undefined) localStorage.setItem('githubSyncRepo', config.githubSyncRepo);
      if (config.githubSyncMarkdown !== undefined) localStorage.setItem('githubSyncMarkdown', String(config.githubSyncMarkdown));
      if (config.githubSyncDb !== undefined) localStorage.setItem('githubSyncDb', String(config.githubSyncDb));
      return newState;
    });
  },
  setSyncStatus: (status, errorMsg = null) => set({ syncStatus: status, syncErrorMsg: errorMsg }),
  setSyncProgress: (progress) => set({ syncProgress: progress }),
  setUnsyncedChanges: (val) => set({ hasUnsyncedChanges: val }),
  
  triggerManualSync: async () => {
    const state = get();
    if (!state.githubSyncToken || !state.githubSyncRepo) return;
    
    set({ syncStatus: 'syncing', syncProgress: { current: 0, total: 100, message: 'Starting sync...' } });
    try {
      const dbAPI = (window as any).dbAPI;
      const result = await dbAPI.githubSync({
        token: state.githubSyncToken,
        repoName: state.githubSyncRepo,
        notes: state.notes,
        syncMarkdown: state.githubSyncMarkdown,
        syncDb: state.githubSyncDb
      });
      
      if (result.success) {
        const now = Date.now();
        localStorage.setItem('lastSyncTime', String(now));
        set({ syncStatus: 'success', syncErrorMsg: null, hasUnsyncedChanges: false, lastSyncTime: now, syncProgress: null });
        setTimeout(() => set({ syncStatus: 'idle' }), 3000);
      } else {
        set({ syncStatus: 'error', syncErrorMsg: result.error, syncProgress: null });
      }
    } catch (e: any) {
      set({ syncStatus: 'error', syncErrorMsg: e.message, syncProgress: null });
    }
  },

  loadInitialData: async () => {
    try {
      const dbAPI = (window as any).dbAPI;
      if (!dbAPI) {
        console.warn('dbAPI no detectado. Activando Modo Navegador (Local Storage Fallback)');
        set({ isBrowserMode: true });
        // Intentar cargar de localStorage si existe
        const saved = localStorage.getItem('m3flow_web_bridge');
        if (saved) {
          const data = JSON.parse(saved);
          set({ notebooks: data.notebooks || [], notes: data.notes || [], tags: data.tags || [], noteTags: data.noteTags || [] });
        }
        return;
      }

      const isFallback = await dbAPI.isFallbackMode();
      set({ isFallbackMode: isFallback });

      const [notebooks, notes, tags, noteTags] = await Promise.all([
        dbAPI.getNotebooks(),
        dbAPI.getNotes(),
        dbAPI.getTags ? dbAPI.getTags() : [],
        dbAPI.getNoteTags ? dbAPI.getNoteTags() : []
      ]);
      set({ notebooks, notes, tags, noteTags });
      
      // Auto-seleccionar primer elemento
      if (notebooks.length > 0) {
        set({ activeNotebookId: notebooks[0].id });
      }
      if (notes.length > 0) {
        set({ activeNoteId: notes[0].id });
      }
    } catch (e) {
      console.error('Error cargando SQLite, activando Modo Navegador', e);
      set({ isBrowserMode: true });
    }
  },

  saveNote: async (id, title, body) => {
    const { notes } = get();
    const existingNote = notes.find(n => n.id === id);
    let targetNbId = existingNote ? existingNote.notebookId : null;

    if (!existingNote) {
       // Si por alguna razón no existía (no debería ocurrir)
       const { activeNotebookId, notebooks } = get();
       targetNbId = activeNotebookId || (notebooks.length > 0 ? notebooks[0].id : null);
    }

    await (window as any).dbAPI.saveNote({
      id,
      title,
      body,
      notebookId: targetNbId,
    });
    
    // Actualizar estado local
    set({
      notes: notes.map((n) => n.id === id ? { ...n, title, body, updatedAt: Date.now() } : n),
      hasUnsyncedChanges: true,
      syncStatus: get().syncStatus !== 'error' ? 'pending' : 'error'
    });
  },

  createNote: async () => {
    const { activeNotebookId, notes, notebooks } = get();
    const newId = 'note-' + Date.now();
    const defaultNbId = notebooks.length > 0 ? notebooks[0].id : null;
    const targetNbId = activeNotebookId || defaultNbId;

    const newNote = {
      id: newId,
      title: 'Untitled Note',
      body: '# Untitled Note\n\nStart typing here...',
      notebookId: targetNbId as any, // fallback a null si no hay notebooks
      status: 'none',
      isPinned: 0,
      reminderAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await (window as any).dbAPI.saveNote(newNote);
    
    set({
      notes: [newNote, ...notes],
      activeNoteId: newId,
      hasUnsyncedChanges: true,
      syncStatus: get().syncStatus !== 'error' ? 'pending' : 'error'
    });
  },

  moveNotebook: async (notebookId, newParentId) => {
    if (notebookId === newParentId) return;
    set(state => ({
      notebooks: state.notebooks.map(nb => 
        nb.id === notebookId ? { ...nb, parentId: newParentId } : nb
      )
    }));
    try {
      if ((window as any).dbAPI.moveNotebook) {
        await (window as any).dbAPI.moveNotebook(notebookId, newParentId);
      }
    } catch(e) { console.error('[store] moveNotebook error:', e); }
  },
  moveNote: async (noteId, notebookId) => {
    set(state => ({
      notes: state.notes.map(n => n.id === noteId ? { ...n, notebookId, updatedAt: Date.now() } : n)
    }));
    try {
      if ((window as any).dbAPI.moveNote) await (window as any).dbAPI.moveNote(noteId, notebookId);
    } catch(e) { console.error('[store] moveNote error:', e); }
  },
  updateNoteStatus: async (noteId, status) => {
    set(state => ({
      notes: state.notes.map(n => n.id === noteId ? { ...n, status, updatedAt: Date.now() } : n)
    }));
    try {
      if ((window as any).dbAPI.updateNoteStatus) await (window as any).dbAPI.updateNoteStatus(noteId, status);
    } catch(e) { console.error('[store] updateNoteStatus error:', e); }
  },
  updateNoteReminder: async (noteId, reminderAt) => {
    set(state => ({
      notes: state.notes.map(n => n.id === noteId ? { ...n, reminderAt, updatedAt: Date.now() } : n)
    }));
    try {
      if ((window as any).dbAPI.updateNoteReminder) await (window as any).dbAPI.updateNoteReminder(noteId, reminderAt);
    } catch(e) { console.error('[store] updateNoteReminder error:', e); }
  },
  createTag: async (name, color) => {
    const id = 'tag-' + Date.now();
    const newTag = { id, name, color };
    set(state => ({ tags: [...state.tags, newTag] }));
    try {
      if ((window as any).dbAPI.createTag) await (window as any).dbAPI.createTag(newTag);
    } catch(e) { console.error('[store] createTag error:', e); }
    return id;
  },
  updateTag: async (id, name, color) => {
    set(state => ({ tags: state.tags.map(t => t.id === id ? { ...t, name, color } : t) }));
    try {
      if ((window as any).dbAPI.updateTag) await (window as any).dbAPI.updateTag({ id, name, color });
    } catch(e) { console.error('[store] updateTag error:', e); }
  },
  deleteTag: async (id) => {
    set(state => ({ 
      tags: state.tags.filter(t => t.id !== id),
      noteTags: state.noteTags.filter(nt => nt.tagId !== id)
    }));
    try {
      if ((window as any).dbAPI.deleteTag) await (window as any).dbAPI.deleteTag(id);
    } catch(e) { console.error('[store] deleteTag error:', e); }
  },
  toggleNoteTag: async (noteId, tagId) => {
    set(state => {
      const exists = state.noteTags.find(nt => nt.noteId === noteId && nt.tagId === tagId);
      if (exists) {
        return { noteTags: state.noteTags.filter(nt => !(nt.noteId === noteId && nt.tagId === tagId)) };
      }
      return { noteTags: [...state.noteTags, { noteId, tagId }] };
    });
    try {
      if ((window as any).dbAPI.toggleNoteTag) await (window as any).dbAPI.toggleNoteTag(noteId, tagId);
    } catch(e) { console.error('[store] toggleNoteTag error:', e); }
  },
  createNotebook: async (name, parentId) => {
    const id = 'nb-' + Date.now();
    const newNB = { id, name, parentId, createdAt: Date.now() };
    set(state => ({ notebooks: [...state.notebooks, newNB] }));
    try {
      const dbAPI = (window as any).dbAPI;
      if (dbAPI && dbAPI.saveNotebook) await dbAPI.saveNotebook(newNB);
    } catch(e) { console.error('[store] createNotebook error:', e); }
  },
  deleteNote: async (id) => {
    if (!id) return;
    set(state => ({ 
      notes: state.notes.filter(n => n.id !== id),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
      hasUnsyncedChanges: true,
      syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error'
    }));
    try {
      const dbAPI = (window as any).dbAPI;
      if (dbAPI && dbAPI.deleteNote) await dbAPI.deleteNote(id);
    } catch(e) { console.error('[store] deleteNote error:', e); }
  },
  deleteNotebook: async (id) => {
    set(state => ({ 
      notebooks: state.notebooks.filter(nb => nb.id !== id),
      notes: state.notes.filter(n => n.notebookId !== id),
      activeNotebookId: state.activeNotebookId === id ? null : state.activeNotebookId,
      hasUnsyncedChanges: true,
      syncStatus: state.syncStatus !== 'error' ? 'pending' : 'error'
    }));
    try {
      const dbAPI = (window as any).dbAPI;
      if (dbAPI && dbAPI.deleteNotebook) await dbAPI.deleteNotebook(id);
    } catch(e) { console.error('[store] deleteNotebook error:', e); }
  }
}));
