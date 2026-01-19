import { createSlice } from "@reduxjs/toolkit"

import type { IUserState, IUserAction } from "./types"

export const initialState: IUserState = {
  email: null,
  token: null,
  id: null,
}

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: IUserAction) {
      state.email = action.payload.email
      state.token = action.payload.token
      state.id = action.payload.id
    },
    removeUser(state) {
      state.email = null
      state.token = null
      state.id = null
    },
  },
})

export const { setUser, removeUser } = userSlice.actions
export default userSlice.reducer
