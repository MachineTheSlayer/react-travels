import { useCallback, useMemo, useState } from "react"
import { Link } from "react-router"
import { Button, ConfigProvider, Drawer, Menu } from "antd"
import type { MenuProps } from "antd"
import { CalendarOutlined, MenuOutlined, PlusOutlined } from "@ant-design/icons"
import { useTheme } from "../../../../app/hooks"

type HeaderNavProps = {
  isMobile: boolean
  onAddTrip: () => void
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  isMobile,
  onAddTrip,
}) => {
  const { isDark } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleAddClick = useCallback(() => {
    setMobileMenuOpen(false)
    onAddTrip()
  }, [onAddTrip])

  const closeMobileMenu = useCallback(() => { setMobileMenuOpen(false); }, [])

  const itemsMenu: MenuProps["items"] = useMemo(
    () => [
      {
        key: "add",
        icon: <PlusOutlined />,
        label: "Добавить",
        onClick: handleAddClick,
      },
      {
        key: "planner",
        icon: <CalendarOutlined />,
        label: (
          <Link to="/planner" onClick={closeMobileMenu}>
            Планировщик
          </Link>
        ),
      },
    ],
    [handleAddClick, closeMobileMenu],
  )

  const themeConfig = useMemo(
    () => ({
      components: {
        Menu: {
          darkItemBg: isDark ? "#141414" : "#ffffff",
          darkItemSelectedBg: "transparent",
        },
      },
    }),
    [isDark],
  )

  return (
    <ConfigProvider theme={themeConfig}>
      {!isMobile ? (
        <Menu
          theme={isDark ? "dark" : "light"}
          mode="horizontal"
          selectable={false}
          className="header-desktop-menu"
          style={{
            flex: 1,
            minWidth: 0,
            outline: "none",
            color: isDark ? "#ffffff" : "#000000",
          }}
          items={itemsMenu}
        />
      ) : (
        <>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => { setMobileMenuOpen(true); }}
            aria-label="Открыть меню"
            style={{ color: isDark ? "#ffffff" : "#000000", marginLeft: 20 }}
          />
          <Drawer
            placement="right"
            open={mobileMenuOpen}
            onClose={closeMobileMenu}
            styles={{ body: { padding: 0 } }}
          >
            <Menu
              theme={isDark ? "dark" : "light"}
              mode="vertical"
              selectable={false}
              items={itemsMenu}
              onClick={closeMobileMenu}
              style={{
                borderRight: "none",
                color: isDark ? "#ffffff" : "#000000",
                background: isDark ? "#141414" : "#ffffff",
              }}
            />
          </Drawer>
        </>
      )}
    </ConfigProvider>
  )
}
