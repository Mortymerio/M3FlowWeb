import { EditorView } from '@codemirror/view';
import { getCM } from '@replit/codemirror-vim';

interface CursorTrackerProps {
  editorMode: string;
  setCursorLine: (val: number) => void;
  setCursorCol: (val: number) => void;
  setTotalLines: (val: number) => void;
  setVimMode: (val: string) => void;
}

export const createCursorTracker = ({
  editorMode,
  setCursorLine,
  setCursorCol,
  setTotalLines,
  setVimMode
}: CursorTrackerProps) => {
  return EditorView.updateListener.of((update) => {
    if (update.selectionSet || update.docChanged) {
      const pos = update.state.selection.main.head;
      const line = update.state.doc.lineAt(pos);
      setCursorLine(line.number);
      setCursorCol(pos - line.from + 1);
      setTotalLines(update.state.doc.lines);

      // Track vim mode
      if (editorMode === 'vim') {
        try {
          const cm = getCM(update.view);
          if (cm?.state?.vim) {
            const vs = cm.state.vim;
            if (vs.insertMode) setVimMode('INSERT');
            else if (vs.visualMode) {
              if (vs.visualLine) setVimMode('V-LINE');
              else if (vs.visualBlock) setVimMode('V-BLOCK');
              else setVimMode('VISUAL');
            } else setVimMode('NORMAL');
          }
        } catch { /* getCM may fail during init */ }
      }
    }
  });
};
