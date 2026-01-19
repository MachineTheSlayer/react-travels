export type IUserState = {
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
}
