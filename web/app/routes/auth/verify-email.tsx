import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/verify-email";
import { Button } from "@/components/ui/button";
import { MailCheck, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase.server";
import { useActionWithToast } from "@/hooks/use-action-with-toast";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireGuest } = await import("@/lib/protected-route");
  await requireGuest(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${baseUrl}/auth/confirm`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true, message: "Verification email resent successfully!" };
  } catch (error) {
    return { error: "Failed to resend verification email" };
  }
}

export default function VerifyEmail({}: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const { submit, isSubmitting } = useActionWithToast();
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    submit(formData);
    setCountdown(60);
  };

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-6 sm:p-6">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        <div className="bg-muted/30 rounded-lg p-6 border border-border">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <MailCheck className="h-16 w-16 text-primary" />
            </div>

            <header>
              <h1 className="text-xl sm:text-2xl font-semibold">Check your email</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                We've sent a verification link to
              </p>
              {email && (
                <p className="text-sm font-medium mt-1">{email}</p>
              )}
            </header>

            <section className="bg-background rounded-lg p-4 border border-border text-left space-y-3" aria-label="Next steps">
              <h2 className="font-semibold text-sm">Next steps:</h2>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Check your inbox for the verification email</li>
                <li>Click the verification link in the email</li>
                <li>Sign in to start using iDrobe</li>
              </ol>
            </section>

            {email && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Didn't receive the email?</p>
                <form method="post" onSubmit={handleResend}>
                  <input type="hidden" name="email" value={email} />
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full cursor-pointer"
                    disabled={isSubmitting || countdown > 0}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSubmitting ? "animate-spin" : ""}`} />
                    {isSubmitting
                      ? "Sending..."
                      : countdown > 0
                      ? `Resend in ${countdown}s`
                      : "Resend verification email"}
                  </Button>
                </form>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Link to="/auth/login" className="block">
                <Button className="w-full cursor-pointer">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <section className="bg-muted/30 rounded-lg p-4 border border-border" aria-label="Troubleshooting">
          <div className="space-y-2">
            <h2 className="font-semibold text-sm">Still can't find it?</h2>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes for the email to arrive</li>
            </ul>
          </div>
        </section>

        <footer className="text-center text-sm text-muted-foreground">
          <p>
            Need help?{" "}
            <a href="mailto:support@idrobe.com" className="text-primary hover:underline cursor-pointer">
              Contact support
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
