import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Guest layout (redirects authenticated users)
  layout("routes/guest._layout.tsx", [
    route("guest", "routes/guest/_index.tsx"),
  ]),

  // Auth layout (redirects authenticated users)
  layout("routes/auth._layout.tsx", [
    route("auth/login", "routes/auth/login.tsx"),
    route("auth/signup", "routes/auth/signup.tsx"),
    route("auth/forgot-password", "routes/auth/forgot-password.tsx"),
    route("auth/reset-password", "routes/auth/reset-password.tsx"),
    route("auth/confirm", "routes/auth/confirm.tsx"),
    route("auth/signout", "routes/auth/signout.ts"),
  ]),

  // Onboarding layout (dedicated flow)
  layout("routes/onboarding._layout.tsx", [
    route("onboarding/welcome", "routes/onboarding/welcome.tsx"),
    route("onboarding/profile", "routes/onboarding/profile.tsx"),
    route("onboarding/upload", "routes/onboarding/upload.tsx"),
    route("onboarding/first-recommendation", "routes/onboarding/first-recommendation.tsx"),
    route("onboarding/complete", "routes/onboarding/complete.tsx"),
  ]),

  // Protected layout (requires authentication)
  layout("routes/_layout.tsx", [
    index("routes/_index.tsx"),
    
    // Wardrobe routes
    route("wardrobe", "routes/wardrobe/_index.tsx"),
    route("wardrobe/add", "routes/wardrobe/add.tsx"),
    route("wardrobe/analyze", "routes/wardrobe/analyze.tsx"),
    route("wardrobe/:itemId", "routes/wardrobe/$itemId.tsx"),
    
    // Outfit routes
    route("outfits", "routes/outfits/_index.tsx"),
    route("outfits/create", "routes/outfits/create.tsx"),
    route("outfits/collections/:collectionId", "routes/outfits/collections.$collectionId.tsx"),
    route("outfits/collections/:collectionId/edit", "routes/outfits/collections.$collectionId.edit.tsx"),
    route("outfits/:outfitId", "routes/outfits/$outfitId.tsx"),
    
    // Other routes
    route("trends", "routes/trends/_index.tsx"),
    route("profile", "routes/profile.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),

  // API routes
  route("api/image-url", "routes/api/image-url.ts"),
  route("api/recommendations/interact", "routes/api/recommendations/interact.ts"),

  // Catch-all route for unmatched requests
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;