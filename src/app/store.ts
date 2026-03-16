import type { Action, ThunkAction } from "@reduxjs/toolkit"
import { configureStore } from "@reduxjs/toolkit"
import authReducer from "../components/Traveling/store/slices"
import cityReducer from ".././components/Traveling/store/slices/citySlice"
import mapReducer from ".././components/Traveling/store/slices/mapSlice"
import themeReducer from "../components/Traveling/store/slices/themeSlice.ts"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    city: cityReducer,
    map: mapReducer,
    theme: themeReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Игнорируем несериализуемые значения в определенных путях
        ignoredActions: ["map/setMapInstances"],
        ignoredPaths: ["map.ymapsInstance", "map.mapInstance"],
      },
    }),
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>
