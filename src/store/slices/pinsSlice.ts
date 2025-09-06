import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, Pin, CreatePinRequest } from '../../services/api';

interface PinsState {
  pins: Pin[];
  loading: boolean;
  error: string | null;
  filters: {
    kinds?: string[];
    center?: [number, number];
    radius?: number;
  };
}

const initialState: PinsState = {
  pins: [],
  loading: false,
  error: null,
  filters: {
    kinds: ['need', 'offer'],
  },
};

// Async thunks
export const fetchPins = createAsyncThunk(
  'pins/fetchPins',
  async (_, { getState }) => {
    const state = getState() as { pins: PinsState };
    const response = await api.getPins(state.pins.filters);
    return response;
  }
);

export const createPin = createAsyncThunk(
  'pins/createPin',
  async (pinData: CreatePinRequest) => {
    const response = await api.createPin(pinData);
    return response;
  }
);

export const reportPin = createAsyncThunk(
  'pins/reportPin',
  async (pinId: string) => {
    const response = await api.reportPin(pinId);
    return { pinId, response };
  }
);

export const dismissPin = createAsyncThunk(
  'pins/dismissPin',
  async ({ pinId, authorAnonId }: { pinId: string; authorAnonId: string }) => {
    const response = await api.dismissPin(pinId, authorAnonId);
    return { pinId, response };
  }
);

const pinsSlice = createSlice({
  name: 'pins',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<PinsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    removePin: (state, action: PayloadAction<string>) => {
      state.pins = state.pins.filter(pin => pin.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch pins
      .addCase(fetchPins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPins.fulfilled, (state, action) => {
        state.loading = false;
        state.pins = action.payload;
      })
      .addCase(fetchPins.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch pins';
      })
      // Create pin
      .addCase(createPin.fulfilled, (state, action) => {
        state.pins.unshift(action.payload);
      })
      .addCase(createPin.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create pin';
      })
      // Report pin
      .addCase(reportPin.fulfilled, (state, action) => {
        state.pins = state.pins.filter(pin => pin.id !== action.payload.pinId);
      })
      // Dismiss pin
      .addCase(dismissPin.fulfilled, (state, action) => {
        state.pins = state.pins.filter(pin => pin.id !== action.payload.pinId);
      });
  },
});

export const { setFilters, clearError, removePin } = pinsSlice.actions;
export default pinsSlice.reducer;
