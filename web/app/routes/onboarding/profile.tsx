import { useFormik } from "formik";
import { redirect, useSubmit } from "react-router";
import type { Route } from "./+types/profile";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, MapPin, User, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase.server";
import { onboardingProfileSchema } from "@/lib/schemas";
import { toFormikValidationSchema } from "zod-formik-adapter";

const STYLE_VIBES = [
  {
    value: "minimalist",
    label: "Minimalist",
    description: "Clean lines, neutral colors",
  },
  {
    value: "classic",
    label: "Classic",
    description: "Timeless, elegant pieces",
  },
  {
    value: "trendy",
    label: "Trendy",
    description: "Latest fashion, bold choices",
  },
  {
    value: "bohemian",
    label: "Bohemian",
    description: "Free-spirited, artistic",
  },
  { value: "edgy", label: "Edgy", description: "Bold, unconventional style" },
  {
    value: "romantic",
    label: "Romantic",
    description: "Soft, feminine touches",
  },
];

const FIT_PREFERENCES = [
  { value: "tight", label: "Tight", description: "Form-fitting" },
  { value: "fitted", label: "Fitted", description: "Close to body" },
  { value: "regular", label: "Regular", description: "Standard fit" },
  { value: "loose", label: "Loose", description: "Relaxed fit" },
  {
    value: "oversized",
    label: "Oversized",
    description: "Roomy and comfortable",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { requireAuth } = await import("@/lib/protected-route");

  const { user } = await requireAuth(request);

  // Get existing profile data
  const { data: profile } = await supabase
    .from("user_profiles")
    .select(
      "display_name, location_city, location_country, style_preferences, preferred_fit_name"
    )
    .eq("user_id", user.id)
    .single();
  if (profile?.display_name && profile?.style_preferences?.length > 0) {
    return redirect("/onboarding/upload");
  }

  return { profile };
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  const displayName = formData.get("display_name") as string;
  const locationCity = formData.get("location_city") as string;
  const locationCountry = formData.get("location_country") as string;
  const styleVibe = formData.get("style_vibe") as string;
  const preferredFit = formData.get("preferred_fit") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error: updateError } = await supabase.from("user_profiles").upsert({
    user_id: user.id,
    display_name: displayName,
    location_city: locationCity,
    location_country: locationCountry,
    style_preferences: [styleVibe],
    preferred_fit_name: preferredFit,
    updated_at: new Date().toISOString(),
  });

  if (updateError) {
    return { error: updateError.message };
  }

  return redirect("/onboarding/upload");
}

export default function OnboardingProfile({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const submit = useSubmit();
  const { profile } = loaderData || {};

  const formik = useFormik({
    initialValues: {
      display_name: profile?.display_name || "",
      location_city: profile?.location_city || "",
      location_country: profile?.location_country || "",
      style_vibe: profile?.style_preferences?.[0] || "",
      preferred_fit: profile?.preferred_fit_name || "",
    },
    validationSchema: toFormikValidationSchema(onboardingProfileSchema),
    onSubmit: (values) => {
      submit(values, { method: "post" });
    },
  });

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-muted rounded"></div>
            <div className="flex-1 h-1 bg-muted rounded"></div>
            <div className="flex-1 h-1 bg-muted rounded"></div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Let's get to know you
            </h1>
            <p className="text-muted-foreground">
              Just a few quick questions to personalize your experience
            </p>
          </div>
        </div>

        {actionData?.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{actionData.error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <User className="h-5 w-5" />
                What should we call you?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Your name"
                {...formik.getFieldProps("display_name")}
              />
              {formik.touched.display_name && formik.errors.display_name && (
                <p className="text-sm text-red-500 mt-1">
                  {formik.errors.display_name as string}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <MapPin className="h-5 w-5" />
                Where are you located?
              </CardTitle>
              <CardDescription>
                This helps us give you weather-appropriate recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location_city">City</Label>
                <Input
                  id="location_city"
                  placeholder="e.g., New York"
                  {...formik.getFieldProps("location_city")}
                />
                {formik.touched.location_city &&
                  formik.errors.location_city && (
                    <p className="text-sm text-red-500 mt-1">
                      {formik.errors.location_city as string}
                    </p>
                  )}
              </div>
              <div>
                <Label htmlFor="location_country">Country</Label>
                <Input
                  id="location_country"
                  placeholder="e.g., United States"
                  {...formik.getFieldProps("location_country")}
                />
                {formik.touched.location_country &&
                  formik.errors.location_country && (
                    <p className="text-sm text-red-500 mt-1">
                      {formik.errors.location_country as string}
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Sparkles className="h-5 w-5" />
                What's your style vibe?
              </CardTitle>
              <CardDescription>
                Pick the one that speaks to you most
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {STYLE_VIBES.map((vibe) => (
                  <button
                    key={vibe.value}
                    type="button"
                    onClick={() =>
                      formik.setFieldValue("style_vibe", vibe.value)
                    }
                    className={`p-4 text-left border rounded-lg transition text-foreground cursor-pointer ${
                      formik.values.style_vibe === vibe.value
                        ? "border-ring bg-accent"
                        : "border-border hover:border-ring"
                    }`}
                  >
                    <div className="font-medium">{vibe.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {vibe.description}
                    </div>
                  </button>
                ))}
              </div>
              {formik.touched.style_vibe && formik.errors.style_vibe && (
                <p className="text-sm text-red-500 mt-2">
                  {formik.errors.style_vibe as string}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-card-foreground">How do you like your clothes to fit?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {FIT_PREFERENCES.map((fit) => (
                  <button
                    key={fit.value}
                    type="button"
                    onClick={() =>
                      formik.setFieldValue("preferred_fit", fit.value)
                    }
                    className={`p-3 text-left border rounded-lg transition cursor-pointer ${
                      formik.values.preferred_fit === fit.value
                        ? "border-ring bg-accent"
                        : "border-border hover:border-ring"
                    }`}
                  >
                    <span className="font-medium text-foreground">{fit.label}</span>
                    <span className="text-muted-foreground ml-2">
                      - {fit.description}
                    </span>
                  </button>
                ))}
              </div>
              {formik.touched.preferred_fit && formik.errors.preferred_fit && (
                <p className="text-sm text-red-500 mt-2">
                  {formik.errors.preferred_fit as string}
                </p>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? "Saving..." : (
              <>
                Upload some clothes
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
