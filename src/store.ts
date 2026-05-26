import { create } from 'zustand';
import type { AppState } from './store/types';
import { createUISlice } from './store/slices/uiSlice';
import { createDataSlice } from './store/slices/dataSlice';
import { createAISlice } from './store/slices/aiSlice';
import { createSyncSlice } from './store/slices/syncSlice';

// Export type for backward compatibility where it might be imported
export type { AppState } from './store/types';

export const useStore = create<AppState>((...a) => ({
  ...createUISlice(...a),
  ...createDataSlice(...a),
  ...createAISlice(...a),
  ...createSyncSlice(...a),
}));
