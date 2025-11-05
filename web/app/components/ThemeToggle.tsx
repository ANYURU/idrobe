import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Palette } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const nextTheme = () => {
    if (theme === 'light') return 'warm'
    if (theme === 'warm') return 'dark'
    return 'light'
  }

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4" />
    if (theme === 'warm') return <Palette className="w-4 h-4" />
    return <Moon className="w-4 h-4" />
  }

  const getThemeLabel = () => {
    if (theme === 'light') return 'Light'
    if (theme === 'warm') return 'Warm'
    return 'Dark'
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(nextTheme())}
      className="flex items-center gap-2 w-full justify-start h-10 cursor-pointer"
    >
      {getThemeIcon()}
      {getThemeLabel()} Mode
    </Button>
  )
}