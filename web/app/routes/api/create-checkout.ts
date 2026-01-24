import type { Route } from "./+types/create-checkout";

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);

  const formData = await request.formData();
  const planId = formData.get("planId") as string;

  // TODO: Add Stripe integration
  // For now, return mock response
  return {
    success: false,
    error: "Stripe integration pending. Please contact support to upgrade.",
  };
}
