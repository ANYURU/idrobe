import { Link, useLocation, Form } from "react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";
import {
  Home,
  Shirt,
  Palette,
  User,
  Settings,
  LogOut,
  TrendingUp,
  Plus,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  user: any;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Wardrobe", href: "/wardrobe", icon: Shirt },
  { name: "Outfits", href: "/outfits", icon: Palette },
  { name: "Trends", href: "/trends", icon: TrendingUp },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden flex items-center justify-between p-4 bg-sidebar border-b border-sidebar-border">
        <Logo />
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col bg-sidebar border-r border-sidebar-border",
          "md:w-64 md:relative md:translate-x-0",
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:block"
        )}
      >
        <div className="hidden md:flex items-center h-16 px-6 border-b border-sidebar-border">
          <Logo />
        </div>

        <nav className="flex-1 px-6 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = item.href === '/' 
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5 mr-3 shrink-0" />
                {item.name}
              </Link>
            );
          })}

          <div className="pt-6 mt-6 border-t border-sidebar-border">
            <Button className="w-full justify-start h-11" size="sm">
              <Link
                to="/wardrobe/add"
                className="flex items-center w-full"
                onClick={() => setIsOpen(false)}
              >
                <Plus className="w-4 h-4 mr-3 shrink-0" />
                Add Item
              </Link>
            </Button>
          </div>
        </nav>

        <div className="p-6 border-t border-sidebar-border">
          <div className="flex items-center mb-4 p-2 rounded-lg bg-sidebar-accent">
            <div className="w-10 h-10 bg-sidebar-primary/10 rounded-full flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-sidebar-primary" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email || 'User'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <ThemeToggle />
            <Form method="post" action="/auth/signout">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full justify-start h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-3 shrink-0" />
                Sign Out
              </Button>
            </Form>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20  z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
