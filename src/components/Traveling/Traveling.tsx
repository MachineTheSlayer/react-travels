import Login from "./components/Login"

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
      <Login />
    </div>
  )
}

export default Traveling
