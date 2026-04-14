/* eslint-disable */
import type React from "react"
import { useCallback, useEffect, useRef } from "react"
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

const Maps: React.FC = () => {
  const dispatch = useAppDispatch()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<YandexMapInstance | null>(null)
  const { savedCities, selectedCity } = useAppSelector(state => state.city)
  const { userLocation } = useAppSelector(state => state.map)

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
          // Приведение к any, так как API Яндекса не полностью типизировано
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
  }, [dispatch, userLocation])

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

  // Генерация содержимого балуна
  const generateBalloonContent = (city: CityData) => {
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
        <div class="${styles.balloonFooter}">
          <button onclick="window.removePlacemark('${city.name.replace(/'/g, "\\'")}')">✕ Удалить метку</button>
        </div>
      </div>
    `
  }

  // Добавление меток на карту
  useEffect(() => {
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
