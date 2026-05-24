import { StateField, StateEffect } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';

export const setGhostwriterRange = StateEffect.define<{from: number, to: number} | null>();

export const ghostwriterField = StateField.define<{from: number, to: number} | null>({
  create() { return null; },
  update(value, tr) {
    for (let e of tr.effects) {
      if (e.is(setGhostwriterRange)) return e.value;
    }
    if (value && tr.docChanged) {
       const from = tr.changes.mapPos(value.from);
       const to = tr.changes.mapPos(value.to, 1); // map forward
       if (from >= to) return null;
       return {from, to};
    }
    return value;
  },
  provide: f => EditorView.decorations.from(f, val => {
    if (!val) return Decoration.none;
    const deco = Decoration.mark({ class: 'bg-green-500/20 text-green-700 dark:text-green-200' });
    return Decoration.set([deco.range(val.from, val.to)]);
  })
});
