import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export async function checkUsageLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  usageType: "uploads" | "recs" | "tryons",
  isOnboarding = false
): Promise<{ allowed: boolean; current: number; limit: number }> {
  // Skip limit check for onboarding
  if (isOnboarding) {
    return { allowed: true, current: 0, limit: 999999 };
  }

  // Get current subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  const planId = subscription?.plan_id;

  // Get plan limit (default to free plan limits if no subscription)
  const freeLimits = { uploads: 10, recs: 3, tryons: 1 };
  
  if (!planId) {
    const limit = freeLimits[usageType];
    const { data: usage } = await supabase
      .from("usage_tracking")
      .select("usage_count")
      .eq("user_id", userId)
      .eq("usage_type", usageType)
      .gte("period_start", getStartOfMonth().toISOString())
      .single();

    const current = usage?.usage_count || 0;
    return { allowed: current < limit, current, limit };
  }

  const { data: planLimit } = await supabase
    .from("plan_limits")
    .select("limit_value")
    .eq("plan_id", planId)
    .eq("limit_type", usageType)
    .single();

  const limit = planLimit?.limit_value === -1 ? 999999 : planLimit?.limit_value || 0;

  const { data: usage } = await supabase
    .from("usage_tracking")
    .select("usage_count")
    .eq("user_id", userId)
    .eq("usage_type", usageType)
    .gte("period_start", getStartOfMonth().toISOString())
    .single();

  const current = usage?.usage_count || 0;

  return { allowed: current < limit, current, limit };
}

function getStartOfMonth(): Date {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}
