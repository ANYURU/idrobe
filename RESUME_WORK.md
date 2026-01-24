# Resume Subscription System Work

## Current Status
All subscription system code has been committed to branch: `feature/subscription-system-wip`

## Quick Start Guide

### 1. Clone the repository (if deleted)
```bash
cd ~/workspace/ablestate
git clone https://github.com/ANYURU/idrobe.git
cd idrobe
```

### 2. Switch to the WIP branch
```bash
git checkout feature/subscription-system-wip
```

### 3. Install dependencies
```bash
npm install
cd web && npm install
```

### 4. Start local testing
```bash
# Make sure Docker is running first
open -a Docker

# Start Supabase locally
supabase start

# In another terminal, start the web app
cd web && npm run dev
```

### 5. Follow the testing plan
See `SUBSCRIPTION_TESTING_PLAN.md` for detailed testing steps

## Implementation Overview

### Database Schema (Already Implemented)
The subscription system uses these key tables:
- `subscription_plans` - 5 plans (Free, Premium Monthly/Annual, Pro Monthly/Annual)
- `plan_limits` - Feature limits per plan (uploads, recs, tryons, storage)
- `subscriptions` - User subscription records
- `usage_tracking` - Monthly usage tracking
- `payments` - Payment transaction records

### Frontend Components (Already Implemented)
- `PlanComparisonDialog.tsx` - Drawer UI for plan comparison and upgrade
- `use-usage-limits.ts` - React hook for usage limit management
- `usage-limits.ts` - Server-side usage limit checking logic

### API Endpoints (Already Implemented)
- `/api/check-usage` - Validates usage limits before actions
- `/api/create-checkout` - Stripe checkout creation (stub implementation)

### Integration Points (Already Implemented)
- **Wardrobe Upload** (`/wardrobe/add`) - Checks upload limits before allowing file selection
- **Outfit Recommendations** (`/outfits`) - Checks recommendation limits before generation
- **Settings Page** (`/settings?tab=subscription`) - Shows current plan and usage
- **Sidebar** - "Upgrade Plan" button links to settings with upgrade modal

## What's Been Implemented ✅

### Core Subscription System
- ✅ Database migrations with subscription tables
- ✅ 5 subscription plans seeded (Free, Premium Monthly/Annual, Pro Monthly/Annual)
- ✅ Plan limits configuration (uploads: 10/unlimited, recs: 3/unlimited, tryons: 1/unlimited)
- ✅ Usage tracking with monthly reset periods

### Usage Limit Enforcement
- ✅ Upload limit checking in `/wardrobe/add`
- ✅ Recommendation limit checking in `/outfits`
- ✅ Real-time usage display in settings
- ✅ Automatic upgrade modal when limits exceeded

### User Interface
- ✅ PlanComparisonDialog with all 5 plans
- ✅ Usage progress bars in settings
- ✅ "Upgrade Plan" button in sidebar
- ✅ Usage warnings in upload/recommendation flows
- ✅ Current plan detection and highlighting

### API Infrastructure
- ✅ `/api/check-usage` endpoint for usage validation
- ✅ `/api/create-checkout` endpoint (stub for Stripe)
- ✅ Server-side usage limit checking functions
- ✅ React hooks for client-side usage management

## What Needs to Be Fixed ❌

### Critical Issues

#### 1. Free Subscription Creation on User Signup
**Problem**: New users don't get a free subscription record created automatically
**Impact**: Usage limits don't work correctly, current plan detection fails
**Files to modify**:
- `supabase/migrations/` - Add trigger or RPC function
- Possibly `web/app/routes/auth/` - Ensure subscription creation on signup

**Solution approach**:
```sql
-- Add to a new migration file
CREATE OR REPLACE FUNCTION create_free_subscription_on_signup()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Get free plan ID
    SELECT id INTO free_plan_id FROM subscription_plans WHERE price = 0 LIMIT 1;
    
    -- Create free subscription
    INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
    VALUES (
        NEW.user_id,
        free_plan_id,
        'active',
        NOW(),
        NOW() + INTERVAL '1 year'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trigger_create_free_subscription
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_free_subscription_on_signup();
```

#### 2. Onboarding Recommendations Exclusion
**Problem**: First-time recommendations during onboarding count against usage limits
**Impact**: Poor user experience - users hit limits before using the app
**Files to modify**:
- `web/app/lib/usage-limits.ts` - Add onboarding exclusion logic
- `web/app/routes/onboarding/` - Mark onboarding recommendations
- Usage tracking functions - Add `is_onboarding` flag

**Solution approach**:
```typescript
// Add to usage-limits.ts
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
  // ... rest of existing logic
}
```

#### 3. Stripe Integration Implementation
**Problem**: `/api/create-checkout` only returns stub response
**Impact**: Users cannot actually upgrade their plans
**Files to modify**:
- `web/app/routes/api/create-checkout.ts` - Implement Stripe checkout
- Add Stripe webhook handler for subscription events
- Environment variables for Stripe keys

**Solution approach**:
```typescript
// In create-checkout.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireAuth(request);
  const formData = await request.formData();
  const planId = formData.get("planId") as string;
  
  // Get plan details
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();
    
  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{
      price_data: {
        currency: plan.currency.toLowerCase(),
        product_data: { name: plan.name },
        unit_amount: Math.round(plan.price * 100),
        recurring: { interval: plan.billing_interval }
      },
      quantity: 1
    }],
    mode: 'subscription',
    success_url: `${process.env.SITE_URL}/settings?tab=subscription&success=true`,
    cancel_url: `${process.env.SITE_URL}/settings?tab=subscription`,
    metadata: { user_id: user.id, plan_id: planId }
  });
  
  return { success: true, checkout_url: session.url };
}
```

#### 4. Current Plan Detection Improvement
**Problem**: Plan detection sometimes fails, especially for free users
**Impact**: Wrong plan shown as "current" in upgrade modal
**Files to modify**:
- `web/app/components/PlanComparisonDialog.tsx` - Improve plan detection logic
- `web/app/routes/settings.tsx` - Better subscription loading

### Environment Variables Needed
```bash
# Add to .env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=http://localhost:5173
```

## Testing Checklist

### Before Starting Development
- [ ] Verify all migrations applied: `supabase db diff`
- [ ] Check subscription plans exist: `SELECT * FROM subscription_plans;`
- [ ] Check plan limits exist: `SELECT * FROM plan_limits;`
- [ ] Verify no existing subscriptions: `SELECT * FROM subscriptions;`

### Test Free Subscription Creation
- [ ] Create new user account
- [ ] Verify subscription record created automatically
- [ ] Check plan_id points to free plan
- [ ] Verify usage limits work correctly

### Test Usage Limits
- [ ] Upload 10 files (should work)
- [ ] Try 11th upload (should show upgrade modal)
- [ ] Generate 3 recommendations (should work)
- [ ] Try 4th recommendation (should show upgrade modal)
- [ ] Verify usage tracking records created

### Test Upgrade Flow
- [ ] Click "Upgrade Plan" in sidebar
- [ ] Verify modal shows all 5 plans
- [ ] Verify free plan marked as current
- [ ] Click upgrade button
- [ ] Verify Stripe integration works (after implementation)

### Test Settings Integration
- [ ] Go to `/settings?tab=subscription`
- [ ] Verify current plan displayed correctly
- [ ] Verify usage progress bars accurate
- [ ] Test upgrade modal from settings

## File Structure Reference

```
supabase/migrations/
├── 20251028093000_add_subscription_system.sql     # Core tables
├── 20251028093001_seed_subscription_plans.sql    # Plan data
└── 20251203000000_add_usage_tracking_functions.sql # Usage functions

web/app/
├── components/
│   └── PlanComparisonDialog.tsx                   # Upgrade modal
├── hooks/
│   └── use-usage-limits.ts                       # Usage hook
├── lib/
│   └── usage-limits.ts                           # Server logic
└── routes/
    ├── api/
    │   ├── check-usage.ts                        # Usage API
    │   └── create-checkout.ts                    # Stripe API (stub)
    ├── wardrobe/
    │   └── add.tsx                               # Upload limits
    ├── outfits/
    │   └── _index.tsx                            # Recommendation limits
    └── settings.tsx                              # Subscription management
```

## Database Queries for Debugging

```sql
-- Check subscription plans
SELECT id, name, price, billing_interval FROM subscription_plans ORDER BY price;

-- Check plan limits
SELECT sp.name, pl.limit_type, pl.limit_value 
FROM plan_limits pl
JOIN subscription_plans sp ON sp.id = pl.plan_id
ORDER BY sp.price, pl.limit_type;

-- Check user subscriptions
SELECT u.email, s.status, sp.name, s.current_period_start, s.current_period_end
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
JOIN subscription_plans sp ON sp.id = s.plan_id;

-- Check usage tracking
SELECT u.email, ut.usage_type, ut.usage_count, ut.period_start, ut.period_end
FROM usage_tracking ut
JOIN auth.users u ON u.id = ut.user_id
ORDER BY ut.created_at DESC;

-- Get free plan ID (useful for debugging)
SELECT id, name FROM subscription_plans WHERE price = 0;

-- Check if user has subscription
SELECT s.*, sp.name as plan_name 
FROM subscriptions s 
JOIN subscription_plans sp ON s.plan_id = sp.id 
WHERE s.user_id = 'USER_ID_HERE';
```

## Next Steps Priority Order

1. **Fix free subscription creation** (Critical - breaks usage limits)
2. **Test usage limit enforcement** (Verify current implementation works)
3. **Implement Stripe integration** (Required for actual upgrades)
4. **Add onboarding exclusion** (UX improvement)
5. **Improve plan detection** (Polish)
6. **Add webhook handling** (Production requirement)
7. **Test end-to-end flow** (Final validation)
8. **Deploy and monitor** (Go live)

## Production Deployment Notes

### Required Environment Variables
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key  
- `STRIPE_WEBHOOK_SECRET` - Webhook endpoint secret
- `SITE_URL` - Production domain for redirects

### Stripe Webhook Setup
1. Create webhook endpoint in Stripe dashboard
2. Point to `/api/stripe-webhook` (needs to be created)
3. Listen for: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`

### Monitoring
- Track subscription conversion rates
- Monitor failed payments
- Watch usage limit hit rates
- Alert on webhook failures

## Support Information

### Key Concepts
- **Usage Periods**: Monthly, reset on the 1st of each month
- **Plan Limits**: -1 means unlimited, positive numbers are hard limits
- **Free Plan**: Always has ID from `subscription_plans` where `price = 0`
- **Usage Tracking**: Incremental, tracks total usage per period

### Common Issues
- **"No subscription found"**: User missing subscription record (Issue #1)
- **"Limits not working"**: Check usage_tracking table and period dates
- **"Wrong plan shown"**: Subscription query returning null (Issue #4)
- **"Can't upgrade"**: Stripe integration not implemented (Issue #3)

### Contact Information
- Original developer: [Previous developer's contact]
- Repository: https://github.com/ANYURU/idrobe
- Branch: `feature/subscription-system-wip`
- Documentation: This file + `SUBSCRIPTION_TESTING_PLAN.md` + `DATABASE_SCHEMA.md`
