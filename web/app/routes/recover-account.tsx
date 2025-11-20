import { useLoaderData, useFetcher, redirect } from "react-router";
import type { Route } from "./+types/recover-account";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Recovery Period Expired</CardTitle>
            <CardDescription>
              Your account recovery period has expired. Your account and data have been permanently deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/signup">Create New Account</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <CardTitle>Recover Your Account</CardTitle>
          <CardDescription>
            Your account was scheduled for deletion on{" "}
            {profile.deletion_scheduled_at && 
              new Date(profile.deletion_scheduled_at).toLocaleDateString()
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              You have <span className="font-semibold text-foreground">{daysRemaining} days</span> remaining to recover your account.
            </p>
            {profile.deletion_reason && (
              <p className="text-xs text-muted-foreground mt-2">
                Reason: {profile.deletion_reason}
              </p>
            )}
          </div>

          {fetcher.data?.success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{fetcher.data.message}</span>
            </div>
          )}

          {fetcher.data?.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{fetcher.data.error}</span>
            </div>
          )}

          <fetcher.Form method="post" className="space-y-4">
            <Button 
              type="submit" 
              name="action" 
              value="recover_account"
              className="w-full"
              disabled={fetcher.state === "submitting"}
            >
              {fetcher.state === "submitting" ? "Recovering..." : "Recover My Account"}
            </Button>
          </fetcher.Form>

          <div className="text-center">
            <Button variant="ghost" size="sm" asChild>
              <a href="/">Continue to Homepage</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}