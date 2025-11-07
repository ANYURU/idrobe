import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles, Camera, TrendingUp, Shirt } from "lucide-react";
import type { Route } from "./+types/complete";
import { createClient } from "@/lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { itemCount: 0 }
  
  // Mark onboarding as completed
  await supabase
    .from('user_profiles')
    .update({ onboarding_completed: true })
    .eq('user_id', user.id)
  
  // Get user's uploaded items count
  const { count } = await supabase
    .from('clothing_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
  
  return { itemCount: count || 0 }
}

export default function OnboardingComplete({ loaderData }: Route.ComponentProps) {
  const { itemCount } = loaderData
  
  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg bg-card border-border shadow-sm">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-green-600" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Welcome to iDrobe! 🎉</h1>
            <p className="text-muted-foreground text-lg">
              Your AI stylist is ready to help you look amazing every day.
            </p>
            {itemCount > 0 && (
              <p className="text-sm text-primary font-medium">
                {itemCount} items uploaded and analyzed!
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-linear-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Shirt className="h-6 w-6 text-purple-600" />
                <div className="text-left">
                  <p className="font-medium text-purple-900">Smart Wardrobe</p>
                  <p className="text-sm text-purple-700">AI organizes and categorizes your clothes</p>
                </div>
              </div>
            </div>
            
            <div className="bg-linear-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-blue-900">Daily Recommendations</p>
                  <p className="text-sm text-blue-700">Personalized outfits for any occasion</p>
                </div>
              </div>
            </div>
            
            <div className="bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-green-900">Style Insights</p>
                  <p className="text-sm text-green-700">Track trends and wardrobe gaps</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link to="/">
              <Button size="lg" className="w-full">
                Explore your wardrobe
              </Button>
            </Link>
            
            {itemCount < 5 && (
              <Link to="/wardrobe/add">
                <Button variant="outline" size="lg" className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Add more items
                </Button>
              </Link>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 Tip: The more items you add, the better your recommendations become!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
