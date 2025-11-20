import { useFormik } from "formik";
import { Link, redirect } from "react-router";
import type { Route } from "./+types/signup";
import { createClient } from "@/lib/supabase.server";
import { signupSchema } from "@/lib/schemas";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionWithToast } from "@/hooks/use-action-with-toast";

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

  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${baseUrl}/auth/confirm`,
      },
    });

    if (authError) {
      return {
        success: false,
        error: authError.message,
      };
    }

    return redirect(`/auth/verify-email?email=${encodeURIComponent(email)}`, { headers });
  } catch (error) {
    return {
      error: "An unexpected error occurred during signup",
    };
  }
}

export default function Signup({}: Route.ComponentProps) {
  const { submit, isSubmitting } = useActionWithToast();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: toFormikValidationSchema(signupSchema),
    onSubmit: (values) => {
      submit(values);
    },
  });

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-6 sm:p-6">
      <div className="w-full max-w-md bg-muted/30 rounded-lg p-6 border border-border">
        <header className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Join iDrobe and start building your perfect wardrobe
          </p>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...formik.getFieldProps("confirmPassword")}
              />
              {formik.touched.confirmPassword &&
                formik.errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {formik.errors.confirmPassword}
                  </p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary hover:underline cursor-pointer">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
