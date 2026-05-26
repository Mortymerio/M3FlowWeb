import type { StateCreator } from 'zustand';
import type { AppState, AISlice } from '../types';

export const createAISlice: StateCreator<
  AppState,
  [],
  [],
  AISlice
> = (set) => ({
  isAiPanelOpen: localStorage.getItem('isAiPanelOpen') === 'true',
  toggleAiPanel: (forceOpen) => set(state => {
    const newVal = typeof forceOpen === 'boolean' ? forceOpen : !state.isAiPanelOpen;
    localStorage.setItem('isAiPanelOpen', newVal ? 'true' : 'false');
    return { isAiPanelOpen: newVal };
  }),
  
  openAiKey: localStorage.getItem('openAiKey') || '',
  geminiKey: localStorage.getItem('geminiKey') || '',
  geminiModel: localStorage.getItem('geminiModel') || 'gemini-3.1-pro',
  geminiApiVersion: (localStorage.getItem('geminiApiVersion') as 'v1' | 'v1beta') || 'v1',
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
  
  pendingAiPrompt: null,
  setPendingAiPrompt: (prompt) => set({ pendingAiPrompt: prompt }),
  
  aiChatHistory: {},
  setAiChatHistory: (noteId, messages) => set(state => ({
    aiChatHistory: { ...state.aiChatHistory, [noteId]: messages }
  })),

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
});
