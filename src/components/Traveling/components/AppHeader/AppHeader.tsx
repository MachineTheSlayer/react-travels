import { useCallback, useState } from "react"
import { Header } from "antd/es/layout/layout"
import { useTheme } from "../../../../app/hooks"
import { useMediaQuery } from "../../../../app/hooks"
import { HeaderNav } from "./HeaderNav"
import { AddTripDrawer } from "./AddTripDrawer"
import { ProfileDropdown } from "./ProfileDropdown"
import ThemeSwitcher from "../ThemeSwitcher/ThemeSwitcher"
import styles from "./AppHeader.module.css"

export type IHeaderProps = {
  children?: React.ReactNode
  collapsed?: boolean
  onToggleSidebar?: () => void
}

const AppHeader: React.FC<IHeaderProps> = () => {
  const { isDark } = useTheme()
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [addTripOpen, setAddTripOpen] = useState(false)

  const openAddTrip = useCallback(() => { setAddTripOpen(true); }, [])
  const closeAddTrip = useCallback(() => { setAddTripOpen(false); }, [])

  return (
    <>
      <Header
        className={styles.header}
        style={{
          background: isDark ? "#141414" : "#ffffff",
          color: isDark ? "#ffffff" : "#000000",
        }}
      >
        <div
          className={styles.headerTitle}
          style={{
            textShadow: isDark
              ? "0 0 2px #fff, 0 0 40px #ffff00"
              : "0 0 10px rgba(0,0,0,0.5)",
          }}
        >
          <span>TRAVELS</span>
          <span className={styles.icon}>🌎</span>
        </div>

        <div className={styles.headerActions}>
          <HeaderNav isMobile={isMobile} onAddTrip={openAddTrip} />
          <div style={{ whiteSpace: "nowrap" }}>
            <ThemeSwitcher showLabel={true} />
          </div>
          <ProfileDropdown isMobile={isMobile} />
        </div>
      </Header>

      <AddTripDrawer open={addTripOpen} onClose={closeAddTrip} />
    </>
  )
}

export default AppHeader
