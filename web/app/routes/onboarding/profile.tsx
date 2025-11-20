import { useFormik } from "formik";
import { redirect, useSubmit } from "react-router";
import type { Route } from "./+types/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <main className="px-4 py-6 sm:p-6 space-y-4 sm:space-y-6">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <header>
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto mb-4">
            <div className="flex-1 h-1 bg-primary rounded"></div>
            <div className="flex-1 h-1 bg-muted rounded"></div>
            <div className="flex-1 h-1 bg-muted rounded"></div>
            <div className="flex-1 h-1 bg-muted rounded"></div>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-center">
            Let's get to know you
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 text-center">
            Just a few quick questions to personalize your experience
          </p>
        </header>

        {actionData?.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{actionData.error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <section className="bg-muted/30 rounded-lg p-4 border border-border" aria-label="Name">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4" />
              <h2 className="font-semibold">What should we call you?</h2>
            </div>
            <Input
              placeholder="Your name"
              {...formik.getFieldProps("display_name")}
            />
            {formik.touched.display_name && formik.errors.display_name && (
              <p className="text-sm text-red-500 mt-1">
                {formik.errors.display_name as string}
              </p>
            )}
          </section>

          <section className="bg-muted/30 rounded-lg p-4 border border-border" aria-label="Location">
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4" />
                <h2 className="font-semibold">Where are you located?</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                This helps us give you weather-appropriate recommendations
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
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
              <div className="space-y-2">
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
            </div>
          </section>

          <section className="bg-muted/30 rounded-lg p-4 border border-border" aria-label="Style vibe">
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4" />
                <h2 className="font-semibold">What's your style vibe?</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Pick the one that speaks to you most
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_VIBES.map((vibe) => (
                <button
                  key={vibe.value}
                  type="button"
                  onClick={() =>
                    formik.setFieldValue("style_vibe", vibe.value)
                  }
                  className={`p-3 text-left border rounded-lg transition cursor-pointer ${
                    formik.values.style_vibe === vibe.value
                      ? "border-ring bg-background"
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
          </section>

          <section className="bg-muted/30 rounded-lg p-4 border border-border" aria-label="Fit preference">
            <h2 className="font-semibold mb-3">How do you like your clothes to fit?</h2>
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
                      ? "border-ring bg-background"
                      : "border-border hover:border-ring"
                  }`}
                >
                  <span className="font-medium">{fit.label}</span>
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
          </section>

          <Button
            type="submit"
            size="lg"
            className="w-full cursor-pointer"
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
    </main>
  );
}
