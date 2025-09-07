import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, Shelter } from '../../services/api';

interface SheltersState {
  shelters: Shelter[];
  loading: boolean;
  error: string | null;
}

const initialState: SheltersState = {
  shelters: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchShelters = createAsyncThunk(
  'shelters/fetchShelters',
  async () => {
    const response = await api.getShelters();
    return response;
  }
);

const sheltersSlice = createSlice({
  name: 'shelters',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShelters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShelters.fulfilled, (state, action) => {
        state.loading = false;
        state.shelters = action.payload;
      })
      .addCase(fetchShelters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch shelters';
      });
  },
});

export const { clearError } = sheltersSlice.actions;
export default sheltersSlice.reducer;
