import type { StateCreator } from 'zustand';
import type { AppState, SyncSlice } from '../types';

export const createSyncSlice: StateCreator<
  AppState,
  [],
  [],
  SyncSlice
> = (set, get) => ({
  githubSyncToken: localStorage.getItem('githubSyncToken') || '',
  githubSyncRepo: localStorage.getItem('githubSyncRepo') || 'm3flow-vault-backup',
  githubSyncMarkdown: localStorage.getItem('githubSyncMarkdown') !== 'false',
  githubSyncDb: localStorage.getItem('githubSyncDb') !== 'false',
  syncStatus: 'idle',
  syncErrorMsg: null,
  syncProgress: null,
  hasUnsyncedChanges: false,
  lastSyncTime: parseInt(localStorage.getItem('lastSyncTime') || '0') || null,

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
        notebooks: state.notebooks,
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
});
