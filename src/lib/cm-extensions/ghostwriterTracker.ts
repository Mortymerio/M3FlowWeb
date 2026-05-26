import { EditorView } from '@codemirror/view';
import { ghostwriterField } from '../ghostwriterExtension';

let lastWasNull = true;

export const ghostwriterCoordsTracker = EditorView.updateListener.of((update) => {
  const currentRange = update.state.field(ghostwriterField, false);
  
  if (currentRange) {
    if (update.docChanged || update.selectionSet || update.geometryChanged) {
      const coords = update.view.coordsAtPos(currentRange.to);
      if (coords) {
        const contentRect = update.view.contentDOM.getBoundingClientRect();
        const payload = { top: coords.bottom + 10, left: contentRect.left };
        window.dispatchEvent(new CustomEvent('ghostwriter-coords', { detail: payload }));
        lastWasNull = false;
      }
    }
  } else {
    // If the field is removed or empty, dispatch null to clear UI
    if (!lastWasNull) {
      if (update.docChanged || update.selectionSet || update.geometryChanged) {
        window.dispatchEvent(new CustomEvent('ghostwriter-coords', { detail: null }));
        lastWasNull = true;
      }
    }
  }
});
