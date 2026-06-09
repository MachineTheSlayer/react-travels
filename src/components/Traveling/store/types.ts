import type ymaps from "yandex-maps"

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
  isInitialized: boolean
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterCredentials = {
  displayName?: string
} & LoginCredentials

export type WeatherData = {
  temperature: number
  windspeed: number
  weathercode: number
  is_day: number
  time: string
}

export type CityData = {
  id?: string
  name: string
  coordinates: [number, number]
  fullAddress: string
  timestamp?: number
  tripType?: "planned" | "past"
  dateRange?: [string, string]
  places?: string[]
  rating?: number
  weather?: WeatherData
  weatherUpdatedAt?: number
  iata?: string // IATA-код города (назначения)
  cheapFlights?: {
    price: number
    airline: string
    flightNumber: number
    departureAt: string
    returnAt?: string
    bookingLink: string
  }[]
  flightsUpdatedAt?: number
}

export type SuggestionItem = {
  value: string
  text: string
  coordinates: [number, number]
  fullAddress: string
  suggestType?: "suggest" | "geocode"
}

export type SearchHistoryItem = {
  timestamp: number
} & CityData

// Типы для Yandex Maps

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
  events: {
    add: (eventType: string, handler: (e: unknown) => void) => void // важно: параметр unknown
  }
  destroy: () => void
  behaviors: {
    disable: (behavior: string) => void
    enable: (behavior: string) => void
  }
  getZoom: () => number
}

export type MapComponentRef = {
  instance?: YandexMapInstance
}

export type YandexPlacemark = {
  properties: {
    set: (path: string | object, value?: unknown) => void
    get: (path: string, defaultValue?: unknown) => string
  }
  geometry: {
    getCoordinates: () => [number, number]
  }
  balloon: {
    open: () => void
    close: () => void
  }
  events: {
    add: (eventType: string, handler: (e: unknown) => void) => void
  }
}

export type YandexMapsApi = {
  ready: (callback: () => void) => void
  geocode: (
    query: string,
    options?: GeocodeOptions,
  ) => Promise<YandexGeoCollection>
  suggest: (
    query: string,
    options?: SuggestOptions,
  ) => Promise<YandexSuggestResult>
  Map: new (
    element: HTMLElement,
    state: MapState,
    options?: MapOptions,
  ) => YandexMapInstance
  Placemark: new (
    geometry: [number, number],
    properties: PlacemarkProperties,
    options: PlacemarkOptions,
  ) => YandexPlacemark
  control: {
    ZoomControl: new (options?: unknown) => unknown
    GeolocationControl: new (options?: unknown) => unknown
  }
} & typeof ymaps

export type MapOptions = {
  suppressMapOpenBlock?: boolean
  yandexMapDisablePoiInteractivity?: boolean
}

export type PlacemarkProperties = {
  balloonContent?: string
  balloonContentHeader?: string
  balloonContentBody?: string
  balloonContentFooter?: string
  hintContent?: string
  iconCaption?: string
  iconContent?: string
}

export type PlacemarkOptions = {
  preset?: string
  iconColor?: string
  openBalloonOnClick?: boolean
  balloonCloseButton?: boolean
  balloonPanelMaxMapArea?: number
  hideIconOnBalloonOpen?: boolean
}

export type GeocodeOptions = {
  results?: number
  kind?: "house" | "street" | "metro" | "district" | "locality"
  boundedBy?: [[number, number], [number, number]]
}

export type SuggestOptions = {
  results?: number
  types?: ("locality" | "province" | "street" | "house")[]
  boundedBy?: [[number, number], [number, number]]
  highlight?: boolean
}

export type YandexGeoCollection = {
  geoObjects: {
    get: (index: number) => YandexGeoObject
    each: (callback: (geoObject: YandexGeoObject) => void) => void
    getLength: () => number
  }
}

export type YandexGeoObject = {
  getLocalities: () => string[]
  getName: () => string
  getAddressLine: () => string
  geometry: {
    getCoordinates: () => [number, number]
  }
  properties: {
    get: (key: string) => unknown
  }
}

// Типы для Яндекс Suggest
export type YandexSuggestResult = {
  results: YandexSuggestion[]
}

export type YandexSuggestion = {
  // type?: string;
  displayName?: string
  value: string
  hl?: [number, number][]
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
  type?: "locality" | "province" | "street" | "house"
  uri?: string
}

// Типы для Redux состояния
export type MapState = {
  center: [number, number]
  centerTo?: [number, number]
  zoom?: number
  userLocation: [number, number] | null
  ymapsInstance: YandexMapsApi | null
  mapInstance: YandexMapInstance | null
  controls?: string[]
  behaviors?: string[]
  isApiLoaded: boolean
  isLoading: boolean
  error: string | null
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

// Глобальные типы
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    ymaps: YandexMapsApi
    mapInstance?: YandexMapInstance
    removePlacemark: (cityName: string) => void
    /** Хранилище placemark по названию города */
    cityPlacemarks: Map<string, YandexPlacemark>
    /** Показать поле ввода города вылета */
    showFlightInput: (cityName: string) => void
    /** Найти билеты по указанным городам (вылет из формы) */
    searchFlights: (cityName: string) => Promise<void>
  }
}
