# iDrobe Project Handoff Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Quick Start Setup](#quick-start-setup)
3. [System Architecture](#system-architecture)
4. [Development Environment](#development-environment)
5. [Database & Backend](#database--backend)
6. [Frontend Application](#frontend-application)
7. [Subscription System](#subscription-system)
8. [Critical Issues & Fixes](#critical-issues--fixes)
9. [Testing & Quality Assurance](#testing--quality-assurance)
10. [Deployment & Production](#deployment--production)
11. [Maintenance & Support](#maintenance--support)

---

## 1. Project Overview

**iDrobe** is an AI-powered wardrobe management application with a freemium subscription model. Users upload clothing items, receive AI-powered outfit recommendations, and manage their wardrobe digitally.

### Key Features
- AI clothing analysis using Google Gemini
- Weather-aware outfit recommendations
- Subscription-based usage limits (Free/Premium/Pro)
- Multi-currency support
- Wardrobe analytics and insights

### Current Status
- **Completion**: ~80% complete
- **Active Branch**: `feature/subscription-system-wip`
- **Critical Issues**: 4 subscription-related fixes needed
- **Production Ready**: After fixing critical issues

### Tech Stack
- **Frontend**: React 19 + React Router v7 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI**: Google Gemini API
- **Payments**: Stripe (integration 80% complete)
- **Deployment**: Vercel + Supabase Cloud

---

## 2. Quick Start Setup

### Prerequisites
- Node.js >= 22.12.0
- npm >= 10.0.0
- Docker (for Supabase local development)
- Git

### Automated Setup (Recommended)
```bash
# 1. Clone and setup
git clone https://github.com/ANYURU/idrobe.git
cd idrobe
git checkout feature/subscription-system-wip

# 2. Run setup script
./setup.sh

# 3. Configure environment variables
# Edit .env with your API keys (see Environment Variables section)

# 4. Start development
npm run dev
```

### Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup environment files
cp .env.example .env
cp web/.env.example web/.env

# 3. Start Supabase locally
npm run db:start

# 4. Apply database migrations
npm run db:reset

# 5. Start development server
npm run dev
```

### Environment Variables
Create `.env` file with these variables:
```bash
# AI Services (Required)
GEMINI_API_KEY=your_gemini_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Supabase (Required)
VITE_SUPABASE_URL=https://htcoujknjrlvksrnzvzg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://htcoujknjrlvksrnzvzg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Development Settings
USE_MOCK_RECOMMENDATIONS=true
SITE_URL=http://localhost:5173

# Stripe (For subscription testing)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### Verification
After setup, verify everything works:
```bash
# Check Supabase is running
npx supabase status

# Check application loads
curl http://localhost:5173

# Check database connection
npx supabase db shell
```

---

## 3. System Architecture

### Project Structure
```
idrobe/
├── web/                          # React frontend application
│   ├── app/
│   │   ├── components/           # UI components
│   │   ├── routes/              # Pages and API routes
│   │   ├── lib/                 # Utilities and configurations
│   │   └── hooks/               # Custom React hooks
├── shared/                       # Shared TypeScript types
├── supabase/                     # Database and backend
│   ├── migrations/              # Database schema changes
│   ├── functions/               # Edge functions
│   └── config.toml             # Supabase configuration
├── scripts/                      # Build and utility scripts
└── [Documentation files]
```

### Data Flow
1. **User uploads clothing** → AI analysis via Gemini → Stored in Supabase
2. **User requests recommendations** → AI generates outfits → Usage tracked
3. **User hits limits** → Upgrade modal → Stripe checkout → Subscription updated
4. **User manages wardrobe** → CRUD operations → Real-time updates

### Key Integrations
- **Supabase**: Database, auth, storage, real-time subscriptions
- **Google Gemini**: AI clothing analysis and outfit recommendations
- **OpenWeather**: Weather data for outfit suggestions
- **Stripe**: Payment processing and subscription management
- **Vercel**: Frontend hosting and serverless functions

---

## 4. Development Environment

### Available Scripts
```bash
# Development
npm run dev              # Start development server (http://localhost:5173)
npm run build           # Build for production
npm run preview         # Preview production build

# Database Management
npm run db:start        # Start Supabase locally
npm run db:stop         # Stop Supabase
npm run db:reset        # Reset database with fresh migrations

# Code Quality
npm run lint            # Run ESLint
npm run typecheck       # TypeScript type checking
npm test               # Run tests
npm run test:ui         # Run tests with UI
```

### Development URLs
- **Frontend**: http://localhost:5173
- **Supabase Studio**: http://localhost:54323
- **Supabase API**: http://localhost:54321
- **Email Testing**: http://localhost:54324

### IDE Setup
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and TypeScript
- **Prettier**: Integrated via ESLint
- **Path Mapping**: `@/` points to `web/app/`

### Git Workflow
- **Main Branch**: `main` (production-ready)
- **Development Branch**: `feature/subscription-system-wip` (current work)
- **Feature Branches**: `feature/[feature-name]`
- **Hotfixes**: `hotfix/[issue]`

---

## 5. Database & Backend

### Database Schema Overview
The database uses PostgreSQL with advanced features:
- **50+ tables** for comprehensive wardrobe management
- **Vector embeddings** for AI similarity search (768 dimensions)
- **Partitioned tables** for scalability
- **Row Level Security (RLS)** for data isolation
- **Soft deletes** for data recovery

### Core Tables
```sql
-- User Management
user_profiles              # User accounts and preferences
subscriptions             # User subscription records
usage_tracking           # Monthly usage limits tracking

-- Wardrobe Management
clothing_items           # Wardrobe inventory (partitioned by user_id)
clothing_categories      # Dynamic category system
clothing_subcategories   # Subcategories within categories
style_tags              # Reusable style tags
clothing_item_style_tags # Many-to-many relationship

-- AI & Recommendations
outfit_recommendations   # AI-generated suggestions (partitioned)
outfit_collections      # User-curated combinations
user_interactions       # Feedback for ML training

-- Subscription System
subscription_plans       # Available tiers (Free/Premium/Pro)
plan_limits             # Feature limits per plan
payments                # Payment transaction records
```

### Key Migration Files
```
supabase/migrations/
├── 20251020142338_initial-schema.sql        # Core schema
├── 20251021093944_dynamic_categories.sql    # Category system
├── 20251028093000_add_subscription_system.sql # Subscription tables
├── 20251028093001_seed_subscription_plans.sql # Plan data
└── 20251203000000_add_usage_tracking_functions.sql # Usage functions
```

### Supabase Configuration
- **Database**: PostgreSQL 17 with extensions (pgvector, fuzzystrmatch)
- **Authentication**: Email/password with JWT tokens
- **Storage**: File uploads with security policies
- **Edge Functions**: Server-side processing
- **Real-time**: Live data synchronization

### Security Features
- **RLS Policies**: Users can only access their own data
- **JWT Authentication**: Secure session management
- **Input Validation**: Zod schemas throughout
- **File Upload Security**: Type and size validation

---

## 6. Frontend Application

### React Router v7 Architecture
The frontend uses React Router v7 with:
- **File-based routing** in `app/routes/`
- **Loaders** for data fetching
- **Actions** for form submissions
- **Suspense** for progressive loading
- **SSR support** for better performance

### Key Routes Structure
```
app/routes/
├── auth/                 # Authentication pages
│   ├── login.tsx
│   ├── signup.tsx
│   └── reset-password.tsx
├── onboarding/          # User onboarding flow
│   ├── welcome.tsx
│   ├── upload.tsx
│   └── preferences.tsx
├── wardrobe/            # Wardrobe management
│   ├── _index.tsx       # Wardrobe list
│   ├── add.tsx          # Upload items
│   └── $itemId.tsx      # Item details
├── outfits/             # Outfit recommendations
│   ├── _index.tsx       # Recommendations list
│   └── create.tsx       # Create collections
├── api/                 # API endpoints
│   ├── check-usage.ts   # Usage validation
│   └── create-checkout.ts # Stripe checkout
└── settings.tsx         # User settings
```

### Component Architecture
```
app/components/
├── ui/                  # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── [other ui components]
├── PlanComparisonDialog.tsx # Subscription upgrade modal
├── app-sidebar.tsx      # Main navigation
├── OutfitPreview.tsx    # Outfit display component
└── [Feature components]
```

### State Management
- **React Router**: URL state and navigation
- **React Hooks**: Local component state
- **Supabase**: Server state and real-time updates
- **Context**: Theme and user preferences

### Styling
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Accessible component library
- **CSS Variables**: Theme customization
- **Responsive Design**: Mobile-first approach

---

## 7. Subscription System

### Subscription Plans
```
Free Plan (Default):
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
- Social sharing features
- API access
```

### Implementation Status
✅ **Completed (80%)**:
- Database schema with all subscription tables
- Usage limit checking and enforcement
- Upgrade modal UI (PlanComparisonDialog)
- Settings page integration
- API endpoints for usage validation
- Monthly usage tracking with reset

❌ **Pending (20%)**:
- Free subscription auto-creation on signup
- Stripe checkout integration
- Webhook handling for payment events
- Onboarding usage exclusion

### Usage Limit Flow
1. **User performs action** (upload, recommendation request)
2. **System checks current usage** against plan limits
3. **If limit exceeded** → Show upgrade modal
4. **If within limits** → Allow action and increment usage
5. **Usage resets monthly** on the 1st of each month

### Key Files
```
# Frontend Components
web/app/components/PlanComparisonDialog.tsx  # Upgrade modal
web/app/hooks/use-usage-limits.ts           # Usage management hook

# Backend Logic
web/app/lib/usage-limits.ts                 # Server-side validation
web/app/routes/api/check-usage.ts           # Usage API endpoint
web/app/routes/api/create-checkout.ts       # Stripe integration (stub)

# Database
supabase/migrations/20251028093000_add_subscription_system.sql
supabase/migrations/20251028093001_seed_subscription_plans.sql
```

---

## 8. Critical Issues & Fixes

### Issue 1: Free Subscription Creation (CRITICAL)
**Problem**: New users don't get free subscription records created automatically
**Impact**: Usage limits don't work, plan detection fails
**Priority**: CRITICAL - Must fix first

**Solution**: Create database trigger
```sql
-- Create migration: supabase/migrations/20251225000001_fix_free_subscription_creation.sql
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

### Issue 2: Stripe Integration (HIGH PRIORITY)
**Problem**: `/api/create-checkout` returns stub response
**Impact**: Users cannot upgrade plans
**Priority**: HIGH - Required for revenue

**Solution**: Implement Stripe checkout in `web/app/routes/api/create-checkout.ts`
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

### Issue 3: Webhook Handler (PRODUCTION REQUIRED)
**Problem**: No webhook handling for Stripe subscription events
**Impact**: Subscriptions won't update when payments succeed/fail
**Priority**: PRODUCTION REQUIRED

**Solution**: Create `web/app/routes/api/stripe-webhook.ts`
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

### Issue 4: Onboarding Usage Exclusion (UX IMPROVEMENT)
**Problem**: First-time recommendations during onboarding count against usage limits
**Impact**: Poor user experience
**Priority**: MEDIUM - UX improvement

**Solution**: Add onboarding parameter to usage checking
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
```

---

## 9. Testing & Quality Assurance

### Testing Strategy
1. **Unit Tests** - Component and utility function tests
2. **Integration Tests** - API endpoint and database tests
3. **E2E Tests** - Full user workflow tests
4. **Manual Testing** - Subscription flow and UI testing

### Critical Test Cases
```bash
# 1. Free Subscription Creation
# - Create new user account
# - Verify subscription record exists
# - Check plan_id points to free plan

# 2. Usage Limits
# - Upload 10 files (should work)
# - Try 11th upload (should show upgrade modal)
# - Generate 3 recommendations (should work)
# - Try 4th recommendation (should show upgrade modal)

# 3. Stripe Integration (after implementation)
# - Click "Upgrade Plan" button
# - Select Premium plan
# - Complete test payment
# - Verify subscription updated

# 4. Settings Integration
# - Go to /settings?tab=subscription
# - Verify current plan displayed
# - Test upgrade modal
```

### Testing Commands
```bash
npm test              # Run all tests
npm run test:ui       # Run tests with UI
npm run typecheck     # TypeScript validation
npm run lint          # Code quality check
```

### Debugging Queries
```sql
-- Check user subscription
SELECT s.*, sp.name FROM subscriptions s 
JOIN subscription_plans sp ON s.plan_id = sp.id 
WHERE s.user_id = 'USER_ID';

-- Check usage tracking
SELECT * FROM usage_tracking 
WHERE user_id = 'USER_ID' 
ORDER BY created_at DESC;

-- Get free plan ID
SELECT id FROM subscription_plans WHERE price = 0;
```

---

## 10. Deployment & Production

### Production Environment
- **Frontend**: Vercel (connected to GitHub)
- **Backend**: Supabase Cloud
- **Database**: PostgreSQL with extensions
- **Storage**: Supabase Storage
- **Payments**: Stripe

### Environment Variables (Production)
```bash
# Supabase Production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
GEMINI_API_KEY=your_production_gemini_key
OPENWEATHER_API_KEY=your_production_weather_key

# Stripe Production
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=https://yourdomain.com
```

### Deployment Steps
```bash
# 1. Deploy database changes
npx supabase db push --linked

# 2. Deploy edge functions
npx supabase functions deploy

# 3. Build and deploy frontend
npm run build
vercel deploy --prod

# 4. Configure Stripe webhook
# URL: https://yourdomain.com/api/stripe-webhook
# Events: checkout.session.completed, customer.subscription.updated
```

### Production Checklist
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Stripe webhook configured
- [ ] SSL certificates valid
- [ ] Error monitoring setup (Sentry recommended)
- [ ] Performance monitoring enabled
- [ ] Backup strategy implemented

---

## 11. Maintenance & Support

### Monitoring
- **Error Tracking**: Set up Sentry for error monitoring
- **Performance**: Monitor Core Web Vitals
- **Usage Analytics**: Track subscription conversion rates
- **Database**: Monitor query performance and storage usage

### Common Issues & Solutions

#### "No subscription found" Error
```sql
-- Check if user has subscription
SELECT * FROM subscriptions WHERE user_id = 'USER_ID';
-- If missing, apply Fix #1 (free subscription creation)
```

#### Usage Limits Not Working
```sql
-- Check usage tracking table
SELECT * FROM usage_tracking WHERE user_id = 'USER_ID';
-- Verify period dates are correct
```

#### Stripe Integration Issues
```bash
# Check environment variables
echo $STRIPE_SECRET_KEY
# Verify webhook endpoint in Stripe dashboard
# Check webhook delivery logs
```

### Support Resources
- **Repository**: https://github.com/ANYURU/idrobe
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com

### Emergency Procedures
1. **Database Issues**: Use Supabase dashboard for immediate fixes
2. **Payment Issues**: Check Stripe dashboard and webhook logs
3. **Frontend Issues**: Rollback via Vercel dashboard
4. **Critical Bugs**: Create hotfix branch and deploy immediately

---

## 🎯 Next Steps for New Developer

### Week 1: Setup & Understanding
1. Complete development environment setup
2. Review this documentation thoroughly
3. Run local tests to verify everything works
4. Explore the codebase and understand architecture

### Week 2: Critical Fixes
1. Fix free subscription creation (Issue #1)
2. Implement Stripe checkout integration (Issue #2)
3. Add webhook handling (Issue #3)
4. Test subscription flow end-to-end

### Week 3-4: Polish & Launch
1. Add onboarding usage exclusion (Issue #4)
2. Improve error handling and user feedback
3. Optimize performance and mobile responsiveness
4. Prepare for production deployment

### Success Criteria
✅ **System is production-ready when**:
- New users get free subscriptions automatically
- Usage limits work correctly for all plan types
- Stripe integration processes payments successfully
- Webhook handling updates subscriptions properly
- All critical user flows work without errors

**Estimated completion time**: 2-4 weeks for experienced React/TypeScript developer

---

*This documentation serves as the complete handoff guide for the iDrobe project. All critical information, code, and procedures are documented to ensure seamless continuation of development work.*