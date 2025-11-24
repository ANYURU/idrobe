import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function PublicNavbar() {
  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/changelog" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Changelog
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" className="cursor-pointer">
                <Link to="/auth/login">Sign In</Link>
              </Button>
              <Button className="cursor-pointer">
                <Link to="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
