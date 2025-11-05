import { z } from 'zod'

// User Profile Schema
export const userProfileSchema = z.object({
  display_name: z.string({
    error: (issue) => issue.input === undefined ?
      "Display name is required" :
      "Display name must be text"
  }).min(1, 'Display name is required'),
  body_type: z.enum(['hourglass', 'pear', 'apple', 'rectangle', 'inverted-triangle', 'petite', 'tall', 'athletic', 'plus-size', 'prefer-not-to-say'], {
    message: 'Please select a body type'
  }),
  height_cm: z.number({
    error: (issue) => issue.input === undefined ?
      "Height is optional" :
      "Height must be a number"
  }).positive().optional(),
  weight_kg: z.number({
    error: (issue) => issue.input === undefined ?
      "Weight is optional" :
      "Weight must be a number"
  }).positive().optional(),
  preferred_fit: z.enum(['tight', 'fitted', 'regular', 'loose', 'oversized'], {
    message: 'Please select your preferred fit'
  }),
  style_preferences: z.array(z.string()).optional(),
  color_preferences: z.array(z.string()).optional(),
  location_city: z.string({
    error: (issue) => issue.input === undefined ?
      "City is optional" :
      "City must be text"
  }).optional(),
  location_country: z.string({
    error: (issue) => issue.input === undefined ?
      "Country is optional" :
      "Country must be text"
  }).optional(),
})

// Clothing Item Schema
export const clothingItemSchema = z.object({
  name: z.string({ 
    error: (issue) => issue.input === undefined ? 
      "Item name is required" : 
      "Item name must be text" 
  }).min(1, 'Item name is required'),
  category: z.string({ 
    error: (issue) => issue.input === undefined ? 
      "Category is required" : 
      "Category must be text" 
  }).min(1, 'Category is required'),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  size: z.string().optional(),
  primary_color: z.string({ 
    error: (issue) => issue.input === undefined ? 
      "Primary color is required" : 
      "Primary color must be text" 
  }).min(1, 'Primary color is required'),
  secondary_colors: z.string().optional(),
  material: z.string().optional(),
  pattern: z.string().optional(),
  fit: z.string().default('regular'),
  season: z.string().optional(),
  weather_suitable: z.string().optional(),
  style_tags: z.string().optional(),
  care_instructions: z.string().optional(),
  purchase_date: z.string().optional(),
  cost: z.string().optional(),
  sustainability_score: z.string().optional(),
  notes: z.string().optional(),
})

// Outfit Collection Schema
export const outfitCollectionSchema = z.object({
  name: z.string({
    error: (issue) => issue.input === undefined ?
      "Collection name is required" :
      "Collection name must be text"
  }).min(1, 'Collection name is required'),
  description: z.string({
    error: (issue) => issue.input === undefined ?
      "Description is optional" :
      "Description must be text"
  }).optional(),
  clothing_item_ids: z.array(z.string({
    error: (issue) => issue.input === undefined ?
      "Item ID is required" :
      "Item ID must be text"
  }).uuid('Invalid item ID')).min(1, 'At least one item is required'),
})

// Auth Schemas
export const loginSchema = z.object({
  email: z.string({ 
    error: (issue) => issue.input === undefined ? 
      "Email is required" : 
      "Please enter a valid email" 
  }).email('Please enter a valid email'),
  password: z.string({ 
    error: (issue) => issue.input === undefined ? 
      "Password is required" : 
      "Password must be at least 6 characters" 
  }).min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  email: z.string({ 
    error: (issue) => issue.input === undefined ? 
      "Email is required" : 
      "Please enter a valid email" 
  }).email('Please enter a valid email'),
  password: z.string({ 
    error: (issue) => issue.input === undefined ? 
      "Password is required" : 
      "Password must be at least 8 characters" 
  }).min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string({ 
    error: (issue) => issue.input === undefined ? 
      "Please confirm your password" : 
      "Passwords must match" 
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
})

export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
})

// Onboarding Schemas
export const onboardingProfileSchema = z.object({
  display_name: z.string({
    error: (issue) => issue.input === undefined ?
      "What should we call you?" :
      "Name must be text"
  }).min(1, 'What should we call you?'),
  location_city: z.string({
    error: (issue) => issue.input === undefined ?
      "City helps us with weather recommendations" :
      "City must be text"
  }).min(1, 'City helps us with weather recommendations'),
  location_country: z.string({
    error: (issue) => issue.input === undefined ?
      "Country is required" :
      "Country must be text"
  }).min(1, 'Country is required'),
  style_vibe: z.enum(['minimalist', 'classic', 'trendy', 'bohemian', 'edgy', 'romantic'], {
    message: 'Pick the vibe that speaks to you'
  }),
  preferred_fit: z.enum(['tight', 'fitted', 'regular', 'loose', 'oversized'], {
    message: 'How do you like your clothes to fit?'
  }),
})

export const onboardingInteractionSchema = z.object({
  recommendation_id: z.uuid(),
  interaction_type: z.enum(['liked', 'disliked']),
})

// Collection Schema (for forms)
export const collectionSchema = z.object({
  name: z.string({
    error: (issue) => issue.input === undefined ?
      "Collection name is required" :
      "Collection name must be text"
  }).min(1, 'Collection name is required'),
  description: z.string({
    error: (issue) => issue.input === undefined ?
      "Description is optional" :
      "Description must be text"
  }).optional()
})

// Type helpers
export type UserProfileInput = z.infer<typeof userProfileSchema>
export type ClothingItemInput = z.infer<typeof clothingItemSchema>
export type OutfitCollectionInput = z.infer<typeof outfitCollectionSchema>
export type CollectionInput = z.infer<typeof collectionSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type OnboardingProfileInput = z.infer<typeof onboardingProfileSchema>
export type OnboardingInteractionInput = z.infer<typeof onboardingInteractionSchema>