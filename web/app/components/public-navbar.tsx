import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export function PublicNavbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/guest">
              <Logo />
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/changelog" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Changelog
            </Link>
            <Button variant="ghost" className="cursor-pointer">
              <Link to="/auth/login">Sign In</Link>
            </Button>
            <Button className="cursor-pointer">
              <Link to="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
