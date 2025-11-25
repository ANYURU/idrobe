import { Link, useSearchParams } from 'react-router'
import type { Route } from './+types/reset-email-sent'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { useToast } from '@/lib/use-toast'
import { useEffect, useRef } from 'react'

export async function loader({ request }: Route.LoaderArgs) {
  const { requireGuest } = await import('@/lib/protected-route')
  await requireGuest(request)
  return null
}

export default function ResetEmailSent() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')
  const toast = useToast()
  const hasShownToast = useRef(false)

  useEffect(() => {
    if (!hasShownToast.current) {
      toast.success('Password reset link sent! Check your email.')
      hasShownToast.current = true
    }
  }, [toast])

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-6 sm:p-6">
      <div className="w-full max-w-md bg-muted/30 rounded-lg p-6 border border-border">
        <div className="text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
          <header>
            <h1 className="text-xl sm:text-2xl font-semibold">Check your email</h1>
            <p className="text-sm text-muted-foreground mt-2">
              We've sent a password reset link to{' '}
              {email && <span className="font-medium">{email}</span>}. Click the link to reset your password.
            </p>
          </header>
          <Button asChild className="w-full cursor-pointer">
            <Link to="/auth/login">Back to login</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
