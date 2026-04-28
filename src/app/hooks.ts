import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { TypedUseSelectorHook } from "react-redux"
import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../utils/firebase"
import {
  setUser,
  finishInitialization,
} from "../components/Traveling/store/slices"
import type { AppDispatch, RootState } from "./store"
import {
  toggleTheme,
  setTheme,
} from ".././components/Traveling/store/slices/themeSlice"
import type { ThemeMode } from ".././components/Traveling/store/types"
import { cacheUser, clearUserCache, getCachedUser } from "../utils/cacheStorage"

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export const useAuth = () => {
  const dispatch = useDispatch()
  const { user, loading, isInitialized } = useSelector(
    (state: RootState) => state.auth,
  )

  useEffect(() => {
    const cachedUser = getCachedUser()

    if (cachedUser) {
      dispatch(setUser(cachedUser))
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: FirebaseUser | null) => {
        let finalUser = null
        if (firebaseUser) {
          finalUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? "",
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          }
          cacheUser(finalUser)
        } else {
          clearUserCache()
        }
        dispatch(finishInitialization({ user: finalUser }))
      },
    )

    return () => { unsubscribe(); }
  }, [dispatch])

  return { user, loading, isInitialized, isAuthenticated: !!user }
}

export const useTheme = () => {
  const dispatch = useAppDispatch()
  const mode = useAppSelector(state => state.theme.mode)

  return {
    mode,
    isDark: mode === "dark",
    isLight: mode === "light",
    toggleTheme: () => dispatch(toggleTheme()),
    setTheme: (newMode: ThemeMode) => dispatch(setTheme(newMode)),
  }
}
