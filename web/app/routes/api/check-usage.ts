import type { Route } from "./+types/check-usage";
import { checkUsageLimit } from "@/lib/usage-limits";

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);

  const formData = await request.formData();
  const usageType = formData.get("usageType") as "uploads" | "recs" | "tryons";

  if (!usageType) {
    return { error: "Usage type is required" };
  }

  try {
    const result = await checkUsageLimit(supabase, user.id, usageType);
    
    return {
      allowed: result.allowed,
      current: result.current,
      limit: result.limit,
      limitExceeded: !result.allowed,
      usageType,
    };
  } catch (error) {
    return { error: "Failed to check usage limit" };
  }
}