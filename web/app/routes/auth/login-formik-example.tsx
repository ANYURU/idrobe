import { useFormik } from 'formik'
import { redirect, useSubmit } from 'react-router'
import type { Route } from './+types/login'
import { createClient } from '@/lib/supabase.server'
import { loginSchema } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export async function loader({ request }: Route.LoaderArgs) {
  const { requireGuest } = await import('@/lib/protected-route');
  await requireGuest(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { supabase } = createClient(request)
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
  if (authError) {
    return { error: authError.message }
  }

  throw redirect('/')
}

export default function Login({ actionData }: Route.ComponentProps) {
  const submit = useSubmit()

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: (values) => {
      // Submit to the action using useSubmit
      submit(values, { method: 'post' })
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {actionData?.error && (
        <div className="text-red-500 mb-4">{actionData.error}</div>
      )}
      
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...formik.getFieldProps('email')}
          />
          {formik.touched.email && formik.errors.email && (
            <p className="text-red-500">{formik.errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...formik.getFieldProps('password')}
          />
          {formik.touched.password && formik.errors.password && (
            <p className="text-red-500">{formik.errors.password}</p>
          )}
        </div>

        <Button type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}