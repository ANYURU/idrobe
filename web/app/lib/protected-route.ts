import { redirect } from 'react-router'
import { createClient } from './supabase.server'

/**
 * Protected route loader that ensures user is authenticated
 * Returns the authenticated user or redirects to login
 */
export async function requireAuth(request: Request) {
  const { supabase, headers } = createClient(request)
  
  // Verify session with server (catches expired sessions)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    // Clear invalid session
    await supabase.auth.signOut()
    throw redirect('/auth/login?error=session_expired', { headers })
  }
  
  return { user, headers }
}

/**
 * Guest route loader that ensures user is NOT authenticated
 * Redirects to dashboard if user is logged in
 */
export async function requireGuest(request: Request) {
  const { supabase, headers } = createClient(request)
  
  // Verify session with server
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    throw redirect('/dashboard')
  }
  
  return { headers }
}