import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface Houston311Feature {
  type: 'Feature';
  properties: {
    category: string;
    updated?: string;
    raw?: any;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface Houston311Data {
  type: 'FeatureCollection';
  features: Houston311Feature[];
}

interface Houston311State {
  data: Houston311Data | null;
  loading: boolean;
  error: string | null;
}

const initialState: Houston311State = {
  data: null,
  loading: false,
  error: null,
};

// Async thunk for fetching Houston 311 data
export const fetchHouston311 = createAsyncThunk(
  'houston311/fetch',
  async () => {
    const response = await api.getHouston311();
    return response;
  }
);

const houston311Slice = createSlice({
  name: 'houston311',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHouston311.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHouston311.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchHouston311.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch Houston 311 data';
      });
  },
});

export const { clearError } = houston311Slice.actions;
export default houston311Slice.reducer;
