# Complete System Handoff: iDrobe Project

## 🎯 Project Overview

**iDrobe** is an AI-powered wardrobe management application with a freemium subscription model. Users can upload clothing items, get AI-powered outfit recommendations, and manage their wardrobe digitally.

### Key Features
- AI-powered clothing analysis and categorization
- Outfit recommendations based on weather, occasion, and mood
- Wardrobe analytics and insights
- Subscription-based usage limits
- Multi-currency support
- Social sharing capabilities

## 🏗️ System Architecture

### Tech Stack
- **Frontend**: React 19 + React Router v7 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI**: Google Gemini API for clothing analysis and recommendations
- **Payments**: Stripe (integration 80% complete)
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **Storage**: Supabase Storage for clothing images

### Project Structure
```
idrobe/
├── web/                          # React frontend application
├── shared/                       # Shared TypeScript types
├── supabase/                     # Database migrations, functions, config
├── scripts/                      # Build and utility scripts
├── .env                         # Environment variables (DO NOT COMMIT)
├── package.json                 # Root workspace configuration
└── Documentation files
```

## 🔧 Development Environment Setup

### Prerequisites
- Node.js >= 22.12.0
- npm >= 10.0.0
- Docker (for Supabase local development)
- Git

### Initial Setup
```bash
# 1. Clone repository
git clone https://github.com/ANYURU/idrobe.git
cd idrobe

# 2. Switch to main development branch
git checkout feature/subscription-system-wip

# 3. Install dependencies
npm install

# 4. Copy environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section)

# 5. Start Supabase locally
npm run db:start

# 6. Apply database migrations
npx supabase db reset

# 7. Start development server
npm run dev
```

### Environment Variables

#### Root .env file
```bash
# AI Services
GEMINI_API_KEY=
OPENWEATHER_API_KEY=

# Supabase Configuration
VITE_SUPABASE_URL=https://htcoujknjrlvksrnzvzg.supabase.co
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=https://htcoujknjrlvksrnzvzg.supabase.co
SUPABASE_ANON_KEY=

# Development Settings
USE_MOCK_RECOMMENDATIONS=true

# Stripe (for production)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=http://localhost:5173
```

#### web/.env (if needed)
```bash
# Additional web-specific environment variables
GEMINI_API_KEY=your_gemini_api_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## 📊 Database Schema

### Core Tables
- **user_profiles** - User account information and preferences
- **clothing_items** - Wardrobe inventory with AI analysis
- **clothing_categories/subcategories** - Dynamic category system
- **style_tags** - Reusable style tags for items
- **outfit_recommendations** - AI-generated outfit suggestions
- **outfit_collections** - User-curated outfit combinations
- **subscription_plans** - Available subscription tiers
- **subscriptions** - User subscription records
- **usage_tracking** - Monthly usage limits tracking
- **payments** - Payment transaction records

### Key Features
- **Partitioned tables** for scalability (clothing_items, outfit_recommendations)
- **Vector embeddings** for AI similarity search (768 dimensions)
- **Row Level Security (RLS)** for data isolation
- **Soft deletes** for data recovery
- **Multi-currency support**
- **Usage tracking with monthly reset**

### Migration Files
```
supabase/migrations/
├── 20251020142338_initial-schema.sql        # Core schema
├── 20251021093944_dynamic_categories.sql    # Category system
├── 20251028093000_add_subscription_system.sql # Subscription tables
├── 20251028093001_seed_subscription_plans.sql # Plan data
├── 20251203000000_add_usage_tracking_functions.sql # Usage functions
└── [Additional migrations...]
```

## 🎨 Frontend Architecture

### React Router v7 Structure
```
web/app/
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── PlanComparisonDialog.tsx # Subscription upgrade modal
│   ├── app-sidebar.tsx          # Main navigation
│   └── [Other components...]
├── hooks/
│   ├── use-usage-limits.ts      # Subscription usage management
│   └── [Other hooks...]
├── lib/
│   ├── supabase.ts             # Supabase client configuration
│   ├── auth.ts                 # Authentication utilities
│   ├── usage-limits.ts         # Server-side usage validation
│   └── [Other utilities...]
├── routes/
│   ├── auth/                   # Authentication pages
│   ├── onboarding/            # User onboarding flow
│   ├── wardrobe/              # Wardrobe management
│   ├── outfits/               # Outfit recommendations
│   ├── api/                   # API endpoints
│   ├── settings.tsx           # User settings and subscription
│   └── [Other routes...]
└── root.tsx                   # App root component
```

### Key Components

#### Subscription System
- **PlanComparisonDialog** - Upgrade modal with all subscription plans
- **use-usage-limits** - Hook for client-side usage management
- **usage-limits.ts** - Server-side usage validation logic

#### Core Features
- **Wardrobe Management** - Upload, categorize, and manage clothing items
- **AI Recommendations** - Generate outfit suggestions based on context
- **Analytics Dashboard** - Wardrobe insights and statistics
- **User Settings** - Profile management and subscription controls

## 🔌 API Integration

### Supabase APIs
- **Authentication** - User signup, login, password reset
- **Database** - CRUD operations with RLS
- **Storage** - Image upload and management
- **Edge Functions** - Server-side processing

### External APIs
- **Google Gemini** - AI clothing analysis and recommendations
- **OpenWeather** - Weather data for outfit suggestions
- **Stripe** - Payment processing (integration pending)

### Custom API Endpoints
```
/api/check-usage          # Usage limit validation
/api/create-checkout      # Stripe checkout creation (stub)
/api/stripe-webhook       # Stripe webhook handler (needs implementation)
```

## 🔐 Authentication & Security

### Authentication Flow
1. **Supabase Auth** - Email/password authentication
2. **JWT Tokens** - Secure session management
3. **Row Level Security** - Database-level access control
4. **Protected Routes** - Client-side route guards

### Security Features
- **RLS Policies** - Users can only access their own data
- **Input Validation** - Zod schemas for form validation
- **File Upload Security** - Type and size validation
- **API Rate Limiting** - Supabase built-in rate limits

## 💳 Subscription System (80% Complete)

### Subscription Plans
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

### Implementation Status
✅ **Completed**:
- Database schema and migrations
- Usage limit checking and enforcement
- Upgrade modal UI
- Settings page integration
- API endpoints for usage validation

❌ **Pending**:
- Free subscription auto-creation on signup
- Stripe checkout integration
- Webhook handling for payment events
- Onboarding usage exclusion

## 🚀 Deployment

### Current Deployment
- **Frontend**: Vercel (connected to GitHub)
- **Backend**: Supabase Cloud
- **Domain**: [To be configured]

### Production Environment Variables
```bash
# Supabase Production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
GEMINI_API_KEY=your-production-gemini-key
OPENWEATHER_API_KEY=your-production-weather-key

# Stripe Production
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=https://yourdomain.com
```

### Deployment Commands
```bash
# Build and deploy frontend
npm run build
vercel deploy --prod

# Deploy database changes
npx supabase db push --linked

# Deploy edge functions
npx supabase functions deploy
```

## 🔄 Git Workflow & Branching

### Branch Structure
- **main** - Production-ready code
- **develop** - Integration branch for features
- **feature/subscription-system-wip** - Current active branch with subscription system
- **feature/[feature-name]** - Individual feature branches
- **hotfix/[issue]** - Critical production fixes

### Current Active Branch
```bash
# Main development is happening on:
git checkout feature/subscription-system-wip

# This branch contains:
# - Complete subscription system implementation
# - All database migrations
# - Frontend components and integration
# - API endpoints (some incomplete)
```

### Commit Guidelines
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Include issue numbers when applicable
- Keep commits atomic and focused

## 🧪 Testing Strategy

### Test Types
- **Unit Tests** - Component and utility function tests
- **Integration Tests** - API endpoint and database tests
- **E2E Tests** - Full user workflow tests
- **Manual Testing** - Subscription flow and UI testing

### Testing Commands
```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Critical Test Cases
1. **User Registration** - Verify free subscription creation
2. **Upload Limits** - Test usage limit enforcement
3. **Recommendation Limits** - Test AI recommendation limits
4. **Subscription Upgrade** - Test Stripe integration (when complete)
5. **Payment Webhooks** - Test subscription updates

## 🐛 Known Issues & Priorities

### Critical Issues (Must Fix Before Production)
1. **Free Subscription Creation** - Users don't get free subscriptions on signup
2. **Stripe Integration** - Checkout flow not implemented
3. **Webhook Handling** - Payment events not processed
4. **Usage Limit Edge Cases** - Some scenarios not handled

### Medium Priority
1. **Onboarding Usage Exclusion** - First recommendations count against limits
2. **Error Handling** - Improve user-facing error messages
3. **Performance** - Optimize large wardrobe loading
4. **Mobile Responsiveness** - Some components need mobile optimization

### Low Priority
1. **Analytics Dashboard** - Add more detailed insights
2. **Social Features** - Implement sharing capabilities
3. **Notifications** - Email/push notification system
4. **Accessibility** - WCAG compliance improvements

## 📚 Documentation Files

### Available Documentation
- **RESUME_WORK.md** - Subscription system continuation guide
- **DEVELOPER_HANDOFF.md** - Detailed technical handoff
- **CRITICAL_FIXES.md** - Quick reference for urgent fixes
- **SUBSCRIPTION_TESTING_PLAN.md** - Testing procedures
- **DATABASE_SCHEMA.md** - Complete database documentation
- **IMPLEMENTATION_CHECKLIST.md** - Feature implementation status
- **FRONTEND_GUIDE.md** - Frontend development guide
- **REACT_ROUTER_V7_GUIDE.md** - React Router v7 patterns

### Code Documentation
- **JSDoc comments** on all major functions
- **TypeScript interfaces** for all data structures
- **Inline comments** for complex business logic
- **README files** in major directories

## 🛠️ Development Tools & Scripts

### Available Scripts
```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Database
npm run db:start        # Start Supabase locally
npm run db:stop         # Stop Supabase
npm run db:reset        # Reset local database

# Code Quality
npm run lint            # Run ESLint
npm run typecheck       # TypeScript type checking
npm test               # Run tests
```

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript** - Type safety and IntelliSense
- **Prettier** - Code formatting (via ESLint)
- **Supabase CLI** - Database management
- **React DevTools** - Component debugging
- **Vercel CLI** - Deployment management

## 🔍 Debugging & Troubleshooting

### Common Issues

#### "No subscription found" Error
```sql
-- Check if user has subscription
SELECT s.*, sp.name FROM subscriptions s 
JOIN subscription_plans sp ON s.plan_id = sp.id 
WHERE s.user_id = 'USER_ID';

-- If no subscription, create one manually
INSERT INTO subscriptions (user_id, plan_id, status)
SELECT 'USER_ID', id, 'active' 
FROM subscription_plans WHERE price = 0;
```

#### Usage Limits Not Working
```sql
-- Check usage tracking
SELECT * FROM usage_tracking 
WHERE user_id = 'USER_ID' 
ORDER BY created_at DESC;

-- Reset usage for testing
DELETE FROM usage_tracking WHERE user_id = 'USER_ID';
```

#### Database Connection Issues
```bash
# Check Supabase status
npx supabase status

# Restart Supabase
npm run db:stop
npm run db:start
```

### Logging & Monitoring
- **Browser Console** - Client-side errors and logs
- **Supabase Logs** - Database and API logs
- **Vercel Logs** - Deployment and runtime logs
- **Custom Logging** - Application-specific logs

## 📞 Support & Resources

### External Resources
- **Supabase Docs**: https://supabase.com/docs
- **React Router v7**: https://reactrouter.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Stripe API**: https://stripe.com/docs
- **Google Gemini**: https://ai.google.dev/

### Project Resources
- **Repository**: https://github.com/ANYURU/idrobe
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com

### Emergency Contacts
- **Repository Owner**: ANYURU
- **Current Branch**: feature/subscription-system-wip
- **Last Updated**: January 2025

## 🎯 Next Steps for New Developer

### Immediate Actions (First Week)
1. **Set up development environment** following setup guide
2. **Review all documentation** to understand system architecture
3. **Run local tests** to verify everything works
4. **Fix critical subscription issues** (see CRITICAL_FIXES.md)
5. **Test subscription flow** end-to-end

### Short Term (2-4 Weeks)
1. **Complete Stripe integration** for payment processing
2. **Implement webhook handling** for subscription updates
3. **Add comprehensive error handling** throughout the system
4. **Optimize performance** for large datasets
5. **Improve mobile responsiveness**

### Long Term (1-3 Months)
1. **Launch production version** with full subscription system
2. **Add advanced analytics** and reporting features
3. **Implement social sharing** capabilities
4. **Add notification system** for user engagement
5. **Scale infrastructure** based on user growth

## 📋 Success Criteria

### System is Production-Ready When:
- ✅ All users get free subscriptions automatically on signup
- ✅ Usage limits work correctly for all plan types
- ✅ Stripe integration processes payments successfully
- ✅ Webhook handling updates subscriptions properly
- ✅ All critical user flows work without errors
- ✅ Performance is acceptable under normal load
- ✅ Security measures are properly implemented
- ✅ Documentation is complete and up-to-date

### Key Metrics to Monitor:
- **User Registration Rate** - New signups per day/week
- **Subscription Conversion** - Free to paid upgrade rate
- **Usage Patterns** - How users interact with limits
- **Error Rates** - System reliability metrics
- **Performance** - Page load times and API response times

---

**This document serves as the complete handoff guide for the iDrobe project. All critical information, code, and procedures are documented to ensure seamless continuation of development work.**