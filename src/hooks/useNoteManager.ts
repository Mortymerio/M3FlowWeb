import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store';

export function useNoteManager(noteId: string | null) {
  const notes = useStore(state => state.notes);
  const saveNote = useStore(state => state.saveNote);
  const loadBacklinks = useStore(state => state.loadBacklinks);

  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [splitRatio, setSplitRatio] = useState(0.5);
  const isResizingSplit = useRef(false);
  
  const lastLoadedNoteId = useRef<string | null>(null);

  // Load note content when noteId changes
  useEffect(() => {
    if (noteId) {
      if (noteId !== lastLoadedNoteId.current) {
        const activeNote = notes.find(n => n.id === noteId);
        if (activeNote) {
          setContent(activeNote.body);
          lastLoadedNoteId.current = noteId;
          loadBacklinks(noteId);
        }
      }
    } else {
      setContent('');
      lastLoadedNoteId.current = null;
    }
  }, [noteId, notes, loadBacklinks]);

  // Derive active note body from store
  const activeNoteBody = useMemo(() => {
    if (!noteId) return undefined;
    return notes.find(n => n.id === noteId)?.body;
  }, [notes, noteId]);

  const flushSave = () => {
    if (!noteId || !content) return;
    const lines = content.split('\n');
    const titleLine = lines.find(line => line.trim().startsWith('#')) || lines[0] || 'Untitled Note';
    const title = titleLine.replace(/^#+\s*/, '').trim().substring(0, 50);
    saveNote(noteId, title, content);
  };

  const flushSaveRef = useRef(flushSave);
  flushSaveRef.current = flushSave;

  // Debounced auto-save
  useEffect(() => {
    if (!noteId || noteId !== lastLoadedNoteId.current) return;
    if (activeNoteBody === content) return;

    const timeout = setTimeout(() => {
      flushSaveRef.current();
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [content, noteId, activeNoteBody]);

  // Flush on unmount to not lose the last few seconds of typing
  useEffect(() => {
    return () => {
      if (lastLoadedNoteId.current && activeNoteBody !== content) {
        flushSaveRef.current();
      }
    };
  }, []);

  // Global Ctrl+S handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flushSaveRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    content,
    setContent,
    viewMode,
    setViewMode,
    splitRatio,
    setSplitRatio,
    isResizingSplit,
  };
}
