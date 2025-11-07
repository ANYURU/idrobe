import { Outlet, redirect } from "react-router";
import type { Route } from "./+types/onboarding._layout";
import { createClient } from "@/lib/supabase.server";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);

  const { supabase } = createClient(request);

  // Check onboarding completion status
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed, display_name")
    .eq("user_id", user.id)
    .single();

  const url = new URL(request.url);
  const currentPath = url.pathname;

  // If onboarding is completed and not on complete page, redirect to dashboard
  if (profile?.onboarding_completed && currentPath !== "/onboarding/complete") {
    return redirect("/");
  }

  // If no profile exists and not on welcome/profile pages, redirect to welcome
  if (
    !profile &&
    !currentPath.includes("/welcome") &&
    !currentPath.includes("/profile")
  ) {
    return redirect("/onboarding/welcome");
  }

  // If profile exists but no display_name and not on profile page, redirect to profile
  if (profile && !profile.display_name && !currentPath.includes("/profile")) {
    return redirect("/onboarding/profile");
  }

  return { user, profile };
}

export default function OnboardingLayout({}: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-background relative">


      {/* Clean header with just logo */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />

          <div className="flex items-center gap-6">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              Setting up your wardrobe...
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
