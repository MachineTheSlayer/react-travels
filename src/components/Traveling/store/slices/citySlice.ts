import type { PayloadAction } from "@reduxjs/toolkit";
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
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      else if (result && "results" in result && Array.isArray(result.results)) {
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
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
} = citySlice.actions

export default citySlice.reducer
