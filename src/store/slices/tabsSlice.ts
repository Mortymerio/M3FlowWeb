import type { StateCreator } from 'zustand';
import type { AppState, TabsSlice, Tab } from '../types';

export const createTabsSlice: StateCreator<
  AppState,
  [],
  [],
  TabsSlice
> = (set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (partial) => {
    const { tabs } = get();

    // If it's a note tab, check if already open
    if (partial.type === 'note' && partial.noteId) {
      const existing = tabs.find(t => t.type === 'note' && t.noteId === partial.noteId);
      if (existing) {
        // Just activate it
        get().setActiveTab(existing.id);
        return;
      }
    }

    // If it's a tasks tab, check if already open
    if (partial.type === 'tasks') {
      const existing = tabs.find(t => t.type === 'tasks');
      if (existing) {
        get().setActiveTab(existing.id);
        return;
      }
    }

    const newTab: Tab = {
      id: 'tab-' + crypto.randomUUID().slice(0, 8),
      type: partial.type,
      noteId: partial.noteId,
      title: partial.title,
      scrollPos: 0,
      viewMode: partial.viewMode || 'split',
    };

    set({ tabs: [...tabs, newTab] });
    get().setActiveTab(newTab.id);
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;

    const nextTabs = tabs.filter(t => t.id !== tabId);
    set({ tabs: nextTabs });

    // If we closed the active tab, activate an adjacent one
    if (activeTabId === tabId) {
      if (nextTabs.length === 0) {
        set({ activeTabId: null, activeNoteId: null } as any);
      } else {
        // Prefer the tab to the left, or the first one
        const nextIdx = Math.min(idx, nextTabs.length - 1);
        get().setActiveTab(nextTabs[nextIdx].id);
      }
    }
  },

  setActiveTab: (tabId) => {
    const { tabs } = get();
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    set({ activeTabId: tabId });

    // Sync activeNoteId for backward compatibility
    if (tab.type === 'note' && tab.noteId) {
      set({ activeNoteId: tab.noteId } as any);
    }
  },

  closeOtherTabs: (keepTabId) => {
    const { tabs } = get();
    const keep = tabs.find(t => t.id === keepTabId);
    if (!keep) return;

    set({ tabs: [keep] });
    get().setActiveTab(keepTabId);
  },

  updateTabTitle: (tabId, title) => {
    set(state => ({
      tabs: state.tabs.map(t => t.id === tabId ? { ...t, title } : t),
    }));
  },

  updateTabScrollPos: (tabId, scrollPos) => {
    set(state => ({
      tabs: state.tabs.map(t => t.id === tabId ? { ...t, scrollPos } : t),
    }));
  },
});
