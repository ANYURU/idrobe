import { useFormik } from 'formik'
import type { Route } from './+types/profile'
import { loadUserProfile } from '@/lib/loaders'
import { createClient } from '@/lib/supabase.server'
import { userProfileSchema } from '@/lib/schemas'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActionWithToast } from '@/hooks/use-action-with-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Camera, User as UserIcon, Ruler, Sparkles, Scan } from 'lucide-react'
import { useState } from 'react'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import { ProfilePictureUpload } from '@/components/shared/ProfilePictureUpload'
import { toast } from 'sonner'

const BODY_TYPES = [
  { value: 'hourglass', label: 'Hourglass' },
  { value: 'pear', label: 'Pear' },
  { value: 'apple', label: 'Apple' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'inverted-triangle', label: 'Inverted Triangle' },
  { value: 'petite', label: 'Petite' },
  { value: 'tall', label: 'Tall' },
  { value: 'athletic', label: 'Athletic' },
  { value: 'plus-size', label: 'Plus Size' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very-active', label: 'Very Active' },
]

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route')
  const { user } = await requireAuth(request)
  const { supabase } = createClient(request)
  
  const profile = await loadUserProfile(user.id, request)
  
  const { data: styleTags } = await supabase
    .from('style_tags')
    .select('id, name')
    .eq('is_active', true)
    .order('popularity_score', { ascending: false })
  
  const { data: fitPreferences } = await supabase
    .from('fit_preferences')
    .select('id, name')
    .eq('is_active', true)
    .order('display_order')
  
  return { user, profile, styleTags: styleTags || [], fitPreferences: fitPreferences || [] }
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
  const heightCm = formData.get('heightCm') as string
  const weightKg = formData.get('weightKg') as string
  const sustainabilityScore = formData.get('sustainabilityScore') as string
  const stylePreferences = formData.getAll('stylePreferences') as string[]
  const profileImageUrl = formData.get('profileImageUrl') as string
  const tryonImageUrl = formData.get('tryonImageUrl') as string

  const { error: updateError } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      display_name: displayName,
      body_type: bodyType || null,
      preferred_fit_name: preferredFit || null,
      default_activity_level: activityLevel || null,
      location_city: locationCity || null,
      location_country: locationCountry || null,
      height_cm: heightCm ? parseInt(heightCm) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      sustainability_score: sustainabilityScore ? parseInt(sustainabilityScore) : 50,
      style_preferences: stylePreferences.length > 0 ? stylePreferences : null,
      profile_image_url: profileImageUrl || null,
      virtual_tryon_image_url: tryonImageUrl || null,
    })

  if (updateError) {
    return { 
      success: false,
      error: updateError.message 
    }
  }

  return { 
    success: true, 
    message: 'Profile updated successfully!' 
  }
}

export default function ProfilePage({ loaderData }: Route.ComponentProps) {
  const { submit, isSubmitting } = useActionWithToast()
  const { user, profile, styleTags, fitPreferences } = loaderData

  const [sustainabilityValue, setSustainabilityValue] = useState([profile?.sustainability_score || 50])
  const [selectedStyles, setSelectedStyles] = useState<string[]>(profile?.style_preferences || [])
  const [profileImageUrl, setProfileImageUrl] = useState(profile?.profile_image_url || '')
  const [tryonImageUrl, setTryonImageUrl] = useState(profile?.virtual_tryon_image_url || '')

  const formik = useFormik({
    initialValues: {
      displayName: profile?.display_name || '',
      bodyType: profile?.body_type || '',
      preferredFit: profile?.preferred_fit_name || '',
      activityLevel: profile?.default_activity_level || '',
      locationCity: profile?.location_city || '',
      locationCountry: profile?.location_country || '',
      heightCm: profile?.height_cm?.toString() || '',
      weightKg: profile?.weight_kg?.toString() || '',
      sustainabilityScore: profile?.sustainability_score?.toString() || '50',
      stylePreferences: profile?.style_preferences || [],
    },
    enableReinitialize: true,
    validationSchema: toFormikValidationSchema(userProfileSchema.partial()),
    onSubmit: (values) => {
      submit(values)
    },
  })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-medium">Profile Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="basic" className="flex-col gap-1 py-3">
            <UserIcon className="w-4 h-4" />
            <span className="text-xs">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="body" className="flex-col gap-1 py-3">
            <Ruler className="w-4 h-4" />
            <span className="text-xs">Body</span>
          </TabsTrigger>
          <TabsTrigger value="style" className="flex-col gap-1 py-3">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs">Style</span>
          </TabsTrigger>
          <TabsTrigger value="tryon" className="flex-col gap-1 py-3">
            <Scan className="w-4 h-4" />
            <span className="text-xs">Try-On</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          <div className="space-y-8">
            <section>
              <header className="mb-6">
                <h2 className="text-sm font-medium">Profile Picture</h2>
                <p className="text-xs text-muted-foreground mt-1">Upload and manage your profile photo</p>
              </header>
              <div className="flex justify-start">
                <ProfilePictureUpload
                  currentImageUrl={profileImageUrl}
                  onUpload={(url) => {
                    setProfileImageUrl(url)
                  }}
                  onRemove={() => {
                    setProfileImageUrl('')
                  }}
                  onError={(error) => toast.error(error)}
                  size={128}
                  disabled={isSubmitting}
                />
              </div>
            </section>

            <section>
              <header className="mb-6">
                <h2 className="text-sm font-medium">Basic Information</h2>
                <p className="text-xs text-muted-foreground mt-1">Your personal details and location</p>
              </header>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Your name"
                    className="mt-1.5"
                    {...formik.getFieldProps('displayName')}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground mt-1.5">{user?.email}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="locationCity" className="text-sm">City</Label>
                    <Input
                      id="locationCity"
                      placeholder="Your city"
                      className="mt-1"
                      {...formik.getFieldProps('locationCity')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationCountry" className="text-sm">Country</Label>
                    <Input
                      id="locationCountry"
                      placeholder="Your country"
                      className="mt-1"
                      {...formik.getFieldProps('locationCountry')}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="body" className="mt-6">
      <div className="space-y-6">

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="heightCm" className="text-sm">Height (cm)</Label>
              <Input
                id="heightCm"
                type="number"
                placeholder="170"
                className="mt-1"
                {...formik.getFieldProps('heightCm')}
              />
            </div>
            <div>
              <Label htmlFor="weightKg" className="text-sm">Weight (kg)</Label>
              <Input
                id="weightKg"
                type="number"
                step="0.1"
                placeholder="65"
                className="mt-1"
                {...formik.getFieldProps('weightKg')}
              />
            </div>
            <div>
              <Label htmlFor="bodyType" className="text-sm">Body Type</Label>
              <Select
                value={formik.values.bodyType}
                onValueChange={(value) => formik.setFieldValue('bodyType', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="preferredFit" className="text-sm">Preferred Fit</Label>
            <Select
              value={formik.values.preferredFit}
              onValueChange={(value) => formik.setFieldValue('preferredFit', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select your preferred fit" />
              </SelectTrigger>
              <SelectContent>
                {fitPreferences.map((fit) => (
                  <SelectItem key={fit.id} value={fit.name}>
                    {fit.name.charAt(0).toUpperCase() + fit.name.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

      </div>
        </TabsContent>

        <TabsContent value="style" className="mt-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-medium mb-2">Style Preferences</h2>
          <p className="text-xs text-muted-foreground mb-4">Select all that apply</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {styleTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                const newStyles = selectedStyles.includes(tag.name)
                  ? selectedStyles.filter(s => s !== tag.name)
                  : [...selectedStyles, tag.name]
                setSelectedStyles(newStyles)
                formik.setFieldValue('stylePreferences', newStyles)
              }}
              className={`p-2 text-center border rounded-lg transition cursor-pointer text-sm ${
                selectedStyles.includes(tag.name)
                  ? 'border-primary bg-accent font-medium'
                  : 'border-border hover:border-primary'
              }`}
            >
              {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
            </button>
          ))}
        </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium mb-4">Activity Level</h3>
          <Select
            value={formik.values.activityLevel}
            onValueChange={(value) => formik.setFieldValue('activityLevel', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select your activity level" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium mb-4">Sustainability</h3>
          <div className="flex justify-between mb-2">
            <Label className="text-sm">Eco-Friendly Importance</Label>
            <span className="text-sm font-medium">{sustainabilityValue[0]}%</span>
          </div>
          <Slider
            value={sustainabilityValue}
            onValueChange={(value) => {
              setSustainabilityValue(value)
              formik.setFieldValue('sustainabilityScore', value[0].toString())
            }}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Not Important</span>
            <span>Very Important</span>
          </div>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="tryon" className="mt-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-medium mb-2">Virtual Try-On Photo</h2>
          <p className="text-xs text-muted-foreground mb-4">Upload a full-body photo for accurate results</p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="w-48 h-72 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {tryonImageUrl ? (
              <img src={tryonImageUrl} alt="Try-on" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-16 h-16 text-muted-foreground" />
            )}
          </div>
          <PhotoUpload
            onUpload={(url) => {
              setTryonImageUrl(url)
              toast.success('Try-on photo uploaded!')
            }}
            onError={(error) => toast.error(error)}
            bucket="tryon"
            maxSize={5}
            className="w-full max-w-md"
          />
          <div className="bg-muted/50 rounded-lg p-4 w-full">
            <p className="text-xs font-medium mb-2">Tips for best results:</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Stand straight with arms slightly away from body</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Wear fitted clothing to show body shape</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Use good lighting and plain background</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Full body visible from head to toe</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
        </TabsContent>
      </Tabs>

      <form onSubmit={formik.handleSubmit} className="mt-6">
        <input type="hidden" name="stylePreferences" value={selectedStyles.join(',')} />
        <input type="hidden" name="sustainabilityScore" value={sustainabilityValue[0]} />
        <input type="hidden" name="profileImageUrl" value={profileImageUrl} />
        <input type="hidden" name="tryonImageUrl" value={tryonImageUrl} />
        <Button type="submit" disabled={isSubmitting} className="w-full cursor-pointer">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
}
