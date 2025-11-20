import { useLoaderData, useFetcher, redirect, Link } from "react-router";
import type { Route } from "./+types/recover-account";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);

  // Check if user account is soft deleted
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("deleted_at, deletion_scheduled_at, deletion_reason")
    .eq("user_id", user.id)
    .single();

  // If account is not deleted, redirect to dashboard
  if (!profile?.deleted_at) {
    throw redirect("/dashboard");
  }

  // Check if recovery period has expired
  const isExpired = profile.deletion_scheduled_at && 
    new Date(profile.deletion_scheduled_at) < new Date();

  return {
    user,
    profile,
    isExpired,
    daysRemaining: profile.deletion_scheduled_at ? 
      Math.max(0, Math.ceil((new Date(profile.deletion_scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);

  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "recover_account") {
    const { data, error } = await supabase.rpc('recover_deleted_account', {
      target_user_id: user.id
    });

    if (error) {
      console.log("Error: ", error)
      return { success: false, error: error.message };
    }

    if (data) {
      return { success: true, message: "Account recovered successfully!", redirect: "/dashboard" };
    } else {
      return { success: false, error: "Recovery period has expired or account was not found." };
    }
  }

  return { error: "Invalid action" };
}

export default function RecoverAccountPage() {
  const { profile, isExpired, daysRemaining } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  if (isExpired) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-6 sm:p-6">
        <div className="w-full max-w-md bg-muted/30 rounded-lg p-6 border border-border">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <header>
              <h1 className="text-xl sm:text-2xl font-semibold">Recovery Period Expired</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your account recovery period has expired. Your account and data have been permanently deleted.
              </p>
            </header>
            <Link to="/auth/signup" className="block">
              <Button className="w-full cursor-pointer">Create New Account</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-6 sm:p-6">
      <div className="w-full max-w-md bg-muted/30 rounded-lg p-6 border border-border">
        <div className="text-center space-y-6">
          <header>
            <h1 className="text-xl sm:text-2xl font-semibold">Recover Your Account</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your account was scheduled for deletion on{" "}
              {profile.deletion_scheduled_at && 
                new Date(profile.deletion_scheduled_at).toLocaleDateString()
              }
            </p>
          </header>

          <section className="bg-background rounded-lg p-4 border border-border" aria-label="Recovery status">
            <p className="text-sm text-muted-foreground">
              You have <span className="font-semibold text-foreground">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span> remaining to recover your account.
            </p>
            {profile.deletion_reason && (
              <p className="text-xs text-muted-foreground mt-2">
                Reason: {profile.deletion_reason.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </p>
            )}
          </section>

          {fetcher.data?.success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-900">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{fetcher.data.message}</span>
            </div>
          )}

          {fetcher.data?.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{fetcher.data.error}</span>
            </div>
          )}

          <fetcher.Form method="post">
            <Button 
              type="submit" 
              name="action" 
              value="recover_account"
              className="w-full cursor-pointer"
              disabled={fetcher.state === "submitting"}
            >
              {fetcher.state === "submitting" ? "Recovering..." : "Recover My Account"}
            </Button>
          </fetcher.Form>
        </div>
      </div>
    </main>
  );
}