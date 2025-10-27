import { useFormik } from 'formik'
import { redirect, useSubmit } from 'react-router'
import type { Route } from './+types/reset-password'
import { createClient } from '@/lib/supabase.server'
import { resetPasswordSchema } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'

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
    return { error: updateError.message }
  }

  return { success: true }
}

export default function ResetPassword({ actionData }: Route.ComponentProps) {
  const submit = useSubmit()

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: resetPasswordSchema,
    onSubmit: (values) => {
      submit(values, { method: 'post' })
    },
  })

  if (actionData?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h2 className="text-xl font-semibold">Password reset successful!</h2>
              <p className="text-slate-600">
                Your password has been reset. Redirecting to login...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Set new password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          {actionData?.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actionData.error}</AlertDescription>
            </Alert>
          )}
          
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

            <Button type="submit" className="w-full" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
