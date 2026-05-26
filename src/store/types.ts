export interface Notebook {
  id: string;
  name: string;
  parentId: string | null;
  config?: string; // JSON string con prompt, tema, etc.
  createdAt: number;
}

export interface Note {
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

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface NoteTag {
  noteId: string;
  tagId: string;
}

export interface UISlice {
  isSidebarCollapsed: boolean;
  isNoteListCollapsed: boolean;
  toggleSidebar: () => void;
  toggleNoteList: () => void;
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
  isNotebookContextModalOpen: boolean;
  contextNotebookId: string | null;
  setNotebookContextModal: (isOpen: boolean, notebookId?: string | null) => void;
  isTemplatesModalOpen: boolean;
  setTemplatesModalOpen: (val: boolean) => void;
  setEditorMode: (mode: 'normal' | 'vim' | 'emacs') => void;
  setEditorType: (type: 'raw' | 'rich') => void;
  setTheme: (theme: string) => void;
  setCustomColor: (key: string, color: string) => void;
  setCustomMenuOpen: (open: boolean) => void;
  setEditorFontSize: (size: number) => void;
  setShowHelpOverlay: (show: boolean) => void;
  setShowAboutModal: (show: boolean) => void;
}

export interface DataSlice {
  notebooks: Notebook[];
  notes: Note[];
  tags: Tag[];
  noteTags: NoteTag[];
  templates: any[];
  activeNotebookId: string | null;
  activeNoteId: string | null;
  activeStatusId: string | null;
  activeTagId: string | null;
  searchQuery: string;
  sortOrder: 'default' | 'alphabetical';
  ftsQuery: string;
  searchResults: any[];
  currentBacklinks: any[];
  loadBacklinks: (noteId: string) => Promise<void>;
  clearSearchResults: () => void;
  noteHistory: Record<string, { body: string; timestamp: number }[]>;
  revertToHistory: (noteId: string, index: number) => void;
  setSearchQuery: (query: string) => void;
  setSortOrder: (order: 'default' | 'alphabetical') => void;
  setActiveNotebook: (id: string | null) => void;
  setActiveStatus: (statusId: string | null) => void;
  setActiveTag: (tagId: string | null) => void;
  setActiveNote: (id: string | null) => void;
  loadInitialData: () => Promise<void>;
  saveNote: (id: string, title: string, body: string, skipHistory?: boolean) => Promise<void>;
  createNote: () => void;
  moveNotebook: (notebookId: string, newParentId: string | null) => Promise<void>;
  moveNote: (noteId: string, notebookId: string) => Promise<void>;
  updateNoteStatus: (noteId: string, status: string) => Promise<void>;
  createTag: (name: string, color: string) => Promise<string>;
  updateTag: (id: string, name: string, color: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  toggleNoteTag: (noteId: string, tagId: string) => Promise<void>;
  updateNoteReminder: (noteId: string, reminderAt: number | null) => Promise<void>;
  createNotebook: (name: string, parentId: string | null, config?: any) => Promise<void>;
  updateNotebook: (id: string, name: string, parentId: string | null, config?: any) => Promise<void>;
  deleteNote: (id: string | null) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;
  openDailyNote: () => Promise<void>;
  openMeetingNote: () => Promise<void>;
  saveTemplate: (template: any) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}

export interface SyncSlice {
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
}

export interface AISlice {
  isAiPanelOpen: boolean;
  toggleAiPanel: (forceOpen?: boolean) => void;
  openAiKey: string;
  geminiKey: string;
  geminiModel: string;
  geminiApiVersion: 'v1' | 'v1beta';
  claudeKey: string;
  githubToken: string;
  azureUrl: string;
  azureKey: string;
  ollamaUrl: string;
  ollamaModel: string;
  lmStudioUrl: string;
  webLlmModelUrl: string;
  activeAiProvider: 'ollama' | 'openai' | 'gemini' | 'claude' | 'lmstudio' | 'github' | 'azure' | 'webllm';
  isWebLlmLoaded: boolean;
  webLlmProgress: number;
  webLlmStatusText: string;
  pendingAiPrompt: string | null;
  setPendingAiPrompt: (prompt: string | null) => void;
  aiChatHistory: Record<string, { id: string; role: 'user' | 'ai'; text: string; timestamp: number }[]>;
  setAiChatHistory: (noteId: string, messages: { id: string; role: 'user' | 'ai'; text: string; timestamp: number }[]) => void;
  setAiConfig: (key: string, value: string) => void;
  setActiveAiProvider: (provider: 'ollama' | 'openai' | 'gemini' | 'claude' | 'lmstudio' | 'github' | 'azure' | 'webllm') => void;
  setWebLlmState: (state: Partial<{isWebLlmLoaded: boolean, webLlmProgress: number, webLlmStatusText: string}>) => void;
}

export type AppState = UISlice & DataSlice & SyncSlice & AISlice;
