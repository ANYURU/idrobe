import { redirect } from "react-router";
import { createClient } from "./supabase.server";

/**
 * Protected route loader that ensures user is authenticated
 * Returns the authenticated user or redirects to login
 *
 * IMPORTANT: You must return the `headers` object from this function in your loader
 * to ensure the session is properly refreshed and persisted.
 */
export async function requireAuth(request: Request) {
  const { supabase, headers } = createClient(request);

  // Verify user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    // Clear invalid session
    await supabase.auth.signOut();
    throw redirect("/auth/login?error=session_expired", { headers });
  }

  // Get JWT claims to check AMR (Authentication Methods Reference)
  // getClaims() is the secure way to access JWT claims in SSR
  const { data, error: claimsError } = await supabase.auth.getClaims();
  if (!claimsError && data?.claims) {
    const amr = data.claims.amr || [];
    const isRecoverySession = amr.some((r: any) => r.method === "recovery");
    if (isRecoverySession) {
      throw redirect("/auth/reset-password", { headers });
    }
  }

  // Check if user account is soft deleted (unless already on recovery page)
  const url = new URL(request.url);
  if (url.pathname !== "/recover-account") {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("deleted_at, deletion_scheduled_at")
      .eq("user_id", user.id)
      .single();

    if (profile?.deleted_at) {
      // Check if recovery period has expired
      const isExpired = profile.deletion_scheduled_at &&
        new Date(profile.deletion_scheduled_at) < new Date();

      if (isExpired) {
        // Account expired, sign out and redirect to login
        await supabase.auth.signOut();
        throw redirect("/auth/login?error=account_expired", { headers });
      } else {
        // Account can be recovered
        throw redirect("/recover-account", { headers });
      }
    }
  }

  return { user, headers };
}

/**
 * Guest route loader that ensures user is NOT authenticated
 * Redirects to dashboard if user is logged in
 */
export async function requireGuest(request: Request) {
  const { supabase, headers } = createClient(request);

  // Verify if user has a session
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Get JWT claims to check AMR (Authentication Methods Reference)
    // getClaims() is the secure way to access JWT claims in SSR
    const { data, error: claimsError } = await supabase.auth.getClaims();
    if (!claimsError && data?.claims) {
      const amr = data.claims.amr || [];
      const isRecoverySession = amr.some((r: any) => r.method === "recovery");
      if (isRecoverySession) {
        throw redirect("/auth/reset-password", { headers });
      }
    }

    throw redirect("/dashboard", { headers });
  }

  return { headers };
}
