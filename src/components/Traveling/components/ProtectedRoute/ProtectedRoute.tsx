import type React from "react"
import { Navigate } from "react-router"
import { Spin } from "antd"
import { useAuth } from "../../../../app/hooks"

// import styles from "./ProtectedRoute.module.css"

export type IProtectedRouteProps = {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<IProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

export default ProtectedRoute
