# Developer Handoff: Subscription System

## Project Overview
iDrobe is an AI-powered wardrobe management app with a freemium subscription model. The subscription system is 80% complete and needs finishing touches before production deployment.

## Current State Summary
- **Branch**: `feature/subscription-system-wip`
- **Status**: Core functionality implemented, 4 critical issues remain
- **Database**: Fully migrated with subscription tables
- **Frontend**: UI components and integration complete
- **Backend**: Usage limits working, Stripe integration pending

## Architecture Overview

### Tech Stack
- **Frontend**: React 19 + React Router v7 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Stripe (integration pending)
- **Deployment**: Vercel (frontend) + Supabase (backend)

### Subscription Model
```
Free Plan:
- 10 uploads/month
- 3 recommendations/week  
- 1 try-on/month
- 1GB storage

Premium ($4.99/month or $49.99/year):
- Unlimited uploads
- Unlimited recommendations
- Unlimited try-ons
- 10GB storage

Pro ($9.99/month or $99.99/year):
- Everything in Premium
- 50GB storage
- Social sharing
- API access
```

## Database Schema

### Key Tables
```sql
-- Subscription plans (5 plans total)
subscription_plans (id, name, price, currency, billing_interval, trial_days)

-- Feature limits per plan
plan_limits (plan_id, limit_type, limit_value, period)
-- limit_type: 'uploads', 'recs', 'tryons', 'storage_gb'
-- limit_value: -1 = unlimited, positive = hard limit

-- User subscriptions
subscriptions (user_id, plan_id, status, stripe_subscription_id, current_period_start/end)

-- Usage tracking (monthly reset)
usage_tracking (user_id, usage_type, usage_count, period_start, period_end)

-- Payment records
payments (subscription_id, user_id, amount, currency, status, stripe_payment_intent_id)
```

### Migration Files
- `20251028093000_add_subscription_system.sql` - Core tables
- `20251028093001_seed_subscription_plans.sql` - Plan data and limits
- `20251203000000_add_usage_tracking_functions.sql` - Usage functions

## Code Structure

### Frontend Components

#### PlanComparisonDialog.tsx
```typescript
// Location: web/app/components/PlanComparisonDialog.tsx
// Purpose: Drawer UI for plan comparison and upgrade
// Features: 
// - Shows all 5 plans with pricing
// - Highlights current plan
// - Integrates with Stripe checkout (pending)
// - Responsive design with plan limits display

interface PlanComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
  planLimits: PlanLimit[];
  currentPlanId?: string;
}
```

#### Usage Limits Hook
```typescript
// Location: web/app/hooks/use-usage-limits.ts
// Purpose: Client-side usage limit management
// Features:
// - Checks usage limits before actions
// - Shows upgrade modal when limits exceeded
// - Integrates with React Router fetcher

export function useUsageLimits() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const fetcher = useFetcher();
  
  const checkUsageLimit = async (usageType: UsageType) => {
    // Calls /api/check-usage endpoint
  };
}
```

### Backend Logic

#### Usage Limit Checking
```typescript
// Location: web/app/lib/usage-limits.ts
// Purpose: Server-side usage validation
// Current logic: Checks current usage vs plan limits

export async function checkUsageLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  usageType: "uploads" | "recs" | "tryons"
): Promise<{ allowed: boolean; current: number; limit: number }>
```

#### API Endpoints
```typescript
// /api/check-usage - Usage validation
// /api/create-checkout - Stripe checkout (STUB - needs implementation)
```

### Integration Points

#### Upload Limits (wardrobe/add.tsx)
```typescript
// Checks upload limits before file selection
// Shows usage warning when approaching limits
// Triggers upgrade modal when limit exceeded

const { showUpgradeModal, setShowUpgradeModal, checkUsageLimit, usageData } = useUsageLimits();

useEffect(() => {
  checkUsageLimit("uploads");
}, []);

const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (usageData?.limitExceeded) {
    setShowUpgradeModal(true);
    return;
  }
  // ... file handling
};
```

#### Recommendation Limits (outfits/_index.tsx)
```typescript
// Checks recommendation limits before generation
// Server-side validation in action function

export async function action({ request }: Route.ActionArgs) {
  if (actionType === "generate_recommendations") {
    const usageCheck = await checkUsageLimit(supabase, user.id, "recs");
    
    if (!usageCheck.allowed) {
      return {
        success: false,
        error: "You've reached your recommendation limit for this period.",
        limitExceeded: true,
      };
    }
    // ... generate recommendations
  }
}
```

#### Settings Integration (settings.tsx)
```typescript
// Shows current plan and usage statistics
// Upgrade modal integration with URL params
// Usage progress bars and plan management

// Auto-open upgrade modal if upgrade parameter is present
useEffect(() => {
  if (searchParams.get('upgrade') === 'true') {
    setShowPlanDialog(true);
  }
}, [searchParams]);
```

## Critical Issues to Fix

### 1. Free Subscription Creation (CRITICAL)
**Problem**: New users don't get free subscription records created automatically

**Impact**: Usage limits don't work, plan detection fails

**Solution**: Add database trigger
```sql
-- Create new migration: 20251225000001_fix_free_subscription_creation.sql

CREATE OR REPLACE FUNCTION create_free_subscription_on_signup()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Get free plan ID
    SELECT id INTO free_plan_id FROM subscription_plans WHERE price = 0 LIMIT 1;
    
    IF free_plan_id IS NOT NULL THEN
        -- Create free subscription
        INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
        VALUES (
            NEW.user_id,
            free_plan_id,
            'active',
            NOW(),
            NOW() + INTERVAL '1 year'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trigger_create_free_subscription
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_free_subscription_on_signup();
```

**Testing**:
```sql
-- Test the fix
-- 1. Create new user account
-- 2. Check: SELECT * FROM subscriptions WHERE user_id = 'NEW_USER_ID';
-- 3. Verify plan_id matches free plan
```

### 2. Stripe Integration (HIGH PRIORITY)
**Problem**: `/api/create-checkout` returns stub response

**Impact**: Users cannot upgrade plans

**Solution**: Implement Stripe checkout
```typescript
// Update web/app/routes/api/create-checkout.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);

  const formData = await request.formData();
  const planId = formData.get("planId") as string;

  try {
    // Get plan details
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error || !plan) {
      return { success: false, error: "Plan not found" };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: plan.currency.toLowerCase(),
          product_data: {
            name: plan.name,
            description: plan.description || `${plan.name} subscription`
          },
          unit_amount: Math.round(plan.price * 100), // Convert to cents
          recurring: {
            interval: plan.billing_interval as 'month' | 'year'
          }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.SITE_URL}/settings?tab=subscription&success=true`,
      cancel_url: `${process.env.SITE_URL}/settings?tab=subscription&canceled=true`,
      metadata: {
        user_id: user.id,
        plan_id: planId
      }
    });

    return { 
      success: true, 
      checkout_url: session.url 
    };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return { 
      success: false, 
      error: "Failed to create checkout session" 
    };
  }
}
```

**Environment Variables Needed**:
```bash
# Add to .env and .env.example
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=http://localhost:5173
```

**Update PlanComparisonDialog.tsx**:
```typescript
// In the onClick handler for upgrade button
onClick={isCurrent ? undefined : () => {
  if (plan.price === 0) {
    // Handle free plan selection if needed
    return;
  }
  const formData = new FormData();
  formData.append("planId", plan.id);
  fetcher.submit(formData, {
    method: "POST",
    action: "/api/create-checkout",
  });
}}

// Handle checkout URL redirect
useEffect(() => {
  if (fetcher.data?.checkout_url) {
    window.location.href = fetcher.data.checkout_url;
  }
}, [fetcher.data]);
```

### 3. Stripe Webhook Handler (REQUIRED FOR PRODUCTION)
**Problem**: No webhook handling for subscription events

**Impact**: Subscriptions won't update when payments succeed/fail

**Solution**: Create webhook endpoint
```typescript
// Create web/app/routes/api/stripe-webhook.ts

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase.server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function action({ request }: { request: Request }) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const { supabase } = createClient(request);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { user_id, plan_id } = session.metadata!;

        // Update or create subscription
        await supabase
          .from('subscriptions')
          .upsert({
            user_id,
            plan_id,
            status: 'active',
            stripe_subscription_id: session.subscription as string,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            updated_at: new Date().toISOString()
          });

        // Record payment
        await supabase
          .from('payments')
          .insert({
            user_id,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || 'usd',
            status: 'succeeded',
            payment_type: 'subscription',
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at: new Date().toISOString()
          });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Update subscription to past_due
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', invoice.subscription as string);

        break;
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
}
```

### 4. Onboarding Exclusion (UX IMPROVEMENT)
**Problem**: Onboarding recommendations count against limits

**Impact**: Poor first-time user experience

**Solution**: Add onboarding flag
```typescript
// Update web/app/lib/usage-limits.ts
export async function checkUsageLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  usageType: "uploads" | "recs" | "tryons",
  isOnboarding = false // Add this parameter
): Promise<{ allowed: boolean; current: number; limit: number }> {
  // Skip limit check for onboarding
  if (isOnboarding) {
    return { allowed: true, current: 0, limit: 999999 };
  }
  
  // ... existing logic
}

// Update usage tracking to exclude onboarding
// Add is_onboarding column to usage_tracking table
```

## Testing Strategy

### Local Testing Setup
```bash
# 1. Start Supabase
supabase start

# 2. Verify migrations
supabase db diff

# 3. Check seeded data
supabase db shell
SELECT * FROM subscription_plans;
SELECT * FROM plan_limits;

# 4. Start web app
cd web && npm run dev
```

### Test Cases

#### Free Subscription Creation
```bash
# 1. Create new user account
# 2. Check database: SELECT * FROM subscriptions WHERE user_id = 'USER_ID';
# 3. Verify plan_id matches free plan
# 4. Test usage limits work correctly
```

#### Usage Limits
```bash
# 1. Upload 10 files (should work)
# 2. Try 11th upload (should show upgrade modal)
# 3. Generate 3 recommendations (should work)  
# 4. Try 4th recommendation (should show upgrade modal)
# 5. Check usage_tracking table for records
```

#### Stripe Integration (after implementation)
```bash
# 1. Click "Upgrade Plan" in sidebar
# 2. Select Premium plan
# 3. Verify redirect to Stripe checkout
# 4. Complete test payment
# 5. Verify webhook updates subscription
# 6. Check subscription status in settings
```

### Database Queries for Testing
```sql
-- Check subscription plans
SELECT id, name, price, billing_interval FROM subscription_plans ORDER BY price;

-- Check plan limits
SELECT sp.name, pl.limit_type, pl.limit_value 
FROM plan_limits pl
JOIN subscription_plans sp ON sp.id = pl.plan_id
ORDER BY sp.price, pl.limit_type;

-- Check user subscription
SELECT s.*, sp.name as plan_name 
FROM subscriptions s 
JOIN subscription_plans sp ON s.plan_id = sp.id 
WHERE s.user_id = 'USER_ID_HERE';

-- Check usage tracking
SELECT usage_type, usage_count, period_start, period_end
FROM usage_tracking 
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC;

-- Get free plan ID
SELECT id, name FROM subscription_plans WHERE price = 0;
```

## Production Deployment

### Environment Variables
```bash
# Required for production
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=https://yourdomain.com
```

### Stripe Setup
1. Create Stripe account and get API keys
2. Create webhook endpoint: `https://yourdomain.com/api/stripe-webhook`
3. Configure webhook events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Monitoring
- Set up error tracking (Sentry recommended)
- Monitor webhook delivery in Stripe dashboard
- Track subscription metrics
- Alert on failed payments

## Common Issues & Solutions

### "No subscription found" Error
- **Cause**: User missing subscription record (Issue #1)
- **Fix**: Implement free subscription creation trigger
- **Debug**: Check `subscriptions` table for user

### Usage Limits Not Working
- **Cause**: Missing subscription or incorrect period calculation
- **Fix**: Verify subscription exists and period dates are correct
- **Debug**: Check `usage_tracking` table and period logic

### Wrong Plan Shown as Current
- **Cause**: Subscription query returning null
- **Fix**: Improve plan detection logic in components
- **Debug**: Check subscription loading in settings page

### Upgrade Button Not Working
- **Cause**: Stripe integration not implemented (Issue #3)
- **Fix**: Implement Stripe checkout as described above
- **Debug**: Check browser network tab for API responses

## Next Developer Notes

### Immediate Priorities
1. **Fix free subscription creation** - Critical for usage limits
2. **Implement Stripe integration** - Required for revenue
3. **Add webhook handling** - Required for production
4. **Test end-to-end flow** - Ensure everything works

### Nice-to-Have Improvements
- Add subscription analytics dashboard
- Implement usage notifications
- Add plan change/cancellation flows
- Improve error handling and user feedback
- Add subscription pause/resume functionality

### Code Quality
- All TypeScript types are properly defined
- Error handling is implemented throughout
- Components are well-documented
- Database queries are optimized
- Security best practices followed (RLS policies, input validation)

## Contact & Resources
- **Repository**: https://github.com/ANYURU/idrobe
- **Branch**: `feature/subscription-system-wip`
- **Documentation**: `SUBSCRIPTION_TESTING_PLAN.md`, `DATABASE_SCHEMA.md`
- **Stripe Docs**: https://stripe.com/docs/checkout/quickstart
- **Supabase Docs**: https://supabase.com/docs

## Final Notes
The subscription system is well-architected and mostly complete. The remaining work is primarily integration (Stripe) and bug fixes (free subscription creation). The codebase is clean, well-typed, and follows React/TypeScript best practices. A competent developer should be able to complete this work in 1-2 weeks.