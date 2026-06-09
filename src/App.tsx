import { Routes, Route } from "react-router"
import LoginPage from "./containers/LoginPage"
import HomePage from "./containers/HomePage"
import RegisterPage from "./containers/RegisterPage"
import ForgotPasswordPage from "./containers/ForgotPasswordPage"
import ProtectedRoute from "./components/Traveling/components/ProtectedRoute"
import AppInitializer from "./components/Traveling/components/Auth/AppInitializer"
import Planner from "./containers/Planner"

const App: React.FC = () => {
  return (
    <div>
      <AppInitializer>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <Planner />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </AppInitializer>
    </div>
  )
}

export default App
