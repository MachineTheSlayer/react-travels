// Ключ для хранения кеша пользователя в localStorage
const USER_CACHE_KEY = "app_user_cache_v1"

export type CachedUser = {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  timestamp: number
}

// Максимальный срок жизни кеша (30 дней). По истечении – считаем кеш устаревшим
const MAX_CACHE_AGE_MS = 30 * 24 * 60 * 60 * 1000

// Сохранить пользователя в кеш
export const cacheUser = (user: CachedUser | null): void => {
  try {
    if (user) {
      const cached: CachedUser = {
        ...user,
        timestamp: Date.now(),
      }
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cached))
    }
    localStorage.removeItem(USER_CACHE_KEY)
  } catch (error) {
    console.error("Failed to cache user:", error)
  }
}

// Загрузить пользователя из кеша. Возвращает null, если кеш отсутствует или устарел
export const getCachedUser = (): CachedUser | null => {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    if (!raw) return null

    const cached = JSON.parse(raw) as CachedUser
    const isExpired = Date.now() - cached.timestamp > MAX_CACHE_AGE_MS
    if (isExpired) {
      localStorage.removeItem(USER_CACHE_KEY)
      return null
    }
    return cached
  } catch (error) {
    console.error("Failed to read cached user:", error)
    return null
  }
}

// Очистить кеш пользователя
export const clearCache = (): void => {
  localStorage.removeItem(USER_CACHE_KEY)
}
