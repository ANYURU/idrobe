import { Outlet } from "react-router";
import { redirect } from "react-router";
import { createClient } from "@/lib/supabase.server";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export async function loader({ request }: { request: Request }) {
  const { supabase } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    throw redirect("/");
  }

  return { user: null };
}

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background relative">
      
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Logo />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      <Outlet />
    </div>
  );
}
