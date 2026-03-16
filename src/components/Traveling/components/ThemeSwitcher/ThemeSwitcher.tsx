import type React from "react"
import { Switch, Button, Tooltip, Typography } from "antd"
import { MoonOutlined, SunOutlined } from "@ant-design/icons"
import { useAppDispatch, useAppSelector } from "../../../../app/hooks"
import { toggleTheme } from "../../store/slices/themeSlice"

type ThemeSwitcherProps = {
  variant?: "switch" | "button"
  size?: "small" | "default"
  showLabel?: boolean
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = "full",
  size = "default",
  showLabel = true,
}) => {
  const dispatch = useAppDispatch()
  const themeMode = useAppSelector(state => state.theme.mode)
  const isDark = themeMode === "dark"

  const handleToggle = () => {
    dispatch(toggleTheme())
  }

  if (variant === "switch") {
    return (
      <Tooltip title={`Switch to ${isDark ? "light" : "dark"} mode`}>
        <Switch
          checked={isDark}
          onChange={handleToggle}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
          size={size}
        />
      </Tooltip>
    )
  }

  if (variant === "button") {
    return (
      <Tooltip title={`Switch to ${isDark ? "light" : "dark"} mode`}>
        <Button
          type="text"
          icon={isDark ? <MoonOutlined /> : <SunOutlined />}
          onClick={handleToggle}
        />
      </Tooltip>
    )
  }

  // Полный вариант с текстом и иконкой (по умолчанию для хедера)
  return (
    <div
      onClick={handleToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        padding: "4px 12px",
        borderRadius: "20px",
        background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
        transition: "all 0.3s ease",
      }}
    >
      {isDark ? <MoonOutlined /> : <SunOutlined />}
      {showLabel && (
        <Typography style={{ color: "inherit" }}>
          {isDark ? "Ночь" : "День"}
        </Typography>
      )}
    </div>
  )
}

export default ThemeSwitcher
