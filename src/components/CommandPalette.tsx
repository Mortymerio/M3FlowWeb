import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'notes' | 'commands'>('notes');
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const setActiveNote = useStore(state => state.setActiveNote);
  const setActiveNotebook = useStore(state => state.setActiveNotebook);
  const setSearchQuery = useStore(state => state.setSearchQuery);
  const searchResults = useStore(state => state.searchResults);
  const clearSearchResults = useStore(state => state.clearSearchResults);
  const notes = useStore(state => state.notes);
  
  // Phase 5: Command Mode actions
  const openTab = useStore(state => state.openTab);
  const setTheme = useStore(state => state.setTheme);
  const theme = useStore(state => state.theme);
  const createNote = useStore(state => state.createNote);
  const closeTab = useStore(state => state.closeTab);
  const activeTabId = useStore(state => state.activeTabId);
  
  // Extended actions
  const toggleSidebar = useStore(state => state.toggleSidebar);
  const toggleNoteList = useStore(state => state.toggleNoteList);
  const toggleAiPanel = useStore(state => state.toggleAiPanel);
  const setSyncModalOpen = useStore(state => state.setSyncModalOpen);
  const setTemplatesModalOpen = useStore(state => state.setTemplatesModalOpen);
  const setEditorMode = useStore(state => state.setEditorMode);
  const openDailyNote = useStore(state => state.openDailyNote);
  const openMeetingNote = useStore(state => state.openMeetingNote);
  const setShowHelpOverlay = useStore(state => state.setShowHelpOverlay);
  const setShowAboutModal = useStore(state => state.setShowAboutModal);
  const createNotebook = useStore(state => state.createNotebook);

  const inputRef = useRef<HTMLInputElement>(null);

  // Escuchar 'Ctrl+P' o 'Cmd+P' globalmente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setQuery('');
        clearSearchResults();
        setMode(e.shiftKey ? 'commands' : 'notes');
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const COMMANDS = [
    // Tabs & Navigation
    { id: 'tasks', title: 'Open Tasks Dashboard', icon: '☑️', action: () => openTab({ type: 'tasks', title: 'Tasks' }) },
    { id: 'close_tab', title: 'Close Current Tab', icon: '❌', action: () => { if(activeTabId) closeTab(activeTabId); } },
    
    // Note Management
    { id: 'new_note', title: 'Create New Note', icon: '➕', action: () => createNote() },
    { id: 'daily_note', title: 'Open Daily Note', icon: '📅', action: () => openDailyNote() },
    { id: 'meeting_note', title: 'Open Meeting Note', icon: '👥', action: () => openMeetingNote() },
    
    // Layout & UI
    { id: 'theme', title: 'Toggle Theme (Light/Dark)', icon: '🎨', action: () => setTheme(theme === 'midnight-indigo' ? 'zen-light' : 'midnight-indigo') },
    { id: 'toggle_sidebar', title: 'Toggle Sidebar', icon: '⬅️', action: () => toggleSidebar() },
    { id: 'toggle_notelist', title: 'Toggle Note List', icon: '📑', action: () => toggleNoteList() },
    { id: 'toggle_ai', title: 'Toggle AI Panel', icon: '✨', action: () => toggleAiPanel() },
    
    // Tools & Settings
    { id: 'github_sync', title: 'GitHub Sync Settings', icon: '☁️', action: () => setSyncModalOpen(true) },
    { id: 'templates', title: 'Manage Templates', icon: '📋', action: () => setTemplatesModalOpen(true) },
    { id: 'vim_mode', title: 'Enable VIM Mode', icon: '⌨️', action: () => setEditorMode('vim') },
    { id: 'normal_mode', title: 'Enable Normal Mode', icon: '📝', action: () => setEditorMode('normal') },
    
    // Organization
    { id: 'new_notebook', title: 'Create Notebook', icon: '📁', action: () => createNotebook('New Notebook', null) },
    
    // Help
    { id: 'help', title: 'Show Shortcuts Help', icon: '❓', action: () => setShowHelpOverlay(true) },
    { id: 'about', title: 'About M3Flow', icon: 'ℹ️', action: () => setShowAboutModal(true) }
  ];

  const isCommandMode = mode === 'commands';
  let filteredItems: any[] = [];

  if (isCommandMode) {
    const cmdQuery = query.trim().toLowerCase();
    filteredItems = COMMANDS.filter(c => c.title.toLowerCase().includes(cmdQuery)).map(c => ({ ...c, itemType: 'command' }));
  } else {
    const noteMatches = query 
      ? (searchResults.length > 0 ? searchResults : notes.filter(n => n.title.toLowerCase().includes(query.toLowerCase())))
      : notes.slice(0, 10); // Mostrar recientes si está vacío
    filteredItems = noteMatches.map(n => ({ ...n, itemType: 'note' }));
  }

  const handleSelect = (item: any) => {
    if (item.itemType === 'command') {
      item.action();
    } else {
      setActiveNotebook(item.notebookId); // Cambiar al notebook correcto
      setTimeout(() => setActiveNote(item.id), 10); // Seleccionar la nota
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 0, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  const titleOrName = (item: any) => {
    if (item.itemType === 'command') return item.title;
    return item.title || 'Untitled';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
         onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-xl bg-[#222222] border border-[#333] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[#333]">
          <span className="text-gray-400 mr-3">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              const val = e.target.value;
              setQuery(val);
              if (mode === 'notes') setSearchQuery(val); // Disparar FTS solo en notas
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={isCommandMode ? "Search commands... (Ctrl+Shift+P)" : "Search all notes... (Ctrl+P)"}
            className="flex-1 bg-transparent border-none outline-none text-gray-200 text-base"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto w-full py-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              No results found
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div 
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-4 py-3 mx-2 rounded cursor-pointer transition-colors ${idx === selectedIndex ? 'bg-[#333] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{item.itemType === 'command' ? item.icon : '📄'}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{titleOrName(item)}</span>
                      {item.itemType === 'note' && item.highlight && (
                        <span 
                          className="text-xs text-gray-500 line-clamp-1 italic"
                          dangerouslySetInnerHTML={{ __html: item.highlight.replace(/==/g, '<mark class="bg-yellow-500/30 text-yellow-200 rounded px-0.5">').replace(/==/g, '</mark>') }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-xs opacity-50 px-2 py-0.5 bg-black/20 rounded">
                    {item.itemType === 'command' ? 'Run ↵' : 'Jump ↵'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="bg-[#1a1a1a] px-4 py-2 text-xs text-gray-500 flex justify-between border-t border-[#333]">
          <span><kbd className="bg-[#333] px-1 rounded mr-1">↑↓</kbd> to navigate</span>
          <span><kbd className="bg-[#333] px-1 rounded mr-1">↵</kbd> to select</span>
          <span><kbd className="bg-[#333] px-1 rounded mr-1">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
