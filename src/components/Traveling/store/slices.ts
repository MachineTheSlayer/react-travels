import type { PayloadAction } from "@reduxjs/toolkit"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth"
import { auth } from "../../../utils/firebase"
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthState,
} from "./types"
import { cacheUser, clearUserCache } from "../../../utils/cacheStorage"

export const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  isInitialized: false,
}

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      )
      const user: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      }
      cacheUser(user)
      return user
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message)
      }
      console.log("Произошла неизвестная ошибка", error)
      return rejectWithValue("Неизвестная ошибка входа")
    }
  },
)

export const register = createAsyncThunk(
  "auth/register",
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      )
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (credentials.displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: credentials.displayName,
        })
      }
      const user: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: credentials.displayName ?? null,
        photoURL: userCredential.user.photoURL,
      }
      cacheUser(user)
      return user
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message)
      }
      console.log("Произошла неизвестная ошибка", error)
      return rejectWithValue("Неизвестная ошибка входа")
    }
  },
)

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth)
      clearUserCache()
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message)
      } else {
        console.log("Произошла неизвестная ошибка", error)
      }
    }
  },
)

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (email: string, { rejectWithValue }) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return email
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message)
      }
      return rejectWithValue("Неизвестная ошибка при сбросе пароля")
    }
  },
)

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
    },
    finishInitialization: (
      state,
      action: PayloadAction<{ user: User | null }>,
    ) => {
      state.user = action.payload.user
      state.loading = false
      state.isInitialized = true
      state.error = null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    clearError: state => {
      state.error = null
    },
  },
  extraReducers: builder => {
    builder
      // Login
      .addCase(login.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload
        state.loading = false
        state.isInitialized = true
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.isInitialized = true
        state.error = action.payload as string
      })
      // Register
      .addCase(register.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload
        state.loading = false
        state.isInitialized = true
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.isInitialized = true
        state.error = action.payload as string
      })
      // Logout
      .addCase(logout.pending, state => {
        state.loading = true
      })
      .addCase(logout.fulfilled, state => {
        state.user = null
        state.loading = false
        state.isInitialized = true
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false
        state.isInitialized = true
        state.error = action.payload as string
      })
  },
})

export const { setUser, finishInitialization, setLoading, clearError } =
  authSlice.actions
export default authSlice.reducer
