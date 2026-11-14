import type React from "react"
import { Spin, theme } from "antd"
import {
  useAppDispatch,
  useAppSelector,
  useAuth,
} from "../../../../../app/hooks"
import { setSavedCities } from "../../../store/slices/citySlice"
import { useEffect, useRef, useState } from "react"
import type { CityData } from "../../../store/types"

export type IAppInitializerProps = {
  children: React.ReactNode
}

const ANON_KEY = "savedCities"

/** Безопасно парсит массив городов из localStorage */
const loadCities = (key: string): CityData[] => {
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CityData[]) : []
  } catch (e) {
    console.error(`[AppInitializer] Failed to parse "${key}":`, e)
    return []
  }
}

const AppInitializer: React.FC<IAppInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch()
  const { isInitialized } = useAuth()
  const user = useAppSelector(state => state.auth.user)
  const { token } = theme.useToken()

  // ✅ Для какого uid гидратация уже выполнена (undefined = ещё ни для кого)
  const hydratedForRef = useRef<string | null | undefined>(undefined)
  // ✅ Флаг «город загружен или загрузки нет» — чтобы не показывать кадр с пустотой
  const [hydrated, setHydrated] = useState(false)

  // Гидратация городов из localStorage — на любом маршруте
  useEffect(() => {
    // 1. Ждём инициализацию auth — иначе user === null и прочитаем не тот ключ
    if (!isInitialized) return

    const uid = user?.uid ?? null

    // 2. Уже гидратировали этого пользователя — не повторяем
    if (hydratedForRef.current === uid) return

    const key = uid ? `savedCities_${uid}` : ANON_KEY
    const cities = loadCities(key)

    console.log(
      `[AppInitializer] Hydrate "${key}", cities: ${String(cities.length)}`,
    )

    dispatch(setSavedCities(cities))
    hydratedForRef.current = uid
    setHydrated(true)
  }, [dispatch, isInitialized, user])

  // ✅ Ждём и auth, и гидратацию городов — не показываем пустой Planner
  if (!isInitialized || !hydrated) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: token.colorBgLayout,
        }}
      >
        <Spin size="large" tip="Загрузка...">
          <div style={{ width: 80, height: 80 }} />
        </Spin>
      </div>
    )
  }

  return <>{children}</>
}

export default AppInitializer
