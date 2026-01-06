import { Route, Routes } from "react-router"
import Login from "../../containers/LoginPage/LoginPage"

import styles from "./Traveling.module.css"

const Traveling: React.FC = () => {
  /* const [isShowModal, setIsShowModal] = useState<boolean>(false) */
  /*  const state = useAppSelector((state) => state.traveling)
    const dispatch = useAppDispatch() */
  return (
    <div className={styles.container}>
      {/*  {state.currentStep}
            <button onClick={() => dispatch(setCurrentStep())}>
                Change
            </button> */}
      {/* {isShowModal && (
                <Login
                    setIsShowModal={setIsShowModal}
                />
            )} */}
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  )
}

export default Traveling
