import * as React from "react"
import { Home, Shirt, Palette, TrendingUp, User, Settings, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"
import { SidebarLogo } from "@/components/SidebarLogo"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: any
}

const navMain = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Wardrobe",
    url: "/wardrobe",
    icon: Shirt,
  },
  {
    title: "Outfits",
    url: "/outfits",
    icon: Palette,
  },
  {
    title: "Profile",
    url: "/profile?tab=basic",
    icon: User,
  },
  {
    title: "Trends",
    url: "/trends",
    icon: TrendingUp,
  },
]

const navSecondary = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarLogo />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <div className="mt-auto space-y-2">
          <NavSecondary items={navSecondary} />
          <div className="px-2">
            <Button 
              size="sm" 
              className="w-full justify-start h-8 text-xs"
              asChild
            >
              <Link to="/settings?tab=subscription&upgrade=true">
                <CreditCard className="mr-2 h-3 w-3" />
                Upgrade Plan
              </Link>
            </Button>
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
