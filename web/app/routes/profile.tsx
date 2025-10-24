import { useFormik } from 'formik'
import { useSubmit, redirect } from 'react-router'
import type { Route } from './+types/profile'
import { loadUserProfile } from '@/lib/loaders'
import { createClient } from '@/lib/supabase.server'
import { userProfileSchema } from '@/lib/schemas'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const BODY_TYPES = [
  'hourglass',
  'pear',
  'apple',
  'rectangle',
  'inverted-triangle',
  'petite',
  'tall',
  'athletic',
  'plus-size',
  'prefer-not-to-say',
]

const FIT_PREFERENCES = ['tight', 'fitted', 'regular', 'loose', 'oversized']

const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very-active']

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route')
  const { user } = await requireAuth(request)
  
  const profile = await loadUserProfile(user.id, request)
  return { user, profile }
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request)
  const formData = await request.formData()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const displayName = formData.get('displayName') as string
  const bodyType = formData.get('bodyType') as string
  const preferredFit = formData.get('preferredFit') as string
  const activityLevel = formData.get('activityLevel') as string
  const locationCity = formData.get('locationCity') as string
  const locationCountry = formData.get('locationCountry') as string

  const { error: updateError } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      display_name: displayName,
      body_type: bodyType || null,
      preferred_fit: preferredFit || null,
      default_activity_level: activityLevel || null,
      location_city: locationCity || null,
      location_country: locationCountry || null,
    })

  if (updateError) {
    return { error: updateError.message }
  }

  return { success: true }
}

export default function ProfilePage({ actionData, loaderData }: Route.ComponentProps) {
  const submit = useSubmit()
  const { user, profile } = loaderData

  const formik = useFormik({
    initialValues: {
      displayName: profile?.display_name || '',
      bodyType: profile?.body_type || '',
      preferredFit: profile?.preferred_fit || '',
      activityLevel: profile?.default_activity_level || '',
      locationCity: profile?.location_city || '',
      locationCountry: profile?.location_country || '',
    },
    enableReinitialize: true,
    validationSchema: toFormikValidationSchema(userProfileSchema.partial()),
    onSubmit: (values) => {
      submit(values, { method: 'post' })
    },
  })

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account and preferences</p>
      </div>

      {actionData?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      {actionData?.success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Profile updated successfully
          </AlertDescription>
        </Alert>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your email and account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <p className="text-sm font-medium mt-1">{user?.email}</p>
          </div>
          <div>
            <Label>Account Created</Label>
            <p className="text-sm font-medium mt-1">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Customize your style preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Your name"
                {...formik.getFieldProps('displayName')}
              />
              {formik.touched.displayName && formik.errors.displayName && (
                <p className="text-sm text-red-500">{formik.errors.displayName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyType">Body Type</Label>
              <Select
                value={formik.values.bodyType}
                onValueChange={(value) => formik.setFieldValue('bodyType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your body type" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredFit">Preferred Fit</Label>
              <Select
                value={formik.values.preferredFit}
                onValueChange={(value) => formik.setFieldValue('preferredFit', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your preferred fit" />
                </SelectTrigger>
                <SelectContent>
                  {FIT_PREFERENCES.map((fit) => (
                    <SelectItem key={fit} value={fit}>
                      {fit.charAt(0).toUpperCase() + fit.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityLevel">Activity Level</Label>
              <Select
                value={formik.values.activityLevel}
                onValueChange={(value) => formik.setFieldValue('activityLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your activity level" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationCity">City</Label>
                <Input
                  id="locationCity"
                  placeholder="Your city"
                  {...formik.getFieldProps('locationCity')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationCountry">Country</Label>
                <Input
                  id="locationCountry"
                  placeholder="Your country"
                  {...formik.getFieldProps('locationCountry')}
                />
              </div>
            </div>

            <Button type="submit" disabled={formik.isSubmitting} className="w-full">
              {formik.isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">Danger Zone</CardTitle>
          <CardDescription className="text-red-800">
            Irreversible actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            Delete Account
          </Button>
          <p className="text-sm text-red-800 mt-2">
            This action cannot be undone. All your data will be permanently deleted.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
