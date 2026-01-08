import { configureStore } from '@reduxjs/toolkit';

import filterReducer from './slices/filterSlice';
import formReducer from './slices/formSlice';
import moduleReducer from './slices/moduleSlice';

/**
 * Configures the Redux store with slices for module navigation, filters, and form state.
 * Includes middleware for logging and Redux DevTools integration.
 */
export const store = configureStore({
  reducer: {
    module: moduleReducer,
    filters: filterReducer,
    form: formReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;