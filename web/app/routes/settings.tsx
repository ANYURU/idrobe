import { useLoaderData, useSubmit } from 'react-router'
import type { Route } from './+types/settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route')
  const { user } = await requireAuth(request)
  const { createClient } = await import('@/lib/supabase.server')
  const { supabase } = createClient(request)

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return { user, profile }
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import('@/lib/protected-route')
  const { user } = await requireAuth(request)

  const formData = await request.formData()
  const action = formData.get('action')

  if (action === 'update_notifications') {
    return { success: true, message: 'Notification settings updated' }
  }

  return { error: 'Invalid action' }
}

export default function SettingsPage() {
  const { user, profile } = useLoaderData<typeof loader>()
  const submit = useSubmit()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your app preferences and account</p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-slate-600">{user.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Member Since</Label>
              <p className="text-sm text-slate-600">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="daily-recommendations">Daily Recommendations</Label>
              <p className="text-sm text-slate-600">Get daily outfit suggestions</p>
            </div>
            <Switch id="daily-recommendations" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="trend-alerts">Trend Alerts</Label>
              <p className="text-sm text-slate-600">Notifications about new fashion trends</p>
            </div>
            <Switch id="trend-alerts" />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Control your data and privacy preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public-collections">Public Collections</Label>
              <p className="text-sm text-slate-600">Allow others to see your public outfit collections</p>
            </div>
            <Switch id="public-collections" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}