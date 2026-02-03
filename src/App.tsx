import { Routes, Route } from "react-router"
import LoginPage from "./containers/LoginPage"
import HomePage from "./containers/HomePage"
import RegisterPage from "./containers/RegisterPage"
import ForgotPasswordPage from "./containers/ForgotPasswordPage"

const App: React.FC = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </div>
  )
}

export default App
