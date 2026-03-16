import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit"
import type { ThemeState, ThemeMode } from "../types"

// Функция для получения начальной темы из localStorage
const getInitialTheme = (): ThemeMode => {
  const savedTheme = localStorage.getItem("theme") as ThemeMode
  if (savedTheme === "light") {
    return savedTheme
  }

  // Проверяем системные настройки
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  return prefersDark ? "dark" : "light"
}
const initialState: ThemeState = {
  mode: getInitialTheme(),
}
const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload
      localStorage.setItem("theme", action.payload)
    },
    toggleTheme: state => {
      const newMode = state.mode === "light" ? "dark" : "light"
      state.mode = newMode
      localStorage.setItem("theme", newMode)
    },
  },
})

export const { setTheme, toggleTheme } = themeSlice.actions
export default themeSlice.reducer
