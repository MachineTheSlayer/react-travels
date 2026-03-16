// //@ts-ignore
// import { YMapsApi } from '@iminside/react-yandex-maps'

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

export type CityData = {
  id?: string
  name: string
  coordinates: [number, number]
  fullAddress: string
  timestamp?: number
}

export type SuggestionItem = {
  value: string
  text: string
  coordinates: [number, number]
  fullAddress: string
  suggestType?: "geocode" | "suggest"
}

export type SearchHistoryItem = {
  timestamp: number
} & CityData

// Типы для Yandex Maps
export type YandexGeoObject = {
  getLocalities: () => string[]
  getName: () => string
  getAddressLine: () => string
  geometry: {
    getCoordinates: () => [number, number]
  }
}

export type YandexGeoCollection = {
  geoObjects: {
    get: (index: number) => YandexGeoObject
    each: (callback: (geoObject: YandexGeoObject) => void) => void
  }
}

export type YandexMapInstance = {
  setCenter: (
    center: [number, number],
    zoom?: number,
    options?: { duration?: number },
  ) => void
  panTo: (
    center: [number, number],
    options?: { flying?: boolean; duration?: number },
  ) => Promise<void>
  setZoom: (zoom: number, options?: { duration?: number }) => void
  geoObjects: {
    add: (object: YandexPlacemark) => void
    remove: (object: YandexPlacemark) => void
    each: (callback: (object: YandexPlacemark) => void) => void
  }
}

export type YandexPlacemark = {
  properties: {
    set: (key: string, value: string) => void
    get: (key: string) => string
  }
  geometry: {
    getCoordinates: () => [number, number]
  }
  balloon: {
    open: () => void
  }
}

export type YandexMapsApi = {
  geocode: (
    query: string,
    options?: { results?: number; kind?: string },
  ) => Promise<YandexGeoCollection>
  suggest: (
    query: string,
    options?: { results?: number; types?: string[] },
  ) => Promise<YandexSuggestResult>
  Placemark: new (
    coordinates: [number, number],
    properties: Record<string, unknown>,
    options: Record<string, unknown>,
  ) => YandexPlacemark
}

// Типы для Яндекс Suggest
export type YandexSuggestResult = {
  results: YandexSuggestion[]
}

export type YandexSuggestion = {
  title: {
    text: string
    hl?: { from: number; to: number }[]
  }
  subtitle?: {
    text: string
  }
  tags?: string[]
  distance?: {
    value: number
    text: string
  }
  action?: string
  type?: string
  uri?: string
}

// Типы для Redux состояния
export type MapState = {
  center: [number, number]
  zoom: number
  userLocation: [number, number] | null
  ymapsInstance: YandexMapsApi | null
  mapInstance: YandexMapInstance | null
}

export type CityState = {
  savedCities: CityData[]
  selectedCity: CityData | null
  searchHistory: SearchHistoryItem[]
  searchValue: string
  suggestions: SuggestionItem[]
  suggestResults: YandexSuggestion[]
  isLoading: boolean
  isSuggestLoading: boolean
}

// Типы для событий
export type MapClickEvent = {
  get: (key: string) => [number, number]
}

export type RemovePlacemarkEvent = {
  detail: string
} & CustomEvent

export type ThemeMode = "light" | "dark"

export type ThemeState = {
  mode: ThemeMode
}

/* // Глобальные типы
declare global {
  interface Window {
    mapInstance: YandexMapInstance | null;
    ymaps: YandexMapsApi;
  }
} */
