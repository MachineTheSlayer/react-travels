import type React from "react"
import { Spin } from "antd"
import { useAuth } from "../../../../../app/hooks"

export type IAppInitializerProps = {
  children: React.ReactNode
}

const AppInitializer: React.FC<IAppInitializerProps> = ({ children }) => {
  const { isInitialized } = useAuth()

  if (!isInitialized) {
    console.log("AppInitializer", isInitialized)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f0f2f5",
        }}
      >
        <Spin size="large" tip="Загрузка..." />
      </div>
    )
  }

  return <>{children}</>
}

export default AppInitializer
