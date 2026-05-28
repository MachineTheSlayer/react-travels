/* eslint-disable */
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "../../../../app/hooks"
import { setApiLoaded } from "../../store/slices/mapSlice"
import { removeCityFromMap } from "../../store/slices/citySlice"
import {
  CityData,
  YandexMapsApi,
  YandexMapInstance,
  YandexGeoCollection,
  YandexPlacemark,
} from "../../store/types"
import styles from "./Maps.module.css"

const API_KEY = import.meta.env.VITE_REACT_YANDEX_API_KEY as string
const SUGGEST_API_KEY = import.meta.env
  .VITE_REACT_YANDEX_SUGGEST_API_KEY as string

let scriptPromise: Promise<void> | null = null // глобальный промис

// Глобальная функция удаления метки
if (typeof window !== "undefined" && !window.removePlacemark) {
  window.removePlacemark = (cityName: string) => {
    const event = new CustomEvent("removePlacemark", { detail: cityName })
    window.dispatchEvent(event)
  }
}

const escapeHtml = (str: string) => {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// Функция для преобразования weathercode (WMO) в читаемый текст и иконку
const getWeatherDescription = (
  code: number,
): { text: string; icon: string } => {
  // Коды WMO (https://open-meteo.com/en/docs)
  const weatherMap: Record<number, { text: string; icon: string }> = {
    0: { text: "Ясно", icon: "☀️" },
    1: { text: "В основном ясно", icon: "🌤️" },
    2: { text: "Переменная облачность", icon: "⛅" },
    3: { text: "Пасмурно", icon: "☁️" },
    45: { text: "Туман", icon: "🌫️" },
    48: { text: "Туман с изморозью", icon: "🌫️" },
    51: { text: "Морось слабая", icon: "🌧️" },
    53: { text: "Морось умеренная", icon: "🌧️" },
    55: { text: "Морось густая", icon: "🌧️" },
    56: { text: "Ледяная морось слабая", icon: "🌨️" },
    57: { text: "Ледяная морось густая", icon: "🌨️" },
    61: { text: "Дождь слабый", icon: "🌦️" },
    63: { text: "Дождь умеренный", icon: "🌧️" },
    65: { text: "Дождь сильный", icon: "🌧️" },
    66: { text: "Ледяной дождь слабый", icon: "🌨️" },
    67: { text: "Ледяной дождь сильный", icon: "🌨️" },
    71: { text: "Снег слабый", icon: "❄️" },
    73: { text: "Снег умеренный", icon: "❄️" },
    75: { text: "Снег сильный", icon: "❄️" },
    77: { text: "Снежные зёрна", icon: "❄️" },
    80: { text: "Ливень слабый", icon: "🌧️" },
    81: { text: "Ливень умеренный", icon: "🌧️" },
    82: { text: "Ливень сильный", icon: "🌧️" },
    85: { text: "Снегопад слабый", icon: "❄️" },
    86: { text: "Снегопад сильный", icon: "❄️" },
    95: { text: "Гроза", icon: "⛈️" },
    96: { text: "Гроза с градом слабым", icon: "⛈️" },
    99: { text: "Гроза с градом сильным", icon: "⛈️" },
  }
  return weatherMap[code] || { text: "Неизвестно", icon: "❓" }
}

const Maps: React.FC = () => {
  const dispatch = useAppDispatch()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<YandexMapInstance | null>(null)
  const [isMapReady, setIsMapReady] = useState(false) // 👈 добавить
  const { savedCities, selectedCity } = useAppSelector(state => state.city)
  const { userLocation } = useAppSelector(state => state.map)

  // Генерация содержимого балуна
  const generateBalloonContent = useCallback((city: CityData) => {
    const name = escapeHtml(city.name)
    const fullAddress = escapeHtml(city.fullAddress)
    const dateText = city.dateRange
      ? `${escapeHtml(city.dateRange[0])} — ${escapeHtml(city.dateRange[1])}`
      : "Даты не указаны"

    let placesText = "Не указаны"
    if (Array.isArray(city.places) && city.places.length) {
      placesText = city.places.map(p => `• ${escapeHtml(p)}`).join("<br/>")
    }

    const ratingStars = city.rating
      ? "★".repeat(city.rating) + "☆".repeat(5 - city.rating)
      : ""

    let weatherBlock =
      '<div class="balloonSection">☁️ Погода: загружается...</div>'
    if (city.weather) {
      const { text, icon } = getWeatherDescription(city.weather.weathercode)
      weatherBlock = `
        <div class="${styles.balloonSection}">
          <div class="${styles.balloonLabel}">☁️ Погода</div>
          <div>${icon} ${text}</div>
          <div>🌡️ Температура: ${city.weather.temperature.toFixed(1)}°C</div>
          <div>💨 Ветер: ${city.weather.windspeed} км/ч</div>
          <div>🌓 ${city.weather.is_day === 1 ? "День" : "Ночь"}</div>
        </div>
      `
    }

    return `
      <div class="${styles.balloonContent}">
        <h3 class="${styles.balloonTitle}">
          <span class="${styles.balloonIcon}">🏙️</span>
          ${name}
        </h3>
        <div class="${styles.balloonSection}">
          <div class="${styles.balloonLabel}">🗓️ Даты:</div>
          <div>${dateText}</div>
        </div>
        <div class="${styles.balloonSection}">
          <div class="${styles.balloonLabel}">📍 Интересные места:</div>
          <div>${placesText}</div>
        </div>
        ${
          city.rating
            ? `
        <div class="${styles.balloonSection}">
          <div class="${styles.balloonLabel}">⭐ Оценка:</div>
          <div>${ratingStars}</div>
        </div>`
            : ""
        }
        <div class="${styles.balloonSection}">
          <div class="${styles.balloonLabel}">🏢 Адрес:</div>
          <div>${fullAddress}</div>
        </div>
        ${weatherBlock}
        <div class="${styles.balloonFooter}">
          <button onclick="window.removePlacemark('${city.name.replace(/'/g, "\\'")}')">✕ Удалить метку</button>
        </div>
      </div>
    `
  }, [])

  // Функция добавления меток (вынесена, чтобы использовать и в initMap, и в эффекте)
  const updatePlacemarks = useCallback(() => {
    console.log(
      "updatePlacemarks called, savedCities length:",
      savedCities.length,
      "map:",
      !!mapInstanceRef.current,
    )
    const map = mapInstanceRef.current
    const ymaps = window.ymaps as YandexMapsApi
    if (!map || !ymaps) {
      console.log("updatePlacemarks called, map not ready")
      return
    }
    console.log(
      "updatePlacemarks called, savedCities length:",
      savedCities.length,
    )
    // Удаляем старые кастомные метки
    map.geoObjects.each((obj: YandexPlacemark) => {
      if (obj.properties?.get?.("type") === "custom") {
        map.geoObjects.remove(obj)
      }
    })

    savedCities.forEach(city => {
      let preset = "islands#blueDotIconWithCaption"
      if (city.tripType === "planned") {
        preset = "islands#greenDotIconWithCaption"
      } else if (city.tripType === "past") {
        preset = "islands#redDotIconWithCaption"
      }

      const placemark = new ymaps.Placemark(
        city.coordinates,
        {
          balloonContent: generateBalloonContent(city),
          hintContent: city.name,
          iconCaption: city.name,
          type: "custom",
        },
        { preset, openBalloonOnClick: true },
      ) as unknown as YandexPlacemark

      map.geoObjects.add(placemark)
    })
  }, [savedCities, generateBalloonContent])

  // Эффект для обновления меток при изменении savedCities
  useEffect(() => {
    console.log("🔄 Добавление меток, savedCities:", savedCities.length)
    updatePlacemarks()
  }, [updatePlacemarks])

  const initMap = useCallback(() => {
    const container = mapContainerRef.current
    if (!container) return
    if (mapInstanceRef.current) return

    const ymaps = window.ymaps as YandexMapsApi

    const map = new ymaps.Map(container, {
      center: userLocation ?? [55.751574, 37.573856],
      zoom: userLocation ? 10 : 2.5,
      controls: [
        "zoomControl",
        "geolocationControl",
        "searchControl",
        "rulerControl",
        "fullscreenControl",
        "typeSelector",
        "trafficControl",
        "routeButtonControl",
      ],
    }) as unknown as YandexMapInstance

    map.behaviors.disable("scrollZoom")
    mapInstanceRef.current = map
    window.mapInstance = map
    dispatch(setApiLoaded(true))
    setIsMapReady(true)

    // Добавляем метки (если savedCities уже загружены)
    // Если уже есть сохранённые города – добавляем метки
    if (savedCities.length > 0) {
      updatePlacemarks()
    }

    // Обработчик клика – используем IIFE, чтобы избежать возврата Promise
    map.events.add("click", (e: unknown) => {
      const event = e as { get: (key: string) => [number, number] }
      const coords = event.get("coords")
      void (async () => {
        try {
          const result = (await ymaps.geocode(
            coords,
          )) as unknown as YandexGeoCollection
          const firstGeoObject = result.geoObjects.get(0)
          const geo = firstGeoObject as {
            getLocalities?: () => string[]
            getAddressLine?: () => string
          }

          const city =
            geo.getLocalities?.()?.[0] ?? geo.getAddressLine?.() ?? "Неизвестно"
          console.log(`Клик: ${city}`)
        } catch (err) {
          console.error(err)
        }
      })()
    })
  }, [dispatch, userLocation, updatePlacemarks])

  // ВАЖНО: эффект для обновления меток при изменении savedCities
  useEffect(() => {
    if (isMapReady && savedCities.length > 0) {
      updatePlacemarks()
    }
  }, [isMapReady, savedCities, updatePlacemarks])

  // Загрузка скрипта (однократно)
  useEffect(() => {
    // const ymaps = window.ymaps as YandexMapsApi | undefined;
    if (window.ymaps) {
      initMap()
      return
    }
    if (scriptPromise) {
      void scriptPromise
        .then(() => (window.ymaps as YandexMapsApi).ready(initMap))
        .catch(console.error)
      return
    }

    scriptPromise = new Promise(resolve => {
      const script = document.createElement("script")
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&suggest_apikey=${SUGGEST_API_KEY}&lang=ru_RU&load=package.full`
      script.async = true
      script.onload = () => {
        ;(window.ymaps as YandexMapsApi).ready(() => {
          resolve()
          initMap()
        })
      }
      document.body.appendChild(script)
    })
  }, [initMap])

  // Обновление центра карты
  useEffect(() => {
    // ESLint: selectedCity может быть null, проверка нужна

    if (mapInstanceRef.current && userLocation && !selectedCity) {
      mapInstanceRef.current.setCenter(userLocation, 10)
    }
  }, [userLocation, selectedCity])

  useEffect(() => {
    if (mapInstanceRef.current && selectedCity && selectedCity.coordinates) {
      console.log("Панорамирование к координатам:", selectedCity.coordinates)
      void mapInstanceRef.current.panTo(selectedCity.coordinates, {
        flying: true,
        duration: 500,
      })
      mapInstanceRef.current.setZoom(3, { duration: 300 })
    }
  }, [selectedCity])

  // Добавление меток на карту
  useEffect(() => {
    console.log("🔄 Добавление меток, savedCities:", savedCities)
    const ymaps = window.ymaps as YandexMapsApi
    const mapInstance = mapInstanceRef.current
    if (!mapInstance || !ymaps) return

    // Удаляем старые кастомные метки
    mapInstance.geoObjects.each((obj: YandexPlacemark) => {
      if (obj.properties?.get?.("type") === "custom") {
        mapInstance.geoObjects.remove(obj)
      }
    })

    savedCities.forEach(city => {
      // Выбор цвета метки в зависимости от типа поездки
      let preset = "islands#blueDotIconWithCaption"
      if (city.tripType === "planned") {
        preset = "islands#greenDotIconWithCaption"
      } else if (city.tripType === "past") {
        preset = "islands#redDotIconWithCaption"
      }

      const placemark = new ymaps.Placemark(
        city.coordinates,
        {
          balloonContent: generateBalloonContent(city),
          hintContent: city.name,
          iconCaption: city.name,
          type: "custom",
        },
        { preset, openBalloonOnClick: true },
      ) as unknown as YandexPlacemark

      mapInstance.geoObjects.add(placemark)
    })
  }, [savedCities])

  // Обработчик удаления метки через глобальное событие
  useEffect(() => {
    const handleRemovePlacemark = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      const cityName = customEvent.detail
      dispatch(removeCityFromMap(cityName))
    }
    window.addEventListener("removePlacemark", handleRemovePlacemark)
    return () =>
      window.removeEventListener("removePlacemark", handleRemovePlacemark)
  }, [dispatch])

  return (
    <div
      ref={mapContainerRef}
      style={{ height: "90vh", width: "100%", borderRadius: 16 }}
    />
  )
}

export default Maps
