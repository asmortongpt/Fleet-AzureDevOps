import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModuleState {
  activeModule: 'overview' | 'dispatch' | 'tracking' | 'fuel' | 'asset';
}

const initialState: ModuleState = {
  activeModule: 'overview',
};

/**
 * Slice for managing the active module state.
 */
const moduleSlice = createSlice({
  name: 'module',
  initialState,
  reducers: {
    setActiveModule(state, action: PayloadAction<ModuleState['activeModule']>) {
      state.activeModule = action.payload;
    },
  },
});

export const { setActiveModule } = moduleSlice.actions;
export default moduleSlice.reducer;