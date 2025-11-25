import { useFormik } from 'formik'
import { Link, redirect } from 'react-router'
import type { Route } from './+types/forgot-password'
import { createClient } from '@/lib/supabase.server'
import { forgotPasswordSchema } from '@/lib/schemas'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActionWithToast } from '@/hooks/use-action-with-toast'

export async function loader({ request }: Route.LoaderArgs) {
  const { requireGuest } = await import('@/lib/protected-route');
  await requireGuest(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const email = formData.get('email') as string

  const { supabase } = createClient(request)
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
  if (resetError) {
    return { success: false, error: resetError.message }
  }

  return redirect(`/auth/reset-email-sent?email=${encodeURIComponent(email)}`)
}

export default function ForgotPassword({}: Route.ComponentProps) {
  const { submit, isSubmitting } = useActionWithToast()

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: toFormikValidationSchema(forgotPasswordSchema),
    onSubmit: (values) => {
      submit(values)
    },
  })

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-6 sm:p-6">
      <div className="w-full max-w-md bg-muted/30 rounded-lg p-6 border border-border">
        <header className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold">Reset password</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enter your email to receive a password reset link
          </p>
        </header>
        <div>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...formik.getFieldProps('email')}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-sm text-red-500">{formik.errors.email}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-center text-muted-foreground">
            <Link to="/auth/login" className="text-primary hover:underline cursor-pointer">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
