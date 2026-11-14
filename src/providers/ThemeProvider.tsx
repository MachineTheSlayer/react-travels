import type React from "react"
import { useEffect, useMemo } from "react"
import { ConfigProvider, theme as antdTheme } from "antd"
import { useAppSelector } from "../app/hooks"

const getThemeConfig = (mode: "light" | "dark") => ({
  token: {
    colorPrimary: mode === "dark" ? "#177ddc" : "#1890ff",
    colorBgBase: mode === "dark" ? "#141414" : "#ffffff",
    colorTextBase: mode === "dark" ? "#ffffff" : "#000000",
    borderRadius: 6,
  },
  algorithm:
    mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
})

type ThemeProviderProps = {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const themeMode = useAppSelector(state => state.theme.mode)

  const themeConfig = useMemo(() => getThemeConfig(themeMode), [themeMode])

  useEffect(() => {
    const isDark = themeMode === "dark"
    document.body.classList.toggle("dark", isDark)
    document.documentElement.style.colorScheme = isDark ? "dark" : "light"
  }, [themeMode])

  return <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
}
