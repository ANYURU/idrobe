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
import { User as UserIcon, Ruler, Sparkles, Scan } from 'lucide-react'
import { useState } from 'react'
import { ProfilePictureUpload } from '@/components/shared/ProfilePictureUpload'
import { TryonPictureUpload } from '@/components/shared/TryonPictureUpload'
import { toast } from 'sonner'
import type { TablesUpdate } from '@/lib/database.types'

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
  const rawStylePreferences = formData.getAll('stylePreferences') as string[]
  const stylePreferences = [...new Set(rawStylePreferences.filter(Boolean))]
  const profileImageUrl = formData.get('profileImageUrl') as string



  // Build update object without image URLs initially
  const updateData: TablesUpdate<'user_profiles'> = {
    user_id: user.id,
    display_name: displayName,
    body_type_name: bodyType || null,
    preferred_fit_name: preferredFit || null,
    default_activity_level_name: activityLevel || null,
    location_city: locationCity || null,
    location_country: locationCountry || null,
    height_cm: heightCm ? parseInt(heightCm) : null,
    weight_kg: weightKg ? parseFloat(weightKg) : null,
    sustainability_score: sustainabilityScore ? parseInt(sustainabilityScore) : 50,
    style_preferences: stylePreferences.length > 0 ? stylePreferences : null,
  }

  // Only include image URLs if they're explicitly provided (not empty strings)
  if (profileImageUrl) {
    updateData.profile_image_url = profileImageUrl
  }



  const { error: updateError } = await supabase
    .from('user_profiles')
    .upsert(updateData)

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
  const [profileImageUrl, setProfileImageUrl] = useState(profile?.profile_image_url || '')
  const [activeTab, setActiveTab] = useState('basic')




  const formik = useFormik({
    initialValues: {
      displayName: profile?.display_name || '',
      bodyType: profile?.body_type_name || '',
      preferredFit: profile?.preferred_fit_name || '',
      activityLevel: profile?.default_activity_level_name || '',
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
      const submitData = {
        ...values,
        sustainabilityScore: String(sustainabilityValue[0]),
        ...(profileImageUrl && { profileImageUrl })
      }
      
      submit(submitData)
    },
  })

  // Use formik's stylePreferences as the source of truth
  const selectedStyles = formik.values.stylePreferences



  return (
    <div className="px-4 py-6 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-medium">Profile Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="basic" className="flex-col gap-1.5 py-4 px-3 cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <UserIcon className="w-5 h-5" />
            <div className="text-center">
              <div className="text-xs font-medium">Profile</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {profileImageUrl && formik.values.displayName ? 'Complete' : 'Incomplete'}
              </div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="body" className="flex-col gap-1.5 py-4 px-3 cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Ruler className="w-5 h-5" />
            <div className="text-center">
              <div className="text-xs font-medium">Body</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {formik.values.heightCm && formik.values.bodyType ? 'Complete' : 'Optional'}
              </div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="style" className="flex-col gap-1.5 py-4 px-3 cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Sparkles className="w-5 h-5" />
            <div className="text-center">
              <div className="text-xs font-medium">Style</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {selectedStyles.length > 0 ? `${selectedStyles.length} selected` : 'Optional'}
              </div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="tryon" className="flex-col gap-1.5 py-4 px-3 cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Scan className="w-5 h-5" />
            <div className="text-center">
              <div className="text-xs font-medium">Try-On</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {profile?.virtual_tryon_image_url ? 'Complete' : 'Optional'}
              </div>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-8">
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

        <TabsContent value="body" className="mt-8">
          <div className="space-y-8">
            <section>
              <header className="mb-6">
                <h2 className="text-sm font-medium">Physical Measurements</h2>
                <p className="text-xs text-muted-foreground mt-1">Help us recommend the perfect fit</p>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="heightCm" className="text-sm font-medium">Height (cm)</Label>
                  <Input
                    id="heightCm"
                    type="number"
                    placeholder="170"
                    className="mt-1.5"
                    {...formik.getFieldProps('heightCm')}
                  />
                </div>
                <div>
                  <Label htmlFor="weightKg" className="text-sm font-medium">Weight (kg) <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="weightKg"
                    type="number"
                    step="0.1"
                    placeholder="65"
                    className="mt-1.5"
                    {...formik.getFieldProps('weightKg')}
                  />
                </div>
              </div>
            </section>

            <section>
              <header className="mb-6">
                <h2 className="text-sm font-medium">Body Shape & Fit</h2>
                <p className="text-xs text-muted-foreground mt-1">Personalize your clothing recommendations</p>
              </header>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bodyType" className="text-sm font-medium">Body Type</Label>
                  <Select
                    value={formik.values.bodyType}
                    onValueChange={(value) => formik.setFieldValue('bodyType', value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select your body type" />
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
                <div>
                  <Label htmlFor="preferredFit" className="text-sm font-medium">Preferred Fit</Label>
                  <Select
                    value={formik.values.preferredFit}
                    onValueChange={(value) => formik.setFieldValue('preferredFit', value)}
                  >
                    <SelectTrigger className="mt-1.5">
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
            </section>
          </div>
        </TabsContent>

        <TabsContent value="style" className="mt-8">
          <div className="space-y-8">
            <section>
              <header className="mb-6">
                <h2 className="text-sm font-medium">Style Preferences</h2>
                <p className="text-xs text-muted-foreground mt-1">Choose styles that match your taste ({selectedStyles?.length || 0} selected)</p>
              </header>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {styleTags.map((tag) => {
                  const isSelected = (selectedStyles || []).includes(tag.name)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const currentStyles = selectedStyles || []
                        const newStyles = currentStyles.includes(tag.name)
                          ? currentStyles.filter((s: string) => s !== tag.name)
                          : [...currentStyles, tag.name]
                        formik.setFieldValue('stylePreferences', newStyles)
                      }}
                      className={`p-3 text-center border rounded-lg transition cursor-pointer text-sm hover:shadow-sm ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                      }`}
                    >
                      {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                    </button>
                  )
                })}
              </div>
            </section>

            <section>
              <header className="mb-6">
                <h2 className="text-sm font-medium">Lifestyle & Values</h2>
                <p className="text-xs text-muted-foreground mt-1">Tell us about your lifestyle preferences</p>
              </header>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="activityLevel" className="text-sm font-medium">Activity Level</Label>
                  <Select
                    value={formik.values.activityLevel}
                    onValueChange={(value) => formik.setFieldValue('activityLevel', value)}
                  >
                    <SelectTrigger className="mt-1.5">
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
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-sm font-medium">Sustainability Importance</Label>
                    <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">{sustainabilityValue[0]}%</span>
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
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Not Important</span>
                    <span>Very Important</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="tryon" className="mt-8">
          <div className="space-y-8">
            <section>
              <header className="mb-6">
                <h2 className="text-sm font-medium">Virtual Try-On Photo</h2>
                <p className="text-xs text-muted-foreground mt-1">Upload a full-body photo for personalized outfit recommendations</p>
              </header>
              <div className="space-y-6">
                <div className="flex justify-start">
                  <TryonPictureUpload
                    currentImageUrl={profile?.virtual_tryon_image_url || ''}
                    onUpload={() => {
                      // Handled by upload API
                    }}
                    onRemove={() => {
                      // Handled by remove API
                    }}
                    onError={(error) => toast.error(error)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="bg-linear-to-r from-primary/5 to-accent/5 border border-primary/10 rounded-lg p-4 w-full">
                  <p className="text-xs font-medium mb-3 text-primary">📸 Tips for best results:</p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 font-medium">•</span>
                      <span>Stand straight with arms slightly away from body</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 font-medium">•</span>
                      <span>Wear fitted clothing to show body shape</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 font-medium">•</span>
                      <span>Use good lighting and plain background</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 font-medium">•</span>
                      <span>Full body visible from head to toe</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>

      {activeTab !== 'tryon' && (
        <form onSubmit={formik.handleSubmit} className="mt-6">
          <Button type="submit" disabled={isSubmitting} className="w-full cursor-pointer">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      )}
    </div>
  )
}
