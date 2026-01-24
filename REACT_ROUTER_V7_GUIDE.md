# React Router v7 Implementation Guide for iDrobe

## Overview

This guide explains how iDrobe uses React Router v7 with SSR support, loaders, actions, and React 19 features like Suspense and `use()`.

## Key Concepts

### 1. Loaders

Loaders are functions that run **before** a route renders. They fetch data on the server and pass it to the component.

```typescript
// routes/wardrobe/_index.tsx
export async function loader({ request }: { request: Request }) {
  const user = await requireAuth()
  const items = await loadClothingItems(user.id)
  return { user, items }
}

function WardrobePage() {
  const { items } = useLoaderData<typeof loader>()
  // items are already loaded!
}
```

**Benefits:**
- Data fetching happens on the server (SSR)
- No loading states needed (Suspense handles it)
- Automatic error handling
- Type-safe with TypeScript

### 2. Actions

Actions handle form submissions and mutations. They run on the server and return data to the component.

```typescript
// routes/wardrobe/add.tsx
export async function action({ request }: { request: Request }) {
  if (request.method === 'POST') {
    const { createClothingItem } = await import('@/lib/actions')
    return createClothingItem(await request.formData())
  }
  return null
}

function AddItemPage() {
  const actionData = useActionData<typeof action>()
  
  if (actionData?.success) {
    navigate('/wardrobe')
  }
}
```

**Benefits:**
- Form submissions handled server-side
- Progressive enhancement (works without JavaScript)
- Automatic revalidation of loaders
- Built-in error handling

### 3. Suspense Boundaries

React 19 Suspense works with React Router loaders for seamless data loading.

```typescript
// components/suspense-boundaries.tsx
export function GridSuspense({ children, count = 6 }) {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(count)].map((_, i) => (
            <GridItemSkeleton key={i} />
          ))}
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

// Usage in route
export default function WardrobePage() {
  return (
    <GridSuspense count={6}>
      <WardrobeContent />
    </GridSuspense>
  )
}
```

### 4. Fetcher for Non-Navigation Mutations

Use `useFetcher` for mutations that don't require navigation.

```typescript
function ItemDetailPage() {
  const fetcher = useFetcher()
  
  const handleToggleFavorite = () => {
    const formData = new FormData()
    formData.append('isFavorite', (!item.is_favorite).toString())
    fetcher.submit(formData, { method: 'PUT' })
  }
  
  return (
    <Button
      onClick={handleToggleFavorite}
      disabled={fetcher.state !== 'idle'}
    >
      {item.is_favorite ? 'Favorited' : 'Add to Favorites'}
    </Button>
  )
}
```

## Route Configuration

### routes.ts Structure

```typescript
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Auth routes (no layout)
  route("auth/login", "routes/auth/login.tsx", {
    loader: requireGuest,
  }),

  // Main app layout
  layout("routes/_layout.tsx", [
    index("routes/_index.tsx", {
      loader: async () => {
        const user = await requireAuth();
        return { user };
      },
    }),

    // Nested routes
    route("wardrobe", "routes/wardrobe/_index.tsx", {
      loader: async () => {
        const user = await requireAuth();
        return { user };
      },
    }),
    route("wardrobe/add", "routes/wardrobe/add.tsx", {
      loader: async () => {
        const user = await requireAuth();
        return { user };
      },
      action: async ({ request }) => {
        if (request.method !== "POST") return null;
        const { createClothingItem } = await import("./lib/actions");
        return createClothingItem(await request.formData());
      },
    }),
  ]),
] satisfies RouteConfig;
```

## Database Schema Integration

The migrations show the database evolved from enums to foreign key references:

### Old Structure (Enums)
```sql
CREATE TYPE clothing_category AS ENUM ('tops', 'bottoms', ...);
ALTER TABLE clothing_items ADD COLUMN category clothing_category;
```

### New Structure (Foreign Keys)
```sql
CREATE TABLE clothing_categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER,
  is_active BOOLEAN
);

ALTER TABLE clothing_items 
ADD COLUMN category_id UUID REFERENCES clothing_categories(id);
```

### Benefits:
- Dynamic categories (can add/remove without migrations)
- Many-to-many relationships (style tags)
- Better query performance
- Easier to manage in UI

### Loaders for New Structure

```typescript
// Load categories for dropdown
export async function loadClothingCategories() {
  const { data, error } = await supabase
    .from('clothing_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  
  if (error) throw new Error('Failed to load categories')
  return data || []
}

// Load item with related data
export async function loadClothingItem(userId: string, itemId: string) {
  const { data, error } = await supabase
    .from('clothing_items')
    .select(`
      *,
      category:category_id(id, name),
      subcategory:subcategory_id(id, name),
      style_tags:clothing_item_style_tags(
        style_tag:style_tag_id(id, name)
      )
    `)
    .eq('id', itemId)
    .eq('user_id', userId)
    .single()
  
  if (error) throw new Error('Clothing item not found')
  return data
}
```

## SSR Considerations

### Server-Side Rendering

React Router v7 with `@react-router/node` enables SSR:

```typescript
// root.tsx
import { Links, Meta, Outlet, Scripts } from 'react-router'

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
```

### Hydration

The app hydrates on the client with data already loaded from the server:

1. Server renders route with loader data
2. HTML sent to client
3. Client hydrates with same data
4. No duplicate requests

## Error Handling

### Loader Errors

```typescript
export async function loader({ params }: { params: { itemId: string } }) {
  const user = await requireAuth() // Throws if not authenticated
  const item = await loadClothingItem(user.id, params.itemId!)
  
  if (!item) {
    throw new Response('Not Found', { status: 404 })
  }
  
  return { user, item }
}
```

### Action Errors

```typescript
export async function action({ request }: { request: Request }) {
  try {
    const { createClothingItem } = await import('@/lib/actions')
    return createClothingItem(await request.formData())
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

## React 19 Features

### use() Hook

The `use()` hook unwraps promises in components:

```typescript
import { use } from 'react'

async function fetchData() {
  return await supabase.from('items').select('*')
}

function Component({ dataPromise }: { dataPromise: Promise<any> }) {
  const data = use(dataPromise)
  return <div>{data.length} items</div>
}
```

### Suspense with use()

```typescript
function ItemList() {
  const itemsPromise = loadClothingItems(userId)
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ItemListContent itemsPromise={itemsPromise} />
    </Suspense>
  )
}

function ItemListContent({ itemsPromise }: { itemsPromise: Promise<any[]> }) {
  const items = use(itemsPromise)
  return <div>{items.map(item => <ItemCard key={item.id} item={item} />)}</div>
}
```

## Best Practices

### 1. Parallel Data Loading

Load multiple data sources in parallel:

```typescript
export async function loadDashboardData(userId: string) {
  const [profile, items, recommendations, collections] = await Promise.all([
    loadUserProfile(userId),
    loadClothingItems(userId),
    loadOutfitRecommendations(userId),
    loadOutfitCollections(userId),
  ])

  return { profile, items, recommendations, collections }
}
```

### 2. Lazy Load Non-Critical Data

Use Suspense boundaries for non-critical data:

```typescript
export default function Dashboard() {
  return (
    <div>
      <CriticalContent /> {/* Loads immediately */}
      
      <Suspense fallback={<Skeleton />}>
        <NonCriticalContent /> {/* Loads in background */}
      </Suspense>
    </div>
  )
}
```

### 3. Type-Safe Loaders and Actions

```typescript
// lib/loaders.ts
export async function loadClothingItems(userId: string) {
  // Returns typed data
  return data as Database['public']['Tables']['clothing_items']['Row'][]
}

// routes/wardrobe/_index.tsx
export async function loader() {
  const items = await loadClothingItems(userId)
  return { items }
}

function WardrobePage() {
  const { items } = useLoaderData<typeof loader>()
  // items is fully typed!
}
```

### 4. Form Handling

Use `<Form>` component for progressive enhancement:

```typescript
import { Form } from 'react-router'

export default function AddItemPage() {
  return (
    <Form method="post" encType="multipart/form-data">
      <input name="name" required />
      <input name="image" type="file" required />
      <button type="submit">Add Item</button>
    </Form>
  )
}
```

## Migration Path

### From Hooks to Loaders

**Before (with hooks):**
```typescript
function WardrobePage() {
  const { user } = useAuth()
  const { items, loading } = useClothingItems(user?.id)
  
  if (loading) return <Skeleton />
  return <ItemList items={items} />
}
```

**After (with loaders):**
```typescript
export async function loader() {
  const user = await requireAuth()
  const items = await loadClothingItems(user.id)
  return { user, items }
}

function WardrobePage() {
  const { items } = useLoaderData<typeof loader>()
  return <ItemList items={items} />
}
```

## Performance Metrics

### Before (Hooks)
- Initial load: ~2s (client-side data fetching)
- Waterfall: HTML → JS → Data fetch → Render

### After (Loaders + SSR)
- Initial load: ~800ms (server-side data fetching)
- Parallel: HTML + Data fetched together

## Troubleshooting

### Issue: "Cannot find module" in loader

**Solution:** Use dynamic imports in loaders:
```typescript
export async function loader() {
  const { loadClothingItems } = await import('@/lib/loaders')
  return loadClothingItems(userId)
}
```

### Issue: Loader runs twice

**Solution:** This is normal in development with React Strict Mode. It ensures loaders are idempotent.

### Issue: Data not updating after action

**Solution:** Use `revalidator` to manually revalidate:
```typescript
const revalidator = useRevalidator()

const handleSubmit = async () => {
  await submitForm()
  revalidator.revalidate()
}
```

## Resources

- [React Router v7 Docs](https://reactrouter.com/)
- [React 19 Docs](https://react.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [SSR Guide](https://reactrouter.com/start/framework/ssr)
