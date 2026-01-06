import { Routes, Route } from "react-router"
import LoginPage from "./containers/LoginPage"
import HomePage from "./containers/HomePage"

const App: React.FC = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </div>
  )
}

export default App
