import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FormState {
  number: string;
  type: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  licensePlate: string;
  fuelType: string;
  ownership: string;
  department: string;
  region: string;
  asset_category: string;
  asset_type: string;
  power_type: string;
  operational_status: string;
  primary_metric: string;
  odometer: string;
  engine_hours: string;
  pto_hours: string;
  aux_hours: string;
  capacity_tons: string;
  max_reach_feet: string;
  lift_height_feet: string;
  bucket_capacity_yards: string;
  operating_weight_lbs: string;
  has_pto: boolean;
}

const initialState: FormState = {
  number: '',
  type: '',
  make: '',
  model: '',
  year: '',
  vin: '',
  licensePlate: '',
  fuelType: '',
  ownership: '',
  department: '',
  region: '',
  asset_category: '',
  asset_type: '',
  power_type: '',
  operational_status: '',
  primary_metric: '',
  odometer: '',
  engine_hours: '',
  pto_hours: '',
  aux_hours: '',
  capacity_tons: '',
  max_reach_feet: '',
  lift_height_feet: '',
  bucket_capacity_yards: '',
  operating_weight_lbs: '',
  has_pto: false,
};

/**
 * Slice for managing form state across various modules.
 */
const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    updateFormField(state, action: PayloadAction<{ field: keyof FormState; value: string | boolean }>) {
      const { field, value } = action.payload;
      (state as any)[field] = value;
    },
    resetFormState() {
      return initialState;
    },
  },
});

export const { updateFormField, resetFormState } = formSlice.actions;
export default formSlice.reducer;