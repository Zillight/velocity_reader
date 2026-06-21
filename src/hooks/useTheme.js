import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'velocity.theme'

export function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
}

// Call once at startup (before render) to avoid a flash of the wrong theme.
export function initTheme() {
  applyTheme(getStoredTheme())
}

let listeners = []

export function useTheme() {
  const [theme, setThemeState] = useState(getStoredTheme)

  useEffect(() => {
    const listener = (t) => setThemeState(t)
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  const setTheme = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    applyTheme(next)
    listeners.forEach((l) => l(next))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(getStoredTheme() === 'dark' ? 'light' : 'dark')
  }, [setTheme])

  return { theme, setTheme, toggleTheme }
}
