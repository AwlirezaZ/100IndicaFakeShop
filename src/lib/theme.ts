import { useEffect, useState } from 'react'
import { unlock } from './achievements'

/** 'disco' is night mode plus a party (see .disco in index.css). */
export type Theme = 'light' | 'dark' | 'disco'

// Same key is read by the inline script in index.html, which applies the theme before first paint.
const KEY = 'shopnest-theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')

function saved(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' || v === 'disco' ? v : null
  } catch {
    return null
  }
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme !== 'light')
  document.documentElement.classList.toggle('disco', theme === 'disco')
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => saved() ?? (media.matches ? 'dark' : 'light'))

  useEffect(() => {
    apply(theme)
  }, [theme])

  // Follow the computer's light/dark setting until the user picks one themselves.
  useEffect(() => {
    const onChange = () => {
      if (!saved()) setTheme(media.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = () => {
    const next = ({ light: 'dark', dark: 'disco', disco: 'light' } as const)[theme]
    if (next === 'disco') unlock('dancing-queen')
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Storage blocked: the choice just won't be remembered.
    }
    setTheme(next)
  }

  return { theme, toggle }
}
