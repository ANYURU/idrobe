# Critical Fixes Quick Reference

## 🚨 MUST FIX BEFORE PRODUCTION

### 1. Free Subscription Creation (CRITICAL)
**File**: Create `supabase/migrations/20251225000001_fix_free_subscription_creation.sql`

```sql
-- Fix: Auto-create free subscription on user signup
CREATE OR REPLACE FUNCTION create_free_subscription_on_signup()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    SELECT id INTO free_plan_id FROM subscription_plans WHERE price = 0 LIMIT 1;
    
    IF free_plan_id IS NOT NULL THEN
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

CREATE TRIGGER trigger_create_free_subscription
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_free_subscription_on_signup();
```

**Test**: Create new user → Check `SELECT * FROM subscriptions WHERE user_id = 'NEW_USER_ID';`

### 2. Stripe Integration (HIGH PRIORITY)
**File**: `web/app/routes/api/create-checkout.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);

  const formData = await request.formData();
  const planId = formData.get("planId") as string;

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (!plan) return { success: false, error: "Plan not found" };

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{
      price_data: {
        currency: plan.currency.toLowerCase(),
        product_data: { name: plan.name },
        unit_amount: Math.round(plan.price * 100),
        recurring: { interval: plan.billing_interval as 'month' | 'year' }
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

**Environment Variables**:
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
SITE_URL=http://localhost:5173
```

**Update PlanComparisonDialog.tsx**:
```typescript
// Add to useEffect
useEffect(() => {
  if (fetcher.data?.checkout_url) {
    window.location.href = fetcher.data.checkout_url;
  }
}, [fetcher.data]);
```

### 3. Stripe Webhook (PRODUCTION REQUIRED)
**File**: Create `web/app/routes/api/stripe-webhook.ts`

```typescript
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase.server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function action({ request }: { request: Request }) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  const event = stripe.webhooks.constructEvent(
    body, 
    signature, 
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  const { supabase } = createClient(request);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { user_id, plan_id } = session.metadata!;

      await supabase.from('subscriptions').upsert({
        user_id,
        plan_id,
        status: 'active',
        stripe_subscription_id: session.subscription as string,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      break;
    }
  }

  return new Response('OK');
}
```

## 🧪 TESTING CHECKLIST

### After Fix #1 (Free Subscription)
- [ ] Create new user account
- [ ] Verify subscription record exists
- [ ] Test upload limits work (10 max)
- [ ] Test recommendation limits work (3 max)

### After Fix #2 (Stripe Integration)
- [ ] Click "Upgrade Plan" button
- [ ] Select Premium plan
- [ ] Verify redirect to Stripe checkout
- [ ] Complete test payment
- [ ] Verify success redirect

### After Fix #3 (Webhook)
- [ ] Complete Stripe payment
- [ ] Verify subscription updated in database
- [ ] Test unlimited usage works
- [ ] Verify plan shown correctly in settings

## 🚀 DEPLOYMENT STEPS

1. **Apply database migration**:
   ```bash
   supabase db push
   ```

2. **Add environment variables**:
   ```bash
   # Vercel
   vercel env add STRIPE_PUBLISHABLE_KEY
   vercel env add STRIPE_SECRET_KEY
   vercel env add STRIPE_WEBHOOK_SECRET
   vercel env add SITE_URL
   ```

3. **Deploy frontend**:
   ```bash
   vercel deploy --prod
   ```

4. **Configure Stripe webhook**:
   - URL: `https://yourdomain.com/api/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`

## 🐛 DEBUGGING COMMANDS

```sql
-- Check if user has subscription
SELECT s.*, sp.name FROM subscriptions s 
JOIN subscription_plans sp ON s.plan_id = sp.id 
WHERE s.user_id = 'USER_ID';

-- Check usage tracking
SELECT * FROM usage_tracking 
WHERE user_id = 'USER_ID' 
ORDER BY created_at DESC;

-- Get free plan ID
SELECT id FROM subscription_plans WHERE price = 0;

-- Reset user usage (for testing)
DELETE FROM usage_tracking WHERE user_id = 'USER_ID';
```

## ⚡ QUICK FIXES

### Usage Limits Not Working?
1. Check if user has subscription: `SELECT * FROM subscriptions WHERE user_id = 'X'`
2. If no subscription → Apply Fix #1
3. If subscription exists → Check usage_tracking table

### Upgrade Button Not Working?
1. Check browser console for errors
2. Verify Stripe keys in environment
3. Apply Fix #2 if not done

### Plan Detection Wrong?
1. Check subscription query in settings.tsx
2. Verify currentPlanId prop in PlanComparisonDialog
3. Check subscription status is 'active'

## 📞 EMERGENCY CONTACTS

- **Repository**: https://github.com/ANYURU/idrobe
- **Branch**: `feature/subscription-system-wip`
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Supabase Dashboard**: https://supabase.com/dashboard

## 🎯 SUCCESS CRITERIA

✅ **System is ready when**:
- New users get free subscriptions automatically
- Upload limits work (10 max for free users)
- Recommendation limits work (3 max for free users)
- Upgrade button redirects to Stripe checkout
- Successful payments update user subscriptions
- Settings page shows correct plan and usage
- Unlimited usage works for paid plans

**Estimated completion time**: 1-2 days for experienced developer