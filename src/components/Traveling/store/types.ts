/* export type IUserState = {
  email: string | null
  token: string | null
  id: string | null
}

export type IUserAction = {
  payload: {
    email: string | null
    token: string | null
    id: string | null
  }
} */

export type User = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export type AuthState = {
  user: User | null | undefined
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterCredentials = {
  displayName?: string
} & LoginCredentials
