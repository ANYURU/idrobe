import { useFormik } from "formik";
import { Link, redirect, useSearchParams } from "react-router";
import { createClient } from "@/lib/supabase.server";
import type { Route } from "./+types/login";
import { loginSchema } from "@/lib/schemas";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionWithToast } from "@/hooks/use-action-with-toast";
import { useEffect, useRef } from "react";
import { useToast } from "@/lib/use-toast";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireGuest } = await import("@/lib/protected-route");
  await requireGuest(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = createClient(request);

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return {
      success: false,
      error: authError.message,
    };
  }

  throw redirect("/dashboard?login=success", { headers });
}

export default function Login({}: Route.ComponentProps) {
  const { submit, isSubmitting } = useActionWithToast();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'session_expired' && !hasShownToast.current) {
      toast.error('Your session has expired. Please sign in again.');
      hasShownToast.current = true;
    }
  }, [searchParams, toast]);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: toFormikValidationSchema(loginSchema),
    onSubmit: (values) => {
      submit(values);
    },
  });

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-6 sm:p-6">
      <div className="w-full max-w-md bg-muted/30 rounded-lg p-6 border border-border">
        <header className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Sign in to your iDrobe account</p>
        </header>
        <div>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...formik.getFieldProps("email")}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-sm text-red-500">{formik.errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...formik.getFieldProps("password")}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-sm text-red-500">{formik.errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-sm text-center">
            <Link
              to="/auth/forgot-password"
              className="text-primary hover:underline block cursor-pointer"
            >
              Forgot password?
            </Link>
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/auth/signup" className="text-primary hover:underline cursor-pointer">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
