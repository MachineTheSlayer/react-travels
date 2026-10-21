import { Layout } from "antd"
import { Content, Footer } from "antd/es/layout/layout"
import AppHeader from "../../components/Traveling/components/AppHeader"
import Maps from "../../components/Traveling/components/Maps"
import { useEffect, useRef } from "react"
import type { CityData } from "../../components/Traveling/store/types"
import { GithubOutlined } from "@ant-design/icons"
import { useAppDispatch, useAppSelector, useTheme } from "../../app/hooks"
import { ThemeProvider } from "../../providers/ThemeProvider"
import {
  fetchFlightsByRoute,
  fetchWeatherForCity,
  getIataForCity,
  refreshOutdatedWeather,
  setSavedCities,
  updateCityIata,
  updateTripStatuses,
} from "../../components/Traveling/store/slices/citySlice"
import { useSelector } from "react-redux"
import type { RootState } from "../../app/store"
// import styles from "./HomePage.module.css"

type HomePage = {
  children?: React.ReactNode
}
/** Ключ localStorage для неавторизованных пользователей */
const STORAGE_KEY = "savedCities"
/** Интервал периодических обновлений (15 минут) */
const REFRESH_INTERVAL_MS = 15 * 60 * 1000

const HomePage: React.FC<HomePage> = ({ children }) => {
  const dispatch = useAppDispatch()
  const savedCities = useAppSelector(state => state.city.savedCities)
  const user = useSelector((state: RootState) => state.auth.user)
  const { isDark } = useTheme()

  // Ссылки для управления интервалом и отслеживания видимости вкладки
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPageVisible = useRef(true)

  // Загрузка сохранённых городов при старте (или при смене пользователя)
  useEffect(() => {
    console.log("Загрузка сохранённых городов для пользователя:", user?.uid)
    const key = user ? `savedCities_${user.uid}` : STORAGE_KEY
    const stored = localStorage.getItem(key)
    if (!stored) return

    try {
      const cities = JSON.parse(stored) as CityData[]
      dispatch(setSavedCities(cities))

      // Асинхронная догрузка данных для городов, у которых их нет
      const processCities = async () => {
        // Параллельно обрабатываем все города — это быстрее, чем последовательный цикл
        await Promise.all(
          cities.map(async city => {
            // Погода: если её нет — запрашиваем
            if (!city.weather) {
              void dispatch(
                fetchWeatherForCity({
                  coordinates: city.coordinates,
                  cityName: city.name,
                }),
              )
            }
            // IATA: если его нет — получаем по названию города
            let iata = city.iata
            if (!iata) {
              const fetchedIata = await getIataForCity(city.name)
              iata = fetchedIata ?? undefined
              if (iata) {
                dispatch(updateCityIata({ cityName: city.name, iata }))
              }
            }

            // Авиабилеты: если знаем IATA — запрашиваем маршрут
            if (iata) {
              void dispatch(
                fetchFlightsByRoute({
                  originIata: "KUF",
                  destinationIata: iata,
                }),
              )
            }
          }),
        )
      }
      void processCities()
    } catch (e) {
      console.error("Failed to parse saved cities", e)
    }
  }, [dispatch, user])

  // Сохранение городов в localStorage при каждом изменении
  useEffect(() => {
    const key = user ? `savedCities_${user.uid}` : STORAGE_KEY
    if (savedCities.length > 0) {
      localStorage.setItem(key, JSON.stringify(savedCities))
    } else {
      localStorage.removeItem(key)
    }
  }, [savedCities, user])

  // Единый эффект для периодических обновлений:
  //    - погода устаревших городов
  //    - статусы поездок (planned → past при наступлении даты)
  //    Срабатывает при монтировании, каждые 15 минут и при возврате вкладки в фокус.
  useEffect(() => {
    const runUpdates = () => {
      void dispatch(refreshOutdatedWeather())
      dispatch(updateTripStatuses())
    }

    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden
      // Обновляем данные только когда вкладка стала видимой (чтобы не тратить ресурсы)
      if (isPageVisible.current) {
        runUpdates()
      }
    }

    // Подписка на смену видимости вкладки
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Периодическое обновление (только если страница видима)
    intervalRef.current = setInterval(() => {
      if (isPageVisible.current) {
        runUpdates()
      }
    }, REFRESH_INTERVAL_MS)

    // Первичный запуск при монтировании компонента
    runUpdates()

    // Очистка при размонтировании
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [dispatch])

  // Обновление статусов поездок после загрузки городов
  // (страховка на случай, если в localStorage сохранён устаревший статус)

  useEffect(() => {
    if (savedCities.length > 0) {
      dispatch(updateTripStatuses())
    }
    // Зависимость только от количества городов, чтобы не было цикла
    // (сам редюсер updateTripStatuses проверяет необходимость изменения)
  }, [savedCities.length, dispatch])

  return (
    <Layout className={isDark ? "dark" : ""} style={{ minHeight: "100vh" }}>
      <ThemeProvider>
        <AppHeader />
        <Content>
          <Maps />
          {children}
        </Content>
        <Footer
          style={{
            height: "64px",
            display: "flex",
            justifyContent: "center",
            background: isDark ? "#141414" : "#ffffff",
            color: isDark ? "#ffffff" : "#000000",
          }}
        >
          <a
            href="https://github.com/MachineTheSlayer"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <GithubOutlined style={{ fontSize: "20px" }} />
            By Danila Tsybikov 2026
          </a>
        </Footer>
      </ThemeProvider>
    </Layout>
  )
}

export default HomePage
