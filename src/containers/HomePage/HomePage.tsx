import { Navigate } from "react-router"
import styles from "./HomePage.module.css"

const HomePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <Navigate to="/login" />
    </div>
  )
}

export default HomePage
