import {
  index,
  layout,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  // Guest layout (redirects authenticated users)
  layout("routes/guest._layout.tsx", [
    index("routes/_index.tsx"),
  ]),

  // Auth layout (redirects authenticated users)
  layout("routes/auth._layout.tsx", [
    route("auth/login", "routes/auth/login.tsx"),
    route("auth/signup", "routes/auth/signup.tsx"),
    route("auth/verify-email", "routes/auth/verify-email.tsx"),
    route("auth/forgot-password", "routes/auth/forgot-password.tsx"),
    route("auth/reset-email-sent", "routes/auth/reset-email-sent.tsx"),
    route("auth/confirm", "routes/auth/confirm.tsx"),
    route("auth/signout", "routes/auth/signout.ts"),
  ]),

  // Onboarding layout (dedicated flow)
  layout("routes/onboarding._layout.tsx", [
    route("onboarding/welcome", "routes/onboarding/welcome.tsx"),
    route("onboarding/profile", "routes/onboarding/profile.tsx"),
    route("onboarding/upload", "routes/onboarding/upload.tsx"),
    route(
      "onboarding/first-recommendation",
      "routes/onboarding/first-recommendation.tsx",
    ),
    route("onboarding/complete", "routes/onboarding/complete.tsx"),
  ]),

  // Special auth routes (standalone - handle their own auth logic)
  route("auth/reset-password", "routes/auth/reset-password.tsx"),
  route("recover-account", "routes/recover-account.tsx"),

  // Public routes
  route("changelog", "routes/changelog.tsx"),

  // Protected layout (requires authentication)
  layout("routes/_layout.tsx", [
    route("dashboard", "routes/dashboard/_index.tsx"),

    // Wardrobe routes
    route("wardrobe", "routes/wardrobe/_index.tsx"),
    route("wardrobe/add", "routes/wardrobe/add.tsx"),
    route("wardrobe/analyze", "routes/wardrobe/analyze.tsx"),
    route("wardrobe/:itemId", "routes/wardrobe/$itemId.tsx"),

    // Outfit routes
    route("outfits", "routes/outfits/_index.tsx"),
    route("outfits/create", "routes/outfits/create.tsx"),
    route(
      "outfits/collections/:collectionId",
      "routes/outfits/collections.$collectionId.tsx",
    ),
    route(
      "outfits/collections/:collectionId/edit",
      "routes/outfits/collections.$collectionId.edit.tsx",
    ),
    route("outfits/:outfitId", "routes/outfits/$outfitId.tsx"),

    // Analytics routes (nested under wardrobe)
    route("wardrobe/analytics", "routes/wardrobe.analytics.tsx"),

    // Other routes
    route("trends", "routes/trends/_index.tsx"),
    route("profile", "routes/profile.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),

  // API routes
  route("api/image-url", "routes/api/image-url.ts"),
  route("api/upload-photo", "routes/api/upload-photo.ts"),
  route("api/remove-avatar", "routes/api/remove-avatar.ts"),
  route("api/remove-tryon", "routes/api/remove-tryon.ts"),
  route(
    "api/recommendations/interact",
    "routes/api/recommendations/interact.ts",
  ),
  route("api/sync-trends", "routes/api/sync-trends.ts"),
  route("api/items/:itemId/favorite", "routes/api/items/$itemId/favorite.ts"),
  route("api/items/:itemId/worn", "routes/api/items/$itemId/worn.ts"),
  route("api/items/:itemId/archive", "routes/api/items/$itemId/archive.ts"),
  route("api/items/wear-history", "routes/api/items/wear-history.ts"),

  // Catch-all route for unmatched requests
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
