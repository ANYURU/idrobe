import { redirect } from 'react-router'
import type { Route } from './+types/confirm'
import { createClient } from '@/lib/supabase.server'

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request)
  const url = new URL(request.url)
  const token_hash = url.searchParams.get('token_hash')
  const token = url.searchParams.get('token')
  const code = url.searchParams.get('code')
  const type = url.searchParams.get('type')

  // Handle email confirmation with code parameter (default Supabase flow)
  if (code) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: code,
      type: 'email',
    })

    if (!error && data.user) {
      return redirect('/onboarding/welcome', { headers })
    }
  }

  // Handle custom token_hash flow
  if ((token_hash || token) && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token_hash || token!,
      type: type as any,
    })



    if (!error && data.user) {
      return redirect('/onboarding/welcome', { headers })
    }
  }

  return redirect('/auth/login?error=confirmation_failed')
}

export default function Confirm() {
  return <div>Confirming...</div>
}