# iDrobe - AI-Powered Wardrobe Management

<div align=\"center\">
  <h3>Transform your wardrobe with AI-powered insights and recommendations</h3>
  <p>Upload your clothes, get personalized outfit suggestions, and manage your wardrobe digitally</p>
</div>

## 🌟 Features

- **AI Clothing Analysis** - Automatic categorization and tagging using Google Gemini
- **Smart Recommendations** - Weather-aware outfit suggestions based on occasion and mood
- **Wardrobe Analytics** - Insights into your clothing usage and style preferences
- **Subscription System** - Freemium model with usage-based limits
- **Multi-Currency Support** - Global accessibility with local currency support
- **Social Sharing** - Share your favorite outfits with friends (coming soon)

## 🚀 Quick Start

### Prerequisites
- Node.js >= 22.12.0
- npm >= 10.0.0
- Docker (for local Supabase)
- Git

### Automated Setup
```bash
# Clone the repository
git clone https://github.com/ANYURU/idrobe.git
cd idrobe

# Run the setup script
./setup.sh

# Start development
npm run dev
```

### Manual Setup
```bash
# Install dependencies
npm install

# Copy environment files
cp .env.example .env
cp web/.env.example web/.env

# Edit .env files with your API keys

# Start Supabase
npm run db:start

# Apply migrations
npm run db:reset

# Start development server
npm run dev
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19 + React Router v7 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Google Gemini API
- **Payments**: Stripe
- **Deployment**: Vercel + Supabase Cloud

### Project Structure
```
idrobe/
├── web/                    # React frontend application
│   ├── app/
│   │   ├── components/     # Reusable UI components
│   │   ├── routes/         # Page components and API routes
│   │   ├── lib/           # Utilities and configurations
│   │   └── hooks/         # Custom React hooks
├── shared/                # Shared TypeScript types
├── supabase/             # Database migrations and functions
│   ├── migrations/       # Database schema changes
│   ├── functions/        # Edge functions
│   └── config.toml      # Supabase configuration
├── scripts/              # Build and utility scripts
└── docs/                # Documentation files
```

## 🔧 Development

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

### Environment Variables
Create `.env` file in the root directory:
```bash
# AI Services
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_weather_api_key

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (for subscriptions)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Development
USE_MOCK_RECOMMENDATIONS=true
SITE_URL=http://localhost:5173
```

## 💳 Subscription System

### Plans
- **Free**: 10 uploads/month, 3 recommendations/week, 1GB storage
- **Premium**: Unlimited uploads & recommendations, 10GB storage ($4.99/month)
- **Pro**: Everything in Premium + social features, 50GB storage ($9.99/month)

### Implementation Status
- ✅ Database schema and migrations
- ✅ Usage limit enforcement
- ✅ Upgrade UI components
- ❌ Stripe integration (in progress)
- ❌ Webhook handling (pending)

## 🗄️ Database

### Key Tables
- `user_profiles` - User accounts and preferences
- `clothing_items` - Wardrobe inventory with AI analysis
- `outfit_recommendations` - AI-generated suggestions
- `subscription_plans` - Available subscription tiers
- `subscriptions` - User subscription records
- `usage_tracking` - Monthly usage limits

### Features
- **Vector embeddings** for AI similarity search
- **Row Level Security** for data isolation
- **Partitioned tables** for scalability
- **Soft deletes** for data recovery

## 🔐 Authentication & Security

- **Supabase Auth** - Email/password authentication
- **JWT Tokens** - Secure session management
- **Row Level Security** - Database-level access control
- **Input Validation** - Zod schemas for type safety
- **File Upload Security** - Type and size validation

## 🚀 Deployment

### Production Environment
- **Frontend**: Vercel
- **Backend**: Supabase Cloud
- **Storage**: Supabase Storage
- **Payments**: Stripe

### Environment Setup
1. Create Supabase project
2. Deploy database migrations
3. Configure Vercel deployment
4. Set up Stripe webhooks
5. Configure environment variables

## 📚 Documentation

### Complete Handoff Guide
- **[PROJECT_HANDOFF.md](./PROJECT_HANDOFF.md)** - Complete system handoff documentation (START HERE)

### Additional References
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Detailed database documentation
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Feature implementation status

### API Documentation
- **Authentication**: Supabase Auth API
- **Database**: Supabase REST API with RLS
- **Storage**: Supabase Storage API
- **AI**: Google Gemini API integration

## 🧪 Testing

### Test Types
- **Unit Tests** - Component and utility tests
- **Integration Tests** - API and database tests
- **E2E Tests** - Full user workflow tests

### Running Tests
```bash
npm test              # Run all tests
npm run test:ui       # Run tests with UI
npm run test:watch    # Watch mode for development
```

## 🐛 Known Issues

### Critical (Must Fix)
1. **Free subscription creation** - Users don't get free subscriptions on signup
2. **Stripe integration** - Payment processing not implemented
3. **Webhook handling** - Subscription updates not processed

### Medium Priority
1. **Onboarding usage exclusion** - First recommendations count against limits
2. **Error handling** - Improve user-facing error messages
3. **Mobile responsiveness** - Some components need optimization

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use conventional commits
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check the docs/ directory
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions

### Emergency Contacts
- **Repository**: https://github.com/ANYURU/idrobe
- **Current Branch**: `feature/subscription-system-wip`
- **Supabase**: https://supabase.com/dashboard
- **Vercel**: https://vercel.com/dashboard

## 🎯 Roadmap

### Short Term (1-2 months)
- [ ] Complete Stripe integration
- [ ] Fix critical subscription issues
- [ ] Launch production version
- [ ] Mobile app development

### Long Term (3-6 months)
- [ ] Advanced AI recommendations
- [ ] Social sharing features
- [ ] Sustainability tracking
- [ ] API for third-party integrations

---

<div align=\"center\">
  <p>Built with ❤️ by the iDrobe team</p>
  <p>
    <a href=\"https://github.com/ANYURU/idrobe\">GitHub</a> •
    <a href=\"#\">Documentation</a> •
    <a href=\"#\">Support</a>
  </p>
</div>