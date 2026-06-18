import type { StateCreator } from 'zustand';
import type { AppState, UISlice } from '../types';

export const createUISlice: StateCreator<
  AppState,
  [],
  [],
  UISlice
> = (set, get) => ({
  isSidebarCollapsed: false,
  isNoteListCollapsed: false,
  toggleSidebar: () => set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toggleNoteList: () => set(state => ({ isNoteListCollapsed: !state.isNoteListCollapsed })),
  toggleZenMode: () => set((state) => {
    const isZen = state.isSidebarCollapsed && state.isNoteListCollapsed;
    return {
      isSidebarCollapsed: !isZen,
      isNoteListCollapsed: !isZen
    };
  }),
  
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
  setSyncModalOpen: (val) => set({ isSyncModalOpen: val }),
  
  isNotebookContextModalOpen: false,
  contextNotebookId: null,
  setNotebookContextModal: (isOpen, notebookId = null) => set({ isNotebookContextModalOpen: isOpen, contextNotebookId: notebookId }),
  
  isTemplatesModalOpen: false,
  setTemplatesModalOpen: (val) => set({ isTemplatesModalOpen: val }),
  
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
});
