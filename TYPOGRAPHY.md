# Typography System

## Design Tokens

Use shadcn/ui design tokens for consistent theming:

### Text Colors
- `text-foreground` - Primary text (headings, important content)
- `text-muted-foreground` - Secondary text (descriptions, metadata)
- `text-destructive` - Error states
- `text-primary` - Brand/accent text

### Typography Scale

#### Headings
- `text-4xl font-bold` - Page titles (h1)
- `text-3xl font-bold` - Section headers (h2) 
- `text-2xl font-semibold` - Subsection headers (h3)
- `text-xl font-semibold` - Card titles (h4)
- `text-lg font-medium` - Component headers (h5)

#### Body Text
- `text-base` - Default body text (16px)
- `text-sm` - Secondary content (14px)
- `text-xs` - Metadata, captions (12px)

#### Font Weights
- `font-bold` - Headings, emphasis
- `font-semibold` - Subheadings
- `font-medium` - Labels, buttons
- `font-normal` - Body text (default)

## Usage Examples

```tsx
// Page Header
<h1 className="text-3xl font-bold">Dashboard</h1>
<p className="text-muted-foreground mt-2">Welcome back to your wardrobe</p>

// Card Content
<CardTitle className="text-lg font-semibold">Recent Items</CardTitle>
<CardDescription className="text-sm text-muted-foreground">Your latest additions</CardDescription>

// Metadata
<p className="text-xs text-muted-foreground">Added 2 days ago</p>

// Interactive Elements
<Button className="text-sm font-medium">Add Item</Button>
<Link className="text-sm text-primary hover:underline">View All</Link>
```

## Spacing

- Use consistent spacing: `mt-1`, `mt-2`, `mb-4`, etc.
- Follow 4px grid: 1=4px, 2=8px, 4=16px, 6=24px
- Use `space-y-*` for vertical rhythm in containers

## Avoid

❌ `text-slate-600`, `text-gray-500` (use `text-muted-foreground`)
❌ `text-black`, `text-white` (use `text-foreground`)
❌ Inconsistent font weights
❌ Custom font sizes outside the scale