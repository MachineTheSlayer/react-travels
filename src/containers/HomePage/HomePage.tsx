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
  fetchWeatherForCity,
  refreshOutdatedWeather,
  setSavedCities,
} from "../../components/Traveling/store/slices/citySlice"
import { useSelector } from "react-redux"
import type { RootState } from "../../app/store"
// import styles from "./HomePage.module.css"

type HomePage = {
  children?: React.ReactNode
}
const STORAGE_KEY = "savedCities"

const HomePage: React.FC<HomePage> = ({ children }) => {
  const dispatch = useAppDispatch()
  const savedCities = useAppSelector(state => state.city.savedCities)
  const user = useSelector((state: RootState) => state.auth.user)
  const { isDark } = useTheme()

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPageVisible = useRef(true)

  // Загрузка сохранённых городов при старте
  useEffect(() => {
    console.log("Загрузка сохранённых городов для пользователя:", user?.uid)
    const key = user ? `savedCities_${user.uid}` : STORAGE_KEY
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        const cities = JSON.parse(stored) as CityData[]
        dispatch(setSavedCities(cities))
        cities.forEach((city: CityData) => {
          if (!city.weather) {
            void dispatch(
              fetchWeatherForCity({
                coordinates: city.coordinates,
                cityName: city.name,
              }),
            )
          }
        })
      } catch (e) {
        console.error("Failed to parse saved cities", e)
      }
    }
  }, [dispatch, user])

  // Сохранение при каждом изменении savedCities
  useEffect(() => {
    const key = user ? `savedCities_${user.uid}` : STORAGE_KEY
    if (savedCities.length > 0) {
      localStorage.setItem(key, JSON.stringify(savedCities))
    } else {
      // Если список пуст, можно удалить ключ (или оставить)
      localStorage.removeItem(key)
    }
  }, [savedCities, user])

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden
      if (isPageVisible.current) {
        void dispatch(refreshOutdatedWeather())
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    intervalRef.current = setInterval(
      () => {
        if (isPageVisible.current) {
          void dispatch(refreshOutdatedWeather())
        }
      },
      15 * 60 * 1000,
    )

    void dispatch(refreshOutdatedWeather())

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [dispatch])

  // Получение геолокации пользователя
  /* useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Геолокация не доступна, используется Москва');
        }
      );
    }
  }, []);
 */
  return (
    <Layout style={{ minHeight: "100vh" }}>
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
          <GithubOutlined style={{ fontSize: "20px" }} />
        </Footer>
      </ThemeProvider>
    </Layout>
  )
}

export default HomePage
