import { Link, redirect } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4 pt-12">
          <h1 className="text-4xl font-bold text-foreground">
            Welcome to iDrobe
          </h1>
          <p className="text-xl text-muted-foreground">
            Your AI-powered personal styling assistant
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <Shirt className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg text-card-foreground">Organize</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload and catalog your entire wardrobe with AI-powered analysis
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <Sparkles className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle className="text-lg text-card-foreground">Discover</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get personalized outfit recommendations based on your style
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg text-card-foreground">Optimize</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Identify wardrobe gaps and stay on top of fashion trends
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-accent border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Ready to get started?
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              This will take about 5 minutes. We'll learn your style and show you what's possible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              First, let's get to know you and your style preferences.
            </p>
            <Button size="lg" className="w-full">
              <Link to="/onboarding/profile">
                Let's do this!
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-slate-600">
          <p>You can skip this and go to your dashboard anytime</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}