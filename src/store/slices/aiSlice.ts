import type { StateCreator } from 'zustand';
import dbAPI from '../../services/db';
import type { AppState, AISlice } from '../types';
import { encryptVault, decryptVault } from '../../services/crypto';

export const createAISlice: StateCreator<
  AppState,
  [],
  [],
  AISlice
> = (set, get) => ({
  isAiPanelOpen: localStorage.getItem('isAiPanelOpen') === 'true',
  toggleAiPanel: (forceOpen) => set(state => {
    const newVal = typeof forceOpen === 'boolean' ? forceOpen : !state.isAiPanelOpen;
    localStorage.setItem('isAiPanelOpen', newVal ? 'true' : 'false');
    return { isAiPanelOpen: newVal };
  }),
  
  openAiKey: '',
  geminiKey: '',
  geminiModel: localStorage.getItem('geminiModel') || 'gemini-3.1-pro',
  geminiApiVersion: (localStorage.getItem('geminiApiVersion') as 'v1' | 'v1beta') || 'v1',
  claudeKey: '',
  githubToken: '',
  azureUrl: '',
  azureKey: '',
  ollamaUrl: localStorage.getItem('ollamaUrl') || 'http://localhost:11434',
  ollamaModel: localStorage.getItem('ollamaModel') || 'llama3',
  lmStudioUrl: localStorage.getItem('lmStudioUrl') || 'http://localhost:1234',
  webLlmModelUrl: localStorage.getItem('webLlmModelUrl') || '',
  activeAiProvider: (localStorage.getItem('activeAiProvider') as any) || 'ollama',
  
  isWebLlmLoaded: false,
  webLlmProgress: 0,
  webLlmStatusText: '',
  masterPassword: null,
  vaultUnlocked: false,
  vaultExists: false,

  checkVaultExists: async () => {
    if (dbAPI) {
      const payload = await dbAPI.getAiSettings();
      set({ vaultExists: !!payload });
    }
  },

  setMasterPassword: async (pwd) => {
    try {
        let payload = null;
      if (dbAPI) payload = await dbAPI.getAiSettings();

      if (payload) {
        const decrypted = await decryptVault(pwd, payload);
        set({ 
          ...decrypted,
          masterPassword: pwd,
          vaultUnlocked: true,
          vaultExists: true
        } as any);
      } else {
        set({ masterPassword: pwd, vaultUnlocked: true, vaultExists: true });
        const state = get();
        const dataToSave = {
          openAiKey: state.openAiKey,
          geminiKey: state.geminiKey,
          claudeKey: state.claudeKey,
          githubToken: state.githubToken,
          azureUrl: state.azureUrl,
          azureKey: state.azureKey
        };
        const newPayload = await encryptVault(pwd, dataToSave);
        if (dbAPI) await dbAPI.saveAiSettings(newPayload);
      }
      return true;
    } catch (e) {
      console.error('Wrong master password', e);
      return false;
    }
  },

  resetVault: async () => {
    if (dbAPI) await dbAPI.saveAiSettings(null);
    set({
      masterPassword: null,
      vaultUnlocked: false,
      vaultExists: false,
      openAiKey: '',
      geminiKey: '',
      claudeKey: '',
      githubToken: '',
      azureUrl: '',
      azureKey: ''
    });
    const keysToRemove = ['openAiKey', 'geminiKey', 'claudeKey', 'githubToken', 'azureUrl', 'azureKey'];
    keysToRemove.forEach(k => localStorage.removeItem(k));
  },
  
  pendingAiPrompt: null,
  setPendingAiPrompt: (prompt) => set({ pendingAiPrompt: prompt }),
  
  aiChatHistory: {},
  setAiChatHistory: (noteId, messages) => set(state => ({
    aiChatHistory: { ...state.aiChatHistory, [noteId]: messages }
  })),

  setAiConfig: async (key, value) => {
    set({ [key]: value } as any);
    
    // Si no es una key secreta, se guarda en localStorage normal
    const secretKeys = ['openAiKey', 'geminiKey', 'claudeKey', 'githubToken', 'azureUrl', 'azureKey'];
    if (!secretKeys.includes(key)) {
      localStorage.setItem(key, value);
      return;
    }

    // Si es secreta y la bóveda está desbloqueada, se encripta
    const state = get();
    if (state.vaultUnlocked && state.masterPassword) {
        const dataToSave = {
        openAiKey: state.openAiKey,
        geminiKey: state.geminiKey,
        claudeKey: state.claudeKey,
        githubToken: state.githubToken,
        azureUrl: state.azureUrl,
        azureKey: state.azureKey,
        [key]: value // override with latest just in case
      };
      try {
        const payload = await encryptVault(state.masterPassword, dataToSave);
        if (dbAPI) await dbAPI.saveAiSettings(payload);
      } catch (e) {
        console.error('Failed to encrypt/save AI settings', e);
      }
    }
  },
  
  setActiveAiProvider: (provider) => {
    set({ activeAiProvider: provider });
    localStorage.setItem('activeAiProvider', provider);
  },
  
  setWebLlmState: (newState) => {
    set((state) => ({ ...state, ...newState }));
  },
});
