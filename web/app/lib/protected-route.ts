import { redirect } from 'react-router'
import { createClient } from './supabase.server'

/**
 * Protected route loader that ensures user is authenticated
 * Returns the authenticated user or redirects to login
 */
export async function requireAuth(request: Request) {
  const { supabase, headers } = createClient(request)
  
  // Quick check: if no session, redirect immediately
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw redirect('/auth/login?error=session_expired')
  }
  
  // Security check: verify session is authentic
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw redirect('/auth/login?error=session_expired')
  }
  
  return { user, headers }
}

/**
 * Guest route loader that ensures user is NOT authenticated
 * Redirects to dashboard if user is logged in
 */
export async function requireGuest(request: Request) {
  const { supabase, headers } = createClient(request)
  
  // Quick check session first
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { headers }
  }
  
  // Verify session is authentic
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    throw redirect('/dashboard')
  }
  
  return { headers }
}