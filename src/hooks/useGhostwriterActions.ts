import { useState, useCallback, useEffect } from 'react';
import { executeAiPrompt } from '../services/aiService';
import { setGhostwriterRange } from '../lib/ghostwriterExtension';

interface GhostwriterReview {
  from: number;
  to: number;
  originalText?: string;
  prompt: string;
  type: 'expand' | 'directive' | 'continue';
}

interface ContextMenuState {
  x: number;
  y: number;
  pos: number;
  selection: string;
}

export function useGhostwriterActions(
  editorRef: React.MutableRefObject<any>,
  editorType: 'raw' | 'rich',
  activeNoteId: string | null,
  notes: any[],
  notebooks: any[]
) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [ghostwriterReview, setGhostwriterReview] = useState<GhostwriterReview | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [reviewCoords, setReviewCoords] = useState<{ top: number, left: number } | null>(null);

  // Listen for coords dispatched by the pure CodeMirror plugin
  useEffect(() => {
    const handleCoordsUpdate = (e: CustomEvent) => {
      setReviewCoords(e.detail);
    };
    window.addEventListener('ghostwriter-coords', handleCoordsUpdate as EventListener);
    return () => {
      window.removeEventListener('ghostwriter-coords', handleCoordsUpdate as EventListener);
    };
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (editorType !== 'raw') return;
    
    const view = editorRef.current?.view;
    if (!view) return;
    
    const target = e.target as HTMLElement;
    if (!target.closest('.cm-editor')) return;

    e.preventDefault();
    const pos = view.posAtCoords({ x: e.clientX, y: e.clientY }) || view.state.selection.main.head;
    const { from, to } = view.state.selection.main;
    const hasSelection = from !== to && pos >= from && pos <= to;
    
    setContextMenu({ x: e.clientX, y: e.clientY, pos, selection: hasSelection ? view.state.sliceDoc(from, to) : '' });
  }, [editorType, editorRef]);

  const handleGhostwriterAction = useCallback(async (action: 'directive' | 'expand' | 'continue', prompt?: string, isTryAgain = false) => {
    const view = editorRef.current?.view;
    if (!view) return;
    
    setIsAiLoading(true);
    let originalText = '';
    let insertPos = contextMenu?.pos || view.state.selection.main.head;
    let replaceFrom = insertPos;
    let replaceTo = insertPos;

    if ((action === 'expand' || action === 'directive') && contextMenu?.selection) {
      originalText = contextMenu.selection;
      const { from, to } = view.state.selection.main;
      replaceFrom = from;
      replaceTo = to;
    }

    if (isTryAgain && ghostwriterReview) {
      replaceFrom = ghostwriterReview.from;
      replaceTo = ghostwriterReview.to;
      originalText = ghostwriterReview.originalText || '';
      insertPos = replaceFrom;
    }

    let notebookSystemPrompt = "";
    if (activeNoteId) {
      const activeNote = notes.find(n => n.id === activeNoteId);
      const nb = notebooks.find(n => n.id === activeNote?.notebookId);
      if (nb?.config) {
        try { notebookSystemPrompt = JSON.parse(nb.config).systemPrompt || ""; } catch { }
      }
    }

    try {
      let instruction = '';
      if (action === 'directive') instruction = prompt || '';
      if (action === 'expand') instruction = 'Desarrolla, expande y mejora el siguiente texto en prosa detallada.';
      if (action === 'continue') instruction = 'Continúa escribiendo la historia de forma natural, manteniendo el tono y estilo.';
      
      if (isTryAgain) {
         instruction += ' (INTENTO ANTERIOR FALLIDO. Intenta un enfoque diferente, mejora la creatividad y cambia la perspectiva o el tono).';
      }

      instruction += '\n\nREGLA CRÍTICA: Escribe SOLAMENTE el texto nuevo o expandido. NO repitas el contexto ni agregues explicaciones. Si recibes un texto a procesar, devuelve ÚNICAMENTE la versión procesada que reemplazará a dicho texto.';

      let documentContext = view.state.doc.toString();
      if (action === 'continue') {
        documentContext = view.state.sliceDoc(0, replaceFrom);
      } else if (action === 'expand' || (action === 'directive' && originalText)) {
        documentContext = `Texto a procesar:\n${originalText}`;
      }

      const generatedText = await executeAiPrompt({
        instruction,
        documentContext,
        notebookSystemPrompt
      });

      if (generatedText) {
        view.dispatch({
          changes: { from: replaceFrom, to: replaceTo, insert: generatedText },
          effects: setGhostwriterRange.of({ from: replaceFrom, to: replaceFrom + generatedText.length })
        });
        setGhostwriterReview({
          from: replaceFrom,
          to: replaceFrom + generatedText.length,
          originalText: isTryAgain ? originalText : (action === 'expand' ? originalText : undefined),
          prompt: prompt || '',
          type: action
        });
      }
    } catch (e: any) {
      console.error(e);
      alert(`AI Error: ${e.message}`);
    } finally {
      setIsAiLoading(false);
      setContextMenu(null);
    }
  }, [contextMenu, editorRef, ghostwriterReview, activeNoteId, notes, notebooks]);

  const handleGhostwriterDecision = useCallback((decision: 'keep' | 'discard' | 'try_again') => {
     const view = editorRef.current?.view;
     if (!view || !ghostwriterReview) return;

     if (decision === 'keep') {
       view.dispatch({ effects: setGhostwriterRange.of(null) });
       setGhostwriterReview(null);
     } else if (decision === 'discard') {
       const { from, to, originalText } = ghostwriterReview;
       view.dispatch({
         changes: { from, to, insert: originalText || '' },
         effects: setGhostwriterRange.of(null)
       });
       setGhostwriterReview(null);
     } else if (decision === 'try_again') {
       handleGhostwriterAction(ghostwriterReview.type, ghostwriterReview.prompt, true);
     }
  }, [editorRef, ghostwriterReview, handleGhostwriterAction]);

  return {
    contextMenu,
    setContextMenu,
    ghostwriterReview,
    isAiLoading,
    reviewCoords,
    handleContextMenu,
    handleGhostwriterAction,
    handleGhostwriterDecision
  };
}
