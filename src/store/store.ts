// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import sideBarReducer from './slices/sideBarSlice';
import mapReducer from "./slices/mapSlice";
import pinsReducer from './slices/pinsSlice';
import sheltersReducer from './slices/sheltersSlice';
import houston311Reducer from './slices/houston311Slice';
import foodReducer from './slices/foodSlice';

const store = configureStore({
  reducer: {
    sidebar: sideBarReducer,
    map: mapReducer,
    pins: pinsReducer,
    shelters: sheltersReducer,
    houston311: houston311Reducer,
    food: foodReducer,
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
