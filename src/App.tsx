import { Routes, Route } from "react-router"
import LoginPage from "./containers/LoginPage"
import HomePage from "./containers/HomePage"
import RegisterPage from "./containers/RegisterPage"

const App: React.FC = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  )
}

export default App
