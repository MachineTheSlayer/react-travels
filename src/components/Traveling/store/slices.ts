import { createSlice } from "@reduxjs/toolkit"

import type { ITravelngState } from "./types"

export const initialState: ITravelngState = {
  currentStep: 0,
}

export const travelingSlice = createSlice({
  name: "traveling",
  initialState,
  reducers: {
    setCurrentStep: state => {
      state.currentStep += 1
    },
  },
})

export const { setCurrentStep } = travelingSlice.actions
export default travelingSlice.reducer
