import type React from "react";
import { useMemo } from "react"
import { ConfigProvider, theme as antdTheme } from "antd"
import { useAppSelector } from "../app/hooks"

// Светлая тема
const lightTheme = {
  token: {
    colorPrimary: "#1890ff",
    colorBgBase: "#ffffff",
    colorTextBase: "#000000",
    borderRadius: 6,
  },
  algorithm: antdTheme.defaultAlgorithm,
}

// Темная тема
const darkTheme = {
  token: {
    colorPrimary: "#177ddc",
    colorBgBase: "#141414",
    colorTextBase: "#ffffff",
    borderRadius: 6,
  },
  algorithm: antdTheme.darkAlgorithm,
}

type ThemeProviderProps = {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const themeMode = useAppSelector(state => state.theme.mode)

  const themeConfig = useMemo(() => {
    return themeMode === "light" ? lightTheme : darkTheme
  }, [themeMode])

  return <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
}
