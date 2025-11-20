import { useTheme } from '@/contexts/ThemeContext'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sun, Moon, Palette, ChevronUp } from 'lucide-react'

export function SidebarThemeToggle() {
  const { theme, setTheme } = useTheme()

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
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="hover:cursor-pointer">
            {getThemeIcon()}
            <span>{getThemeLabel()} Mode</span>
            <ChevronUp className="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-[--radix-popper-anchor-width]">
          <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
            <Sun className="mr-2 h-4 w-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('warm')} className="cursor-pointer">
            <Palette className="mr-2 h-4 w-4" />
            Warm
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
