import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { TypedUseSelectorHook } from "react-redux"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../utils/firebase"
import { setUser, setLoading } from "../components/Traveling/store/slices"
import type { AppDispatch, RootState } from "./store"

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export const useAuth = () => {
  const dispatch = useDispatch()
  const { user, loading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  )

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        dispatch(
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          }),
        )
      } else {
        dispatch(setUser(null))
      }
      dispatch(setLoading(false))
    })

    return () => { unsubscribe(); }
  }, [dispatch])

  return { user, loading, error, isAuthenticated }
}
