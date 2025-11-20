import { Link, redirect } from 'react-router'
import { Button } from '@/components/ui/button'
import type { Route } from './+types/welcome'
import { Shirt, Sparkles, TrendingUp } from 'lucide-react'

export async function loader({ request }: Route.LoaderArgs) {
  const { createClient } = await import('@/lib/supabase.server')
  const { requireAuth } = await import('@/lib/protected-route')
  
  const { user } = await requireAuth(request)
  const { supabase } = createClient(request)
  
  // Check profile immediately for redirect
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, style_preferences, location_city, location_country, preferred_fit_name')
    .eq('user_id', user.id)
    .single()
  
  // If profile exists and has basic info, redirect to upload step
  if (profile?.display_name && profile?.style_preferences) {
    return redirect('/onboarding/upload')
  }
  
  return null
}

export default function OnboardingWelcome() {
  return (
    <main className="px-4 py-6 sm:p-6 space-y-4 sm:space-y-6">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <header className="text-center pt-4">
          <h1 className="text-xl sm:text-2xl font-semibold">
            Welcome to iDrobe
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your AI-powered personal styling assistant
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4" aria-label="Features">
          <article className="bg-muted/30 rounded-lg p-4 border border-border">
            <Shirt className="h-6 w-6 text-blue-600 mb-2" />
            <h2 className="font-semibold mb-1">Organize</h2>
            <p className="text-sm text-muted-foreground">
              Upload and catalog your entire wardrobe with AI-powered analysis
            </p>
          </article>

          <article className="bg-muted/30 rounded-lg p-4 border border-border">
            <Sparkles className="h-6 w-6 text-purple-600 mb-2" />
            <h2 className="font-semibold mb-1">Discover</h2>
            <p className="text-sm text-muted-foreground">
              Get personalized outfit recommendations based on your style
            </p>
          </article>

          <article className="bg-muted/30 rounded-lg p-4 border border-border">
            <TrendingUp className="h-6 w-6 text-green-600 mb-2" />
            <h2 className="font-semibold mb-1">Optimize</h2>
            <p className="text-sm text-muted-foreground">
              Identify wardrobe gaps and stay on top of fashion trends
            </p>
          </article>
        </section>

        <section className="bg-muted/30 rounded-lg p-4 border border-border" aria-label="Get started">
          <div className="space-y-3">
            <div>
              <h2 className="font-semibold">
                Ready to get started?
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                This will take about 5 minutes. We'll learn your style and show you what's possible.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              First, let's get to know you and your style preferences.
            </p>
            <Button size="lg" className="w-full cursor-pointer">
              <Link to="/onboarding/profile">
                Let's do this!
              </Link>
            </Button>
          </div>
        </section>

        <footer className="text-center text-sm text-muted-foreground">
          <p>You can skip this and go to your dashboard anytime</p>
          <Link to="/" className="text-primary hover:underline cursor-pointer">
            Go to dashboard
          </Link>
        </footer>
      </div>
    </main>
  )
}