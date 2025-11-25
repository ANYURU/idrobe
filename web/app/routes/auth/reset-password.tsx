import { useFormik } from 'formik'
import { redirect } from 'react-router'
import type { Route } from './+types/reset-password'
import { createClient } from '@/lib/supabase.server'
import { resetPasswordSchema } from '@/lib/schemas'
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
  const password = formData.get('password') as string

  const { supabase } = createClient(request)
  const { error: updateError } = await supabase.auth.updateUser({ password })
  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return redirect('/auth/login?reset=success')
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
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...formik.getFieldProps('password')}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-sm text-red-500">{formik.errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
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
  )
}
