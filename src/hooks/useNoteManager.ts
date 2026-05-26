import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store';

export function useNoteManager() {
  const activeNoteId = useStore(state => state.activeNoteId);
  const notes = useStore(state => state.notes);
  const saveNote = useStore(state => state.saveNote);
  const loadBacklinks = useStore(state => state.loadBacklinks);

  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [splitRatio, setSplitRatio] = useState(0.5);
  const isResizingSplit = useRef(false);
  
  const lastLoadedNoteId = useRef<string | null>(null);

  // Load note content when activeNoteId changes
  useEffect(() => {
    if (activeNoteId) {
      if (activeNoteId !== lastLoadedNoteId.current) {
        const activeNote = notes.find(n => n.id === activeNoteId);
        if (activeNote) {
          setContent(activeNote.body);
          lastLoadedNoteId.current = activeNoteId;
          loadBacklinks(activeNoteId);
        }
      }
    } else {
      setContent('');
      lastLoadedNoteId.current = null;
    }
  }, [activeNoteId, notes, loadBacklinks]);

  // Derive active note body from store
  const activeNoteBody = useMemo(() => {
    if (!activeNoteId) return undefined;
    return notes.find(n => n.id === activeNoteId)?.body;
  }, [notes, activeNoteId]);

  // Debounced auto-save
  useEffect(() => {
    if (!activeNoteId || activeNoteId !== lastLoadedNoteId.current) return;
    if (activeNoteBody === content) return;

    const timeout = setTimeout(() => {
      const lines = content.split('\n');
      const titleLine = lines.find(line => line.trim().startsWith('#')) || lines[0] || 'Untitled Note';
      const title = titleLine.replace(/^#+\s*/, '').trim().substring(0, 50);
      saveNote(activeNoteId, title, content);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [content, activeNoteId, saveNote, activeNoteBody]);

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
