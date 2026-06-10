/* eslint-disable */
import type { PayloadAction } from "@reduxjs/toolkit"
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type {
  CityState,
  CityData,
  SuggestionItem,
  YandexMapsApi,
  YandexSuggestion,
  SearchHistoryItem,
} from "../types"

const initialState: CityState = {
  savedCities: [],
  selectedCity: null,
  searchHistory: [],
  searchValue: "",
  suggestions: [],
  suggestResults: [],
  isLoading: false,
  isSuggestLoading: false,
}

type OpenMeteoResponse = {
  current_weather: {
    temperature: number
    windspeed: number
    weathercode: number
    is_day: number
    time: string
  }
}

// const AVIA_API_TOKEN = import.meta.env.VITE_REACT_AVIASALES_API_KEY as string

let citiesCache: Array<{ name: string; code: string }> | null = null

// Загрузка истории из localStorage
export const loadHistoryFromStorage = createAsyncThunk(
  "city/loadHistory",
  (): Promise<SearchHistoryItem[]> => {
    try {
      const saved = localStorage.getItem("citySearchHistory")
      return Promise.resolve(saved ? JSON.parse(saved) : [])
    } catch (error) {
      console.error("Error loading history:", error)
      return Promise.resolve([])
    }
  },
)

// Асинхронный поиск через Яндекс Suggest
export const getSuggestions = createAsyncThunk(
  "city/getSuggestions",
  async ({
    query,
    ymaps,
  }: {
    query: string
    ymaps: YandexMapsApi
  }): Promise<YandexSuggestion[]> => {
    console.log("Trying suggest for:")
    if (!query.trim()) {
      return []
    }

    try {
      console.log("Trying suggest for:", query)
      const result = await ymaps.suggest(query, {
        results: 7,
        types: ["locality", "province", "street"],
      })
      console.log("Suggest result:", result)

      let suggestions: YandexSuggestion[] = []

      // Обработка двух возможных форматов ответа
      if (Array.isArray(result)) {
        suggestions = result
      } else if (
        result &&
        "results" in result &&
        Array.isArray(result.results)
      ) {
        suggestions = result.results
      }

      return suggestions
    } catch (error) {
      console.error("Error getting suggestions:", error)
      return []
    }
  },
)

// Получение координат для выбранной подсказки
export const getCoordinatesForSuggestion = createAsyncThunk(
  "city/getCoordinates",
  async ({
    suggestion,
    ymaps,
  }: {
    suggestion: YandexSuggestion
    ymaps: YandexMapsApi
  }): Promise<SuggestionItem | null> => {
    try {
      const query = suggestion.value
      if (!query) return null
      const result = await ymaps.geocode(query, {
        results: 1,
        kind: "locality",
      })

      const firstGeoObject = result.geoObjects.get(0)

      if (!firstGeoObject) return null

      const localities = firstGeoObject.getLocalities()
      const name =
        localities.length > 0 ? localities[0] : firstGeoObject.getAddressLine()
      const fullAddress = firstGeoObject.getAddressLine()
      const coordinates = firstGeoObject.geometry.getCoordinates()

      return {
        value: name,
        text: suggestion.subtitle?.text ?? fullAddress,
        coordinates,
        fullAddress,
        suggestType: "suggest" as const,
      }
    } catch (error) {
      console.error("Error getting coordinates:", error)
      return null
    }
  },
)

export const fetchWeatherForCity = createAsyncThunk(
  "city/fetchWeatherForCity",
  async ({
    coordinates,
    cityName,
  }: {
    coordinates: [number, number]
    cityName: string
  }) => {
    const [lat, lon] = coordinates
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${String(lat)}&longitude=${String(lon)}&current_weather=true&timezone=auto`
    const response = await fetch(url)
    if (!response.ok)
      throw new Error(`Weather API error: ${String(response.status)}`)
    const data = (await response.json()) as OpenMeteoResponse
    return { cityName, weather: data.current_weather, updatedAt: Date.now() }
  },
)

export const refreshOutdatedWeather = createAsyncThunk(
  "city/refreshOutdatedWeather",
  async (_, { getState, dispatch }) => {
    const state = getState() as { city: CityState }
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const citiesToUpdate = state.city.savedCities.filter(city => {
      return (
        !city.weather ||
        !city.weatherUpdatedAt ||
        now - city.weatherUpdatedAt > oneHour
      )
    })
    await Promise.allSettled(
      citiesToUpdate.map(city =>
        dispatch(
          fetchWeatherForCity({
            coordinates: city.coordinates,
            cityName: city.name,
          }),
        ),
      ),
    )
  },
)

export const getIataForCity = async (
  cityName: string,
): Promise<string | null> => {
  try {
    let cache = citiesCache
    if (!cache) {
      const response = await fetch("/cities.json")
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as Array<{
        name: string
        code: string
      }>
      if (!Array.isArray(data)) {
        console.error("Полученные данные не являются массивом")
        return null
      }
      cache = data
      citiesCache = cache
    }
    const normalized = cityName.toLowerCase().trim()
    let found = cache.find(city => city.name.toLowerCase() === normalized)
    if (found) return found.code
    found = cache.find(city => city.name.toLowerCase().includes(normalized))
    return found ? found.code : null
  } catch (error) {
    console.error("Ошибка при получении IATA-кода:", error)
    return null
  }
}

export const fetchFlightsByRoute = createAsyncThunk(
  "city/fetchFlightsByRoute",
  async ({
    originIata,
    destinationIata,
  }: {
    originIata: string
    destinationIata: string
  }) => {
    const token = import.meta.env.VITE_REACT_AVIASALES_API_KEY
    const url = `/travelpayouts/aviasales/v3/prices_for_dates?origin=${originIata}&destination=${destinationIata}&currency=rub&limit=5&unique=true&token=${token}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    const data = await response.json()
    const flightsData = data.data || []
    const flights = flightsData.map((item: any) => ({
      price: item.price,
      airline: item.airline,
      flightNumber: item.flight_number,
      departureAt: item.departure_at,
      returnAt: item.return_at,
      bookingLink: item.link.startsWith("http")
        ? item.link
        : `https://www.aviasales.com${item.link}`,
    }))
    return { originIata, destinationIata, flights }
  },
)

const citySlice = createSlice({
  name: "city",
  initialState,
  reducers: {
    setSearchValue: (state, action: PayloadAction<string>) => {
      state.searchValue = action.payload
    },

    selectCity: (state, action: PayloadAction<CityData>) => {
      state.selectedCity = action.payload

      // Добавляем в историю
      const historyItem: SearchHistoryItem = {
        ...action.payload,
        id: `${action.payload.name}-${String(Date.now())}`,
        timestamp: Date.now(),
      }

      // Убираем дубликаты
      state.searchHistory = state.searchHistory.filter(
        item => item.name !== action.payload.name,
      )
      state.searchHistory = [historyItem, ...state.searchHistory].slice(0, 10)

      // Сохраняем в localStorage
      localStorage.setItem(
        "citySearchHistory",
        JSON.stringify(state.searchHistory),
      )
    },

    saveCityToMap: (state, action: PayloadAction<CityData>) => {
      // Проверяем, есть ли уже такой город
      const exists = state.savedCities.some(
        city => city.name === action.payload.name,
      )

      if (!exists) {
        state.savedCities.push({
          ...action.payload,
          id: `${action.payload.name}-${String(Date.now())}`,
        })
      }

      state.selectedCity = action.payload
    },

    removeCityFromMap: (state, action: PayloadAction<string>) => {
      state.savedCities = state.savedCities.filter(
        city => city.name !== action.payload,
      )

      if (state.selectedCity?.name === action.payload) {
        state.selectedCity = null
      }
    },

    clearSelectedCity: state => {
      state.selectedCity = null
      state.searchValue = ""
    },

    removeFromHistory: (state, action: PayloadAction<string>) => {
      state.searchHistory = state.searchHistory.filter(
        item => item.name !== action.payload,
      )
      localStorage.setItem(
        "citySearchHistory",
        JSON.stringify(state.searchHistory),
      )
    },

    clearHistory: state => {
      state.searchHistory = []
      localStorage.removeItem("citySearchHistory")
    },

    clearSuggestions: state => {
      state.suggestions = []
    },

    setSavedCities: (state, action: PayloadAction<CityData[]>) => {
      state.savedCities = action.payload
    },

    updateCityIata: (
      state,
      action: PayloadAction<{ cityName: string; iata: string }>,
    ) => {
      const { cityName, iata } = action.payload
      const city = state.savedCities.find(c => c.name === cityName)
      if (city) {
        city.iata = iata
      }
    },
    updateCity: (state, action: PayloadAction<CityData>) => {
      const index = state.savedCities.findIndex(
        city => city.id === action.payload.id,
      )
      if (index !== -1) {
        state.savedCities[index] = action.payload
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadHistoryFromStorage.fulfilled, (state, action) => {
        state.searchHistory = action.payload
      })
      .addCase(getSuggestions.pending, state => {
        state.isSuggestLoading = true
      })
      .addCase(getSuggestions.fulfilled, (state, action) => {
        // console.log('✅ FULFILLED, payload length:', action.payload?.length);
        state.suggestResults = action.payload
        state.isSuggestLoading = false
      })
      .addCase(getSuggestions.rejected, state => {
        state.isSuggestLoading = false
        state.suggestResults = []
      })
      .addCase(getCoordinatesForSuggestion.pending, state => {
        state.isLoading = true
      })
      .addCase(getCoordinatesForSuggestion.fulfilled, (state, action) => {
        if (action.payload) {
          state.suggestions = [action.payload]
        }
        state.isLoading = false
      })
      .addCase(getCoordinatesForSuggestion.rejected, state => {
        state.isLoading = false
      })
      .addCase(fetchWeatherForCity.fulfilled, (state, action) => {
        const { cityName, weather, updatedAt } = action.payload
        const city = state.savedCities.find(city => city.name === cityName)
        if (city) {
          city.weather = weather
          city.weatherUpdatedAt = updatedAt
        }
      })
      .addCase(fetchWeatherForCity.rejected, (_state, action) => {
        console.error(
          `Failed to fetch weather for ${action.meta.arg.cityName}:`,
          action.error,
        )
      })
      .addCase(fetchFlightsByRoute.fulfilled, (state, action) => {
        const { destinationIata, flights } = action.payload
        const city = state.savedCities.find(c => c.iata === destinationIata)
        if (city) {
          city.cheapFlights = flights
          city.flightsUpdatedAt = Date.now()
        }
      })
  },
})

export const {
  setSearchValue,
  selectCity,
  saveCityToMap,
  removeCityFromMap,
  clearSelectedCity,
  removeFromHistory,
  clearHistory,
  clearSuggestions,
  setSavedCities,
  updateCityIata,
  updateCity,
} = citySlice.actions

export default citySlice.reducer
