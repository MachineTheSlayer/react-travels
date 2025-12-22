import styles from "./Login.module.css"

/* export interface ILoginProps {
    setIsShowModal: React.Dispatch<React.SetStateAction<boolean>>
} */

const Login: React.FC = () => {
  /* const { setIsShowModal } = props */

  /* const handleClose = () => {
        setIsShowModal(false)
    } */

  return (
    <div className={styles.container}>
      <div className={styles.column}>
        <button>Регистрация</button>
        <button>Войти</button>
      </div>
    </div>
  )
}

export default Login
