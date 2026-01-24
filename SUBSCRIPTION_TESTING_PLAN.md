# Subscription System Testing Plan

## Summary of Changes

### New Files Created
1. **web/app/lib/usage-limits.ts** - Server-side usage limit checking logic
2. **web/app/hooks/use-usage-limits.ts** - React hook for usage limit management
3. **web/app/components/PlanComparisonDialog.tsx** - Drawer UI for plan comparison and upgrade
4. **web/app/routes/api/check-usage.ts** - API endpoint for usage limit validation
5. **web/app/routes/api/create-checkout.ts** - API endpoint for Stripe checkout (stub)
6. **supabase/migrations/20251203000000_add_usage_tracking_functions.sql** - Database function for usage tracking

### Modified Files
1. **web/app/components/app-sidebar.tsx** - Added "Upgrade Plan" button
2. **web/app/routes/settings.tsx** - Added upgrade modal integration with URL params
3. **web/app/routes/wardrobe/add.tsx** - Added usage limit checks for uploads
4. **web/app/routes/outfits/_index.tsx** - Added usage limit checks for recommendations

## Testing Steps

### 1. Database Setup
```bash
# Start Supabase locally
supabase start

# Reset database with all migrations
supabase db reset

# Verify migrations applied
supabase db diff
```

### 2. Verify Database State
Check that these tables exist and are populated:
- [ ] `subscription_plans` - Should have 5 plans (Free, Premium Monthly/Annual, Pro Monthly/Annual)
- [ ] `plan_limits` - Should have limits for each plan (uploads, recs, tryons, storage)
- [ ] `subscriptions` - Should be empty initially
- [ ] `usage_tracking` - Should be empty initially

### 3. User Signup Flow
- [ ] Create a new user account
- [ ] Verify `user_profiles` record is created
- [ ] Check if subscription record is created (EXPECTED ISSUE: No free subscription created)

### 4. Usage Limit Testing

#### Test Upload Limits
- [ ] Go to /wardrobe/add
- [ ] Try uploading files
- [ ] Verify usage is tracked in `usage_tracking` table
- [ ] Upload 10 files (free limit)
- [ ] Try uploading 11th file - should show upgrade modal

#### Test Recommendation Limits
- [ ] Go to /outfits
- [ ] Generate recommendations
- [ ] Verify usage is tracked
- [ ] Generate 3 recommendations (free limit)
- [ ] Try 4th recommendation - should show upgrade modal

### 5. Upgrade Modal Testing
- [ ] Click "Upgrade Plan" in sidebar
- [ ] Verify modal opens with all 5 plans
- [ ] Check current plan is highlighted correctly
- [ ] Verify free plan shows as current (EXPECTED ISSUE: May not detect correctly)
- [ ] Click upgrade button - should show "Stripe integration pending" message

### 6. Settings Page Integration
- [ ] Go to /settings?tab=subscription
- [ ] Verify subscription tab loads
- [ ] Click "Upgrade Plan" - modal should open
- [ ] Verify URL parameter `upgrade=true` works

## Known Issues to Fix

### Issue 1: No Free Subscription Record (CRITICAL)
**Problem**: Free users don't get a subscription record created on signup
**Impact**: Current plan detection fails, usage limits don't work correctly
**Fix Required**: Add database trigger to create free subscription on user signup
**Solution**: See `CRITICAL_FIXES.md` for exact SQL migration
**Test**: Create new user → verify subscription record exists

### Issue 2: Stripe Integration Missing (HIGH PRIORITY)
**Problem**: `/api/create-checkout` returns stub response
**Impact**: Users cannot actually upgrade their plans
**Fix Required**: Implement Stripe checkout session creation
**Solution**: See `CRITICAL_FIXES.md` for implementation
**Test**: Click upgrade → verify Stripe checkout redirect

### Issue 3: Webhook Handler Missing (PRODUCTION REQUIRED)
**Problem**: No webhook handling for Stripe subscription events
**Impact**: Subscriptions won't update when payments succeed/fail
**Fix Required**: Create `/api/stripe-webhook` endpoint
**Solution**: See `CRITICAL_FIXES.md` for webhook implementation
**Test**: Complete payment → verify subscription updated

### Issue 4: Onboarding Recommendations Count Toward Limits (UX)
**Problem**: First-time recommendations during onboarding count against usage limits
**Impact**: Poor user experience - users hit limits before using the app
**Fix Required**: Add `is_onboarding` flag to exclude onboarding usage
**Solution**: Update `checkUsageLimit` function with onboarding parameter
**Test**: Complete onboarding → verify recommendations don't count against limits

### Issue 5: Usage Tracking Period Logic (MINOR)
**Problem**: Period start/end calculation may not align with billing cycles
**Impact**: Usage may reset at wrong times
**Fix Required**: Align period calculation with subscription billing dates
**Solution**: Update period calculation in usage tracking functions
**Test**: Verify usage resets correctly on billing cycle dates

## Production Readiness Checklist

Before pushing to production:
- [ ] Fix free subscription creation on signup
- [ ] Add onboarding usage exclusion
- [ ] Implement Stripe integration in create-checkout.ts
- [ ] Add webhook handler for Stripe events
- [ ] Test subscription upgrades/downgrades
- [ ] Test subscription cancellation
- [ ] Add proper error handling and logging
- [ ] Test RLS policies for all subscription tables
- [ ] Performance test usage limit checks
- [ ] Add monitoring for failed payments

## Local Testing Commands

```bash
# Start local environment
cd /Users/davie/workspace/ablestate/idrobe
supabase start
cd web && npm run dev

# Check database
supabase db diff
supabase db reset

# View logs
supabase logs

# Stop when done
supabase stop
```

## Database Queries for Testing

```sql
-- Check subscription plans
SELECT * FROM subscription_plans ORDER BY price;

-- Check plan limits
SELECT sp.name, pl.limit_type, pl.limit_value 
FROM plan_limits pl
JOIN subscription_plans sp ON sp.id = pl.plan_id
ORDER BY sp.price, pl.limit_type;

-- Check user subscriptions
SELECT u.email, s.status, sp.name 
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
JOIN subscription_plans sp ON sp.id = s.plan_id;

-- Check usage tracking
SELECT u.email, ut.usage_type, ut.usage_count, ut.period_start
FROM usage_tracking ut
JOIN auth.users u ON u.id = ut.user_id
ORDER BY ut.created_at DESC;

-- Get free plan ID
SELECT id, name FROM subscription_plans WHERE price = 0;
```
