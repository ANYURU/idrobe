import { useTheme } from '@/contexts/ThemeContext'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Sun, Moon, Palette } from 'lucide-react'

export function SidebarThemeToggle() {
  const { theme, setTheme } = useTheme()

  const nextTheme = () => {
    if (theme === 'light') return 'warm'
    if (theme === 'warm') return 'dark'
    return 'light'
  }

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun />
    if (theme === 'warm') return <Palette />
    return <Moon />
  }

  const getThemeLabel = () => {
    if (theme === 'light') return 'Light'
    if (theme === 'warm') return 'Warm'
    return 'Dark'
  }

  return (
    <SidebarMenuButton
      onClick={() => setTheme(nextTheme())}
      tooltip={`${getThemeLabel()} Mode`}
      className="hover:cursor-pointer"
    >
      {getThemeIcon()}
      <span>{getThemeLabel()} Mode</span>
    </SidebarMenuButton>
  )
}
