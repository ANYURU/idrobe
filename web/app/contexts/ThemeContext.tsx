import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Theme = 'light' | 'warm' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('warm')

  useEffect(() => {
    const savedTheme = localStorage.getItem('idrobe-theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Default to warm theme
      setTheme('warm')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('idrobe-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    
    // Also set class for compatibility
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}