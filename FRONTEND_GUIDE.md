# iDrobe Frontend - Complete Implementation Guide

## Overview

iDrobe is an **AI-powered personal styling assistant** that helps users manage their wardrobe, get outfit recommendations, and stay on top of fashion trends. The frontend is built with **React 19**, **React Router v7**, **Supabase**, **Formik**, **Zod**, and **shadcn/ui**.

## Application Architecture

### Core Features

1. **Authentication** - Sign up, login, password reset
2. **Onboarding** - Welcome, image upload, preferences setup
3. **Wardrobe Management** - Add, view, edit, delete clothing items
4. **Outfit Creation** - Create and manage outfit collections
5. **Recommendations** - AI-powered outfit suggestions
6. **Analytics** - Wardrobe statistics and insights
7. **Trends** - Fashion trends by season and region
8. **Profile** - User preferences and settings

### Database Schema Understanding

The application uses Supabase with the following key tables:

- **user_profiles** - User preferences, body type, activity level
- **clothing_items** - Wardrobe inventory with AI analysis
- **outfit_recommendations** - AI-generated outfit suggestions
- **outfit_collections** - User-curated outfit combinations
- **user_interactions** - Feedback on recommendations
- **wardrobe_gaps** - Identified missing items
- **seasonal_trends** - Global fashion trends
- **clothing_duplicates** - Duplicate detection

## Project Structure

```
web/
├── app/
│   ├── components/
│   │   └── ui/                    # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── tabs.tsx
│   │       └── alert.tsx
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client & types
│   │   ├── auth.ts               # Authentication functions
│   │   └── hooks.ts              # Custom React hooks
│   ├── routes/
│   │   ├── auth/                 # Authentication pages
│   │   │   ├── login.tsx
│   │   │   ├── signup.tsx
│   │   │   ├── forgot-password.tsx
│   │   │   └── reset-password.tsx
│   │   ├── onboarding/           # Onboarding flow
│   │   │   ├── welcome.tsx
│   │   │   ├── upload.tsx
│   │   │   ├── preferences.tsx
│   │   │   └── complete.tsx
│   │   ├── wardrobe/             # Wardrobe management
│   │   │   ├── _index.tsx
│   │   │   ├── add.tsx
│   │   │   └── $itemId.tsx
│   │   ├── outfits/              # Outfit management
│   │   │   ├── _index.tsx
│   │   │   ├── create.tsx
│   │   │   └── $outfitId.tsx
│   │   ├── analytics.tsx         # Analytics dashboard
│   │   ├── trends.tsx            # Fashion trends
│   │   ├── profile.tsx           # User profile
│   │   ├── categories/           # Category overview
│   │   ├── tags/                 # Style tags
│   │   ├── _layout.tsx           # Main layout
│   │   └── _index.tsx            # Dashboard
│   ├── routes.ts                 # Route configuration
│   ├── root.tsx                  # Root layout
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── .env.example                  # Environment variables template
└── package.json
```

## Setup Instructions

### 1. Environment Setup

Create a `.env.local` file in the `web/` directory:

```bash
cp web/.env.example web/.env.local
```

Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Install Dependencies

```bash
cd web
npm install
```

### 3. Install Missing Radix UI Dependencies

The UI components use Radix UI primitives. Install them:

```bash
npm install @radix-ui/react-label @radix-ui/react-select @radix-ui/react-tabs
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Key Features & Implementation Details

### Authentication Flow

1. **Sign Up** (`/auth/signup`)
   - Email and password validation with Zod
   - Formik for form state management
   - Redirects to onboarding on success

2. **Login** (`/auth/login`)
   - Email/password authentication
   - Error handling for invalid credentials
   - Redirects to dashboard on success

3. **Password Reset** (`/auth/forgot-password`, `/auth/reset-password`)
   - Email-based password reset
   - Secure token-based reset link

### Onboarding Flow

1. **Welcome** (`/onboarding/welcome`)
   - Introduction to iDrobe features
   - Quick start guide

2. **Upload** (`/onboarding/upload`)
   - Drag-and-drop image upload
   - Multiple file support
   - Supabase Storage integration

3. **Preferences** (`/onboarding/preferences`)
   - Body type selection
   - Fit preferences
   - Activity level
   - Saves to user_profiles table

4. **Complete** (`/onboarding/complete`)
   - Success confirmation
   - Next steps guidance

### Wardrobe Management

**List View** (`/wardrobe`)
- Display all clothing items
- Filter by category
- Search by name
- Sort by recent, name, or times worn
- Real-time updates via Supabase subscriptions

**Add Item** (`/wardrobe/add`)
- Image upload to Supabase Storage
- Item details (name, category, color, brand, size)
- Automatic image URL generation
- Creates record in clothing_items table

**Item Detail** (`/wardrobe/$itemId`)
- View full item details
- Mark as favorite
- Archive or delete
- Track times worn
- View style tags and notes

### Outfit Management

**Recommendations** (`/outfits`)
- Display AI-generated outfit recommendations
- Show recommendation scores
- Filter by occasion and mood
- Tabs for recommendations vs collections

**Create Outfit** (`/outfits/create`)
- Select multiple items from wardrobe
- Set occasion and mood
- Add collection name and description
- Visual item picker with selection feedback

**Outfit Detail** (`/outfits/$outfitId`)
- View all items in outfit
- Mark as favorite
- Share functionality (placeholder)
- Track times worn
- Delete outfit

### Analytics Dashboard

Displays comprehensive wardrobe statistics:
- Total items count
- Category diversity
- Total wears and average wears per item
- Favorite items percentage
- Category breakdown with charts
- Color palette analysis
- Most worn items ranking

### Fashion Trends

- Display current and upcoming seasonal trends
- Show trending colors, patterns, styles, and categories
- Filter by season and region
- Confidence scores for trend predictions
- Valid date ranges for trends

### Profile Settings

- Display user account information
- Edit display name
- Update body type and fit preferences
- Set activity level
- Update location
- Danger zone for account deletion (placeholder)

## Custom Hooks

### `useAuth()`
Returns current authenticated user and loading state.

```typescript
const { user, loading } = useAuth()
```

### `useUserProfile(userId)`
Fetches user profile from database.

```typescript
const { profile, loading, error } = useUserProfile(user?.id)
```

### `useClothingItems(userId)`
Fetches all clothing items with real-time subscriptions.

```typescript
const { items, loading, error } = useClothingItems(user?.id)
```

### `useOutfitRecommendations(userId)`
Fetches outfit recommendations.

```typescript
const { recommendations, loading, error } = useOutfitRecommendations(user?.id)
```

### `useOutfitCollections(userId)`
Fetches user's outfit collections.

```typescript
const { collections, loading, error } = useOutfitCollections(user?.id)
```

### `useWardrobeGaps(userId)`
Fetches identified wardrobe gaps.

```typescript
const { gaps, loading, error } = useWardrobeGaps(user?.id)
```

### `useSeasonalTrends()`
Fetches global seasonal trends.

```typescript
const { trends, loading, error } = useSeasonalTrends()
```

## Form Validation

The application uses **Formik** for form state management and **Zod** for schema validation.

Example:

```typescript
const schema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(8, 'Min 8 characters').required('Required'),
})

const formik = useFormik({
  initialValues: { email: '', password: '' },
  validationSchema: schema,
  onSubmit: async (values) => {
    // Handle submission
  },
})
```

## UI Components

All UI components are from shadcn/ui and located in `app/components/ui/`:

- **Button** - Primary action button with variants
- **Card** - Container component with header/content/footer
- **Input** - Text input field
- **Label** - Form label
- **Select** - Dropdown select component
- **Tabs** - Tabbed interface
- **Badge** - Status/tag badge
- **Alert** - Alert messages

## Styling

The application uses **Tailwind CSS** for styling with a consistent design system:

- Color scheme: Slate, blue, purple, green, red
- Responsive design: Mobile-first approach
- Dark mode support (configured in Tailwind)
- Smooth transitions and hover effects

## Supabase Integration

### Authentication

```typescript
import { supabase } from '@/lib/supabase'

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### Database Operations

```typescript
// Fetch data
const { data, error } = await supabase
  .from('clothing_items')
  .select('*')
  .eq('user_id', userId)

// Insert data
const { error } = await supabase
  .from('clothing_items')
  .insert({ user_id, name, category, ... })

// Update data
const { error } = await supabase
  .from('clothing_items')
  .update({ is_favorite: true })
  .eq('id', itemId)

// Delete data
const { error } = await supabase
  .from('clothing_items')
  .delete()
  .eq('id', itemId)
```

### Storage (Image Upload)

```typescript
// Upload file
const { error } = await supabase.storage
  .from('clothing')
  .upload(`${userId}/${filename}`, file)

// Get public URL
const { data } = supabase.storage
  .from('clothing')
  .getPublicUrl(filePath)
```

### Real-time Subscriptions

```typescript
const subscription = supabase
  .channel(`clothing_items:${userId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'clothing_items',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      // Handle changes
    }
  )
  .subscribe()
```

## Frontend Suggestions & Best Practices

### 1. **Image Optimization**
- Add image lazy loading for wardrobe items
- Implement image compression before upload
- Use thumbnail URLs for list views

### 2. **Performance**
- Implement pagination for large item lists
- Use React.memo for expensive components
- Optimize re-renders with useCallback

### 3. **User Experience**
- Add loading skeletons for better perceived performance
- Implement undo/redo for item deletion
- Add toast notifications for actions
- Implement keyboard shortcuts for power users

### 4. **Features to Add**
- **Virtual Try-On**: Integrate with AI image generation
- **Outfit Sharing**: Social sharing with unique URLs
- **Wishlist**: Save items to buy later
- **Seasonal Rotation**: Auto-suggest items based on season
- **Color Matching**: AI-powered color coordination
- **Sustainability Score**: Track eco-friendly items
- **Budget Tracking**: Monitor spending by category
- **Outfit History**: Track what was worn and when
- **Weather Integration**: Suggest outfits based on weather
- **Social Features**: Share outfits with friends

### 5. **Accessibility**
- Add ARIA labels to interactive elements
- Ensure keyboard navigation works
- Test with screen readers
- Use semantic HTML

### 6. **Error Handling**
- Implement global error boundary
- Add retry logic for failed requests
- Show user-friendly error messages
- Log errors for debugging

### 7. **Testing**
- Unit tests for hooks and utilities
- Integration tests for user flows
- E2E tests for critical paths
- Visual regression testing

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
vercel deploy
```

### Environment Variables for Production

Set these in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Troubleshooting

### Issue: "Cannot find module '@radix-ui/react-label'"

**Solution**: Install missing Radix UI dependencies
```bash
npm install @radix-ui/react-label @radix-ui/react-select @radix-ui/react-tabs
```

### Issue: Supabase authentication not working

**Solution**: 
1. Check environment variables are set correctly
2. Verify Supabase project is active
3. Check RLS policies are configured

### Issue: Images not uploading

**Solution**:
1. Verify Supabase Storage bucket exists
2. Check storage policies allow uploads
3. Ensure file size is under 5MB

## Resources

- [React Router v7 Documentation](https://reactrouter.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Formik Documentation](https://formik.org/)
- [Zod Documentation](https://zod.dev/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## Support

For issues or questions, refer to the database schema documentation and Supabase RLS policies to understand data access patterns.
