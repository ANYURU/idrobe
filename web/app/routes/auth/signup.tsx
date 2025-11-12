import { useFormik } from "formik";
import { Link } from "react-router";
import type { Route } from "./+types/signup";
import { createClient } from "@/lib/supabase.server";
import { signupSchema } from "@/lib/schemas";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
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

    return {
      success: true,
      message:
        "Account created successfully! Please check your email to verify your account.",
    };
  } catch (error) {
    return {
      error: "An unexpected error occurred during signup",
    };
  }
}

export default function Signup({}: Route.ComponentProps) {
  const { submit, isSubmitting, success } = useActionWithToast();

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

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-border shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h2 className="text-xl font-semibold">Account created!</h2>
              <p className="text-muted-foreground">
                Check your email to verify your account before signing in.
              </p>
              <Link
                to="/auth/login"
                className="inline-block mt-4 text-blue-600 hover:underline"
              >
                Go to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-border shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>
            Join iDrobe and start building your perfect wardrobe
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <Link to="/auth/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
