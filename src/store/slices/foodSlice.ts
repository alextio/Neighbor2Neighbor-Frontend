import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, FoodSite } from '../../services/api';

interface FoodState {
  foodSites: FoodSite[];
  loading: boolean;
  error: string | null;
}

const initialState: FoodState = {
  foodSites: [],
  loading: false,
  error: null,
};

// Async thunk for fetching food sites
export const fetchFoodSites = createAsyncThunk(
  'food/fetchFoodSites',
  async () => {
    const response = await api.getFoodSites();
    return response;
  }
);

const foodSlice = createSlice({
  name: 'food',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFoodSites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFoodSites.fulfilled, (state, action) => {
        state.loading = false;
        state.foodSites = action.payload;
        state.error = null;
      })
      .addCase(fetchFoodSites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch food sites';
      });
  },
});

export const { clearError } = foodSlice.actions;
export default foodSlice.reducer;
