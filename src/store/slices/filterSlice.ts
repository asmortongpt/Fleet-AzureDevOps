import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FilterState {
  vehicleTypeFilter: string;
  regionFilter: string;
  statusFilter: string;
  searchQuery: string;
}

const initialState: FilterState = {
  vehicleTypeFilter: 'all',
  regionFilter: 'all',
  statusFilter: 'all',
  searchQuery: '',
};

/**
 * Slice for managing filter states across various modules.
 */
const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setVehicleTypeFilter(state, action: PayloadAction<string>) {
      state.vehicleTypeFilter = action.payload;
    },
    setRegionFilter(state, action: PayloadAction<string>) {
      state.regionFilter = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
  },
});

export const { setVehicleTypeFilter, setRegionFilter, setStatusFilter, setSearchQuery } = filterSlice.actions;
export default filterSlice.reducer;