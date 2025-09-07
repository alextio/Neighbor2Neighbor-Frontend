// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import sideBarReducer from './slices/sideBarSlice';
import mapReducer from "./slices/mapSlice";
import pinsReducer from './slices/pinsSlice';
import sheltersReducer from './slices/sheltersSlice';

const store = configureStore({
  reducer: {
    sidebar: sideBarReducer,
    map: mapReducer,
    pins: pinsReducer,
    shelters: sheltersReducer,
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
