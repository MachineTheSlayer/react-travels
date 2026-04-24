import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit"

type MapState = {
  center: [number, number]
  zoom: number
  userLocation: [number, number] | null
  isApiLoaded: boolean
}

const initialState: MapState = {
  center: [55.76, 37.64],
  zoom: 10,
  userLocation: null,
  isApiLoaded: false,
}

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    setUserLocation: (state, action: PayloadAction<[number, number]>) => {
      state.userLocation = action.payload
      state.center = action.payload
    },
    setApiLoaded: (state, action: PayloadAction<boolean>) => {
      state.isApiLoaded = action.payload
    },
    moveToCity: (state, action: PayloadAction<[number, number]>) => {
      state.center = action.payload
      state.zoom = 14
    },
  },
})

export const { setUserLocation, setApiLoaded, moveToCity } = mapSlice.actions
export default mapSlice.reducer
