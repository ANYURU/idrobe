import { useFormik } from 'formik'
import { redirect } from 'react-router'
import type { Route } from './+types/reset-password'
import { createClient } from '@/lib/supabase.server'
import { resetPasswordSchema } from '@/lib/schemas'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useActionWithToast } from '@/hooks/use-action-with-toast'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PasswordInput } from '@/components/ui/password-input'

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  
  const { supabase, headers } = createClient(request)
  
  // Verify OTP if token_hash is present
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'recovery',
    })
    
    if (error) {
      return redirect('/auth/login?error=invalid_reset_link', { headers })
    }
    
    // Redirect to same page without token_hash to clean URL and ensure session is set
    return redirect('/auth/reset-password', { headers })
  }
  
  // Verify user has a valid session
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return redirect('/auth/login?error=session_expired', { headers })
  }
  
  return null
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const password = formData.get('password') as string

  const { supabase, headers } = createClient(request)
  
  // Verify user has a valid session
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { success: false, error: 'No active session found' }
  }
  
  const { error: updateError } = await supabase.auth.updateUser({ password })
  if (updateError) {
    return { success: false, error: updateError.message }
  }
  
  // Sign out the user so they have to log in with the new password
  // This also clears the "recovery" session state
  await supabase.auth.signOut()
  
  return redirect('/auth/login?reset=success', { headers })
}

export default function ResetPassword({}: Route.ComponentProps) {
  const { submit, isSubmitting } = useActionWithToast()

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: toFormikValidationSchema(resetPasswordSchema),
    onSubmit: (values) => {
      submit(values)
    },
  })

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
      
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-6 sm:p-6">
        <div className="w-full max-w-md bg-muted/30 rounded-lg p-6 border border-border">
          <header className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold">Set new password</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enter your new password below
            </p>
          </header>
          <div>
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  {...formik.getFieldProps('password')}
                />
                {formik.touched.password && formik.errors.password && (
                  <p className="text-sm text-red-500">{formik.errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  {...formik.getFieldProps('confirmPassword')}
                />
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{formik.errors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Reset password'}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
