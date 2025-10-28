import { redirect } from 'react-router'
import { createClient } from './supabase.server'

/**
 * Protected route loader that ensures user is authenticated
 * Returns the authenticated user or redirects to login
 */
export async function requireAuth(request: Request) {
  const { supabase, headers } = createClient(request)
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      throw redirect('/auth/login')
    }
    
    return { user, headers }
  } catch (error: any) {
    // Handle refresh token errors by redirecting to login
    if (error?.code === 'refresh_token_not_found') {
      throw redirect('/auth/login')
    }
    throw error
  }
}

/**
 * Guest route loader that ensures user is NOT authenticated
 * Redirects to dashboard if user is logged in
 */
export async function requireGuest(request: Request) {
  const { supabase, headers } = createClient(request)
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      throw redirect('/')
    }
    
    return { headers }
  } catch (error: any) {
    // If there's an auth error, treat as guest
    return { headers }
  }
}