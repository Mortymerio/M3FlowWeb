import { create } from 'zustand';
import type { AppState } from './types';
import { createUISlice } from './slices/uiSlice';
import { createDataSlice } from './slices/dataSlice';
import { createAISlice } from './slices/aiSlice';
import { createSyncSlice } from './slices/syncSlice';
import { createTabsSlice } from './slices/tabsSlice';

// Export type for backward compatibility where it might be imported
export type { AppState } from './types';

export const useStore = create<AppState>((...a) => ({
  ...createUISlice(...a),
  ...createDataSlice(...a),
  ...createAISlice(...a),
  ...createSyncSlice(...a),
  ...createTabsSlice(...a),
}));
