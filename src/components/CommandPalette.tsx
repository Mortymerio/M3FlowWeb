import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const setActiveNote = useStore(state => state.setActiveNote);
  const setActiveNotebook = useStore(state => state.setActiveNotebook);
  const setSearchQuery = useStore(state => state.setSearchQuery);
  const searchResults = useStore(state => state.searchResults);
  const clearSearchResults = useStore(state => state.clearSearchResults);
  const notes = useStore(state => state.notes);

  const inputRef = useRef<HTMLInputElement>(null);

  // Escuchar 'Ctrl+P' o 'Cmd+P' globalmente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setQuery('');
        clearSearchResults();
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

  const filteredNotes = query 
    ? (searchResults.length > 0 ? searchResults : notes.filter(n => n.title.toLowerCase().includes(query.toLowerCase())))
    : notes.slice(0, 10); // Mostrar recientes si está vacío

  const handleSelect = (noteId: string, notebookId: string) => {
    setActiveNotebook(notebookId); // Cambiar al notebook correcto
    setTimeout(() => setActiveNote(noteId), 10); // Seleccionar la nota
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredNotes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredNotes[selectedIndex]) {
        handleSelect(filteredNotes[selectedIndex].id, filteredNotes[selectedIndex].notebookId);
      }
    }
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
              setSearchQuery(val); // Disparar FTS
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search all notes... (Ctrl+P)"
            className="flex-1 bg-transparent border-none outline-none text-gray-200 text-base"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto w-full py-2">
          {filteredNotes.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              No results found
            </div>
          ) : (
            filteredNotes.map((note, idx) => (
              <div 
                key={note.id}
                onClick={() => handleSelect(note.id, note.notebookId)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-4 py-3 mx-2 rounded cursor-pointer transition-colors ${idx === selectedIndex ? 'bg-[#333] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>📄</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{note.title || 'Untitled'}</span>
                      {note.highlight && (
                        <span 
                          className="text-xs text-gray-500 line-clamp-1 italic"
                          dangerouslySetInnerHTML={{ __html: note.highlight.replace(/==/g, '<mark class="bg-yellow-500/30 text-yellow-200 rounded px-0.5">').replace(/==/g, '</mark>') }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-xs opacity-50 px-2 py-0.5 bg-black/20 rounded">
                    Jump ↵
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
