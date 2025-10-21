// Shared TypeScript types for the application
export interface ClothingItem {
  id: string
  name: string
  category_id: string
  subcategory_id?: string
  primary_color: string
  season: string[]
  is_archived: boolean
}

export interface ClothingCategory {
  id: string
  name: string
  display_order: number
  is_active: boolean
}