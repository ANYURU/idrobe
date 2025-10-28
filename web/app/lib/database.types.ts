export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      category_creation_log: {
        Row: {
          category_name: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          category_name: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          category_name?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clothing_categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          parent_category_id: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category_id?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category_id?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clothing_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "clothing_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      clothing_duplicates: {
        Row: {
          detected_at: string | null
          detection_method: string | null
          duplicate_item_id: string
          id: string
          original_item_id: string
          resolved_at: string | null
          similarity_score: number
          user_confirmed: boolean | null
          user_id: string
        }
        Insert: {
          detected_at?: string | null
          detection_method?: string | null
          duplicate_item_id: string
          id?: string
          original_item_id: string
          resolved_at?: string | null
          similarity_score: number
          user_confirmed?: boolean | null
          user_id: string
        }
        Update: {
          detected_at?: string | null
          detection_method?: string | null
          duplicate_item_id?: string
          id?: string
          original_item_id?: string
          resolved_at?: string | null
          similarity_score?: number
          user_confirmed?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      clothing_item_style_tags: {
        Row: {
          clothing_item_id: string
          style_tag_id: string
        }
        Insert: {
          clothing_item_id: string
          style_tag_id: string
        }
        Update: {
          clothing_item_id?: string
          style_tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clothing_item_style_tags_style_tag_id_fkey"
            columns: ["style_tag_id"]
            isOneToOne: false
            referencedRelation: "style_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      clothing_items: {
        Row: {
          ai_confidence_score: number | null
          ai_metadata: Json | null
          brand: string | null
          care_instructions: string | null
          category_id: string | null
          cost: number | null
          created_at: string | null
          deleted_at: string | null
          embedding: string | null
          fit_name: string | null
          id: string
          image_url: string
          is_archived: boolean | null
          is_eco_friendly: boolean | null
          is_favorite: boolean | null
          last_worn_date: string | null
          material: string[] | null
          name: string
          notes: string | null
          pattern: string | null
          primary_color: string
          purchase_date: string | null
          season_names: string[] | null
          secondary_colors: string[] | null
          size: string | null
          subcategory_id: string | null
          sustainability_score: number | null
          thumbnail_url: string | null
          times_worn: number | null
          updated_at: string | null
          user_id: string
          weather_suitable_names: string[] | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_metadata?: Json | null
          brand?: string | null
          care_instructions?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          deleted_at?: string | null
          embedding?: string | null
          fit_name?: string | null
          id?: string
          image_url: string
          is_archived?: boolean | null
          is_eco_friendly?: boolean | null
          is_favorite?: boolean | null
          last_worn_date?: string | null
          material?: string[] | null
          name: string
          notes?: string | null
          pattern?: string | null
          primary_color: string
          purchase_date?: string | null
          season_names?: string[] | null
          secondary_colors?: string[] | null
          size?: string | null
          subcategory_id?: string | null
          sustainability_score?: number | null
          thumbnail_url?: string | null
          times_worn?: number | null
          updated_at?: string | null
          user_id: string
          weather_suitable_names?: string[] | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_metadata?: Json | null
          brand?: string | null
          care_instructions?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          deleted_at?: string | null
          embedding?: string | null
          fit_name?: string | null
          id?: string
          image_url?: string
          is_archived?: boolean | null
          is_eco_friendly?: boolean | null
          is_favorite?: boolean | null
          last_worn_date?: string | null
          material?: string[] | null
          name?: string
          notes?: string | null
          pattern?: string | null
          primary_color?: string
          purchase_date?: string | null
          season_names?: string[] | null
          secondary_colors?: string[] | null
          size?: string | null
          subcategory_id?: string | null
          sustainability_score?: number | null
          thumbnail_url?: string | null
          times_worn?: number | null
          updated_at?: string | null
          user_id?: string
          weather_suitable_names?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "clothing_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "clothing_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clothing_items_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "clothing_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      clothing_items_p0: {
        Row: {
          ai_confidence_score: number | null
          ai_metadata: Json | null
          brand: string | null
          care_instructions: string | null
          category_id: string | null
          cost: number | null
          created_at: string | null
          deleted_at: string | null
          embedding: string | null
          fit_name: string | null
          id: string
          image_url: string
          is_archived: boolean | null
          is_eco_friendly: boolean | null
          is_favorite: boolean | null
          last_worn_date: string | null
          material: string[] | null
          name: string
          notes: string | null
          pattern: string | null
          primary_color: string
          purchase_date: string | null
          season_names: string[] | null
          secondary_colors: string[] | null
          size: string | null
          subcategory_id: string | null
          sustainability_score: number | null
          thumbnail_url: string | null
          times_worn: number | null
          updated_at: string | null
          user_id: string
          weather_suitable_names: string[] | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_metadata?: Json | null
          brand?: string | null
          care_instructions?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          deleted_at?: string | null
          embedding?: string | null
          fit_name?: string | null
          id?: string
          image_url: string
          is_archived?: boolean | null
          is_eco_friendly?: boolean | null
          is_favorite?: boolean | null
          last_worn_date?: string | null
          material?: string[] | null
          name: string
          notes?: string | null
          pattern?: string | null
          primary_color: string
          purchase_date?: string | null
          season_names?: string[] | null
          secondary_colors?: string[] | null
          size?: string | null
          subcategory_id?: string | null
          sustainability_score?: number | null
          thumbnail_url?: string | null
          times_worn?: number | null
          updated_at?: string | null
          user_id: string
          weather_suitable_names?: string[] | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_metadata?: Json | null
          brand?: string | null
          care_instructions?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          deleted_at?: string | null
          embedding?: string | null
          fit_name?: string | null
          id?: string
          image_url?: string
          is_archived?: boolean | null
          is_eco_friendly?: boolean | null
          is_favorite?: boolean | null
          last_worn_date?: string | null
          material?: string[] | null
          name?: string
          notes?: string | null
          pattern?: string | null
          primary_color?: string
          purchase_date?: string | null
          season_names?: string[] | null
          secondary_colors?: string[] | null
          size?: string | null
          subcategory_id?: string | null
          sustainability_score?: number | null
          thumbnail_url?: string | null
          times_worn?: number | null
          updated_at?: string | null
          user_id?: string
          weather_suitable_names?: string[] | null
        }
        Relationships: []
      }
      clothing_items_p1: {
        Row: {
          ai_confidence_score: number | null
          ai_metadata: Json | null
          brand: string | null
          care_instructions: string | null
          category_id: string | null
          cost: number | null
          created_at: string | null
          deleted_at: string | null
          embedding: string | null
          fit_name: string | null
          id: string
          image_url: string
          is_archived: boolean | null
          is_eco_friendly: boolean | null
          is_favorite: boolean | null
          last_worn_date: string | null
          material: string[] | null
          name: string
          notes: string | null
          pattern: string | null
          primary_color: string
          purchase_date: string | null
          season_names: string[] | null
          secondary_colors: string[] | null
          size: string | null
          subcategory_id: string | null
          sustainability_score: number | null
          thumbnail_url: string | null
          times_worn: number | null
          updated_at: string | null
          user_id: string
          weather_suitable_names: string[] | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_metadata?: Json | null
          brand?: string | null
          care_instructions?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          deleted_at?: string | null
          embedding?: string | null
          fit_name?: string | null
          id?: string
          image_url: string
          is_archived?: boolean | null
          is_eco_friendly?: boolean | null
          is_favorite?: boolean | null
          last_worn_date?: string | null
          material?: string[] | null
          name: string
          notes?: string | null
          pattern?: string | null
          primary_color: string
          purchase_date?: string | null
          season_names?: string[] | null
          secondary_colors?: string[] | null
          size?: string | null
          subcategory_id?: string | null
          sustainability_score?: number | null
          thumbnail_url?: string | null
          times_worn?: number | null
          updated_at?: string | null
          user_id: string
          weather_suitable_names?: string[] | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_metadata?: Json | null
          brand?: string | null
          care_instructions?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          deleted_at?: string | null
          embedding?: string | null
          fit_name?: string | null
          id?: string
          image_url?: string
          is_archived?: boolean | null
          is_eco_friendly?: boolean | null
          is_favorite?: boolean | null
          last_worn_date?: string | null
          material?: string[] | null
          name?: string
          notes?: string | null
          pattern?: string | null
          primary_color?: string
          purchase_date?: string | null
          season_names?: string[] | null
          secondary_colors?: string[] | null
          size?: string | null
          subcategory_id?: string | null
          sustainability_score?: number | null
          thumbnail_url?: string | null
          times_worn?: number | null
          updated_at?: string | null
          user_id?: string
          weather_suitable_names?: string[] | null
        }
        Relationships: []
      }
      clothing_subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          source: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          source?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clothing_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "clothing_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_message: string
          error_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_message?: string
          error_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      fit_preferences: {
        Row: {
          created_at: string | null
          display_name: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      outfit_collections: {
        Row: {
          clothing_item_ids: string[]
          created_at: string | null
          description: string | null
          id: string
          is_favorite: boolean | null
          is_public: boolean | null
          last_worn_date: string | null
          name: string
          share_count: number | null
          times_worn: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clothing_item_ids: string[]
          created_at?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          last_worn_date?: string | null
          name: string
          share_count?: number | null
          times_worn?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clothing_item_ids?: string[]
          created_at?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          last_worn_date?: string | null
          name?: string
          share_count?: number | null
          times_worn?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      outfit_recommendations: {
        Row: {
          activity_level_name: string | null
          ai_score: number | null
          based_on_past_preferences: boolean | null
          clothing_item_ids: string[]
          created_at: string | null
          destination: string | null
          event_duration_hours: number | null
          expires_at: string | null
          generated_at: string | null
          id: string
          is_shared: boolean | null
          missing_items: string[] | null
          mood_name: string | null
          occasion_match_score: number | null
          occasion_name: string | null
          recommendation_reason: string | null
          season_name: string | null
          share_url: string | null
          similarity_to_past_liked: number | null
          style_coherence_score: number | null
          suggested_purchases: Json | null
          temperature_celsius: number | null
          time_of_day: string | null
          user_id: string
          virtual_tryon_url: string | null
          weather_appropriateness_score: number | null
          weather_condition_name: string | null
        }
        Insert: {
          activity_level_name?: string | null
          ai_score?: number | null
          based_on_past_preferences?: boolean | null
          clothing_item_ids: string[]
          created_at?: string | null
          destination?: string | null
          event_duration_hours?: number | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          is_shared?: boolean | null
          missing_items?: string[] | null
          mood_name?: string | null
          occasion_match_score?: number | null
          occasion_name?: string | null
          recommendation_reason?: string | null
          season_name?: string | null
          share_url?: string | null
          similarity_to_past_liked?: number | null
          style_coherence_score?: number | null
          suggested_purchases?: Json | null
          temperature_celsius?: number | null
          time_of_day?: string | null
          user_id: string
          virtual_tryon_url?: string | null
          weather_appropriateness_score?: number | null
          weather_condition_name?: string | null
        }
        Update: {
          activity_level_name?: string | null
          ai_score?: number | null
          based_on_past_preferences?: boolean | null
          clothing_item_ids?: string[]
          created_at?: string | null
          destination?: string | null
          event_duration_hours?: number | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          is_shared?: boolean | null
          missing_items?: string[] | null
          mood_name?: string | null
          occasion_match_score?: number | null
          occasion_name?: string | null
          recommendation_reason?: string | null
          season_name?: string | null
          share_url?: string | null
          similarity_to_past_liked?: number | null
          style_coherence_score?: number | null
          suggested_purchases?: Json | null
          temperature_celsius?: number | null
          time_of_day?: string | null
          user_id?: string
          virtual_tryon_url?: string | null
          weather_appropriateness_score?: number | null
          weather_condition_name?: string | null
        }
        Relationships: []
      }
      outfit_recommendations_p0: {
        Row: {
          activity_level_name: string | null
          ai_score: number | null
          based_on_past_preferences: boolean | null
          clothing_item_ids: string[]
          created_at: string | null
          destination: string | null
          event_duration_hours: number | null
          expires_at: string | null
          generated_at: string | null
          id: string
          is_shared: boolean | null
          missing_items: string[] | null
          mood_name: string | null
          occasion_match_score: number | null
          occasion_name: string | null
          recommendation_reason: string | null
          season_name: string | null
          share_url: string | null
          similarity_to_past_liked: number | null
          style_coherence_score: number | null
          suggested_purchases: Json | null
          temperature_celsius: number | null
          time_of_day: string | null
          user_id: string
          virtual_tryon_url: string | null
          weather_appropriateness_score: number | null
          weather_condition_name: string | null
        }
        Insert: {
          activity_level_name?: string | null
          ai_score?: number | null
          based_on_past_preferences?: boolean | null
          clothing_item_ids: string[]
          created_at?: string | null
          destination?: string | null
          event_duration_hours?: number | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          is_shared?: boolean | null
          missing_items?: string[] | null
          mood_name?: string | null
          occasion_match_score?: number | null
          occasion_name?: string | null
          recommendation_reason?: string | null
          season_name?: string | null
          share_url?: string | null
          similarity_to_past_liked?: number | null
          style_coherence_score?: number | null
          suggested_purchases?: Json | null
          temperature_celsius?: number | null
          time_of_day?: string | null
          user_id: string
          virtual_tryon_url?: string | null
          weather_appropriateness_score?: number | null
          weather_condition_name?: string | null
        }
        Update: {
          activity_level_name?: string | null
          ai_score?: number | null
          based_on_past_preferences?: boolean | null
          clothing_item_ids?: string[]
          created_at?: string | null
          destination?: string | null
          event_duration_hours?: number | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          is_shared?: boolean | null
          missing_items?: string[] | null
          mood_name?: string | null
          occasion_match_score?: number | null
          occasion_name?: string | null
          recommendation_reason?: string | null
          season_name?: string | null
          share_url?: string | null
          similarity_to_past_liked?: number | null
          style_coherence_score?: number | null
          suggested_purchases?: Json | null
          temperature_celsius?: number | null
          time_of_day?: string | null
          user_id?: string
          virtual_tryon_url?: string | null
          weather_appropriateness_score?: number | null
          weather_condition_name?: string | null
        }
        Relationships: []
      }
      outfit_recommendations_p1: {
        Row: {
          activity_level_name: string | null
          ai_score: number | null
          based_on_past_preferences: boolean | null
          clothing_item_ids: string[]
          created_at: string | null
          destination: string | null
          event_duration_hours: number | null
          expires_at: string | null
          generated_at: string | null
          id: string
          is_shared: boolean | null
          missing_items: string[] | null
          mood_name: string | null
          occasion_match_score: number | null
          occasion_name: string | null
          recommendation_reason: string | null
          season_name: string | null
          share_url: string | null
          similarity_to_past_liked: number | null
          style_coherence_score: number | null
          suggested_purchases: Json | null
          temperature_celsius: number | null
          time_of_day: string | null
          user_id: string
          virtual_tryon_url: string | null
          weather_appropriateness_score: number | null
          weather_condition_name: string | null
        }
        Insert: {
          activity_level_name?: string | null
          ai_score?: number | null
          based_on_past_preferences?: boolean | null
          clothing_item_ids: string[]
          created_at?: string | null
          destination?: string | null
          event_duration_hours?: number | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          is_shared?: boolean | null
          missing_items?: string[] | null
          mood_name?: string | null
          occasion_match_score?: number | null
          occasion_name?: string | null
          recommendation_reason?: string | null
          season_name?: string | null
          share_url?: string | null
          similarity_to_past_liked?: number | null
          style_coherence_score?: number | null
          suggested_purchases?: Json | null
          temperature_celsius?: number | null
          time_of_day?: string | null
          user_id: string
          virtual_tryon_url?: string | null
          weather_appropriateness_score?: number | null
          weather_condition_name?: string | null
        }
        Update: {
          activity_level_name?: string | null
          ai_score?: number | null
          based_on_past_preferences?: boolean | null
          clothing_item_ids?: string[]
          created_at?: string | null
          destination?: string | null
          event_duration_hours?: number | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          is_shared?: boolean | null
          missing_items?: string[] | null
          mood_name?: string | null
          occasion_match_score?: number | null
          occasion_name?: string | null
          recommendation_reason?: string | null
          season_name?: string | null
          share_url?: string | null
          similarity_to_past_liked?: number | null
          style_coherence_score?: number | null
          suggested_purchases?: Json | null
          temperature_celsius?: number | null
          time_of_day?: string | null
          user_id?: string
          virtual_tryon_url?: string | null
          weather_appropriateness_score?: number | null
          weather_condition_name?: string | null
        }
        Relationships: []
      }
      recommendation_logs: {
        Row: {
          ai_confidence: number | null
          created_at: string | null
          input_context: Json
          log_id: string
          output_items: string[] | null
          recommendation_id: string | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          created_at?: string | null
          input_context: Json
          log_id?: string
          output_items?: string[] | null
          recommendation_id?: string | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          created_at?: string | null
          input_context?: Json
          log_id?: string
          output_items?: string[] | null
          recommendation_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seasonal_trend_categories: {
        Row: {
          category_id: string
          trend_id: string
        }
        Insert: {
          category_id: string
          trend_id: string
        }
        Update: {
          category_id?: string
          trend_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_trend_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "clothing_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seasonal_trend_categories_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "seasonal_trends"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_trends: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          region: string | null
          season_name: string | null
          source: string | null
          trend_description: string | null
          trending_category_ids: string[] | null
          trending_colors: string[] | null
          trending_patterns: string[] | null
          trending_styles: string[] | null
          valid_from: string
          valid_until: string
          year: number
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          region?: string | null
          season_name?: string | null
          source?: string | null
          trend_description?: string | null
          trending_category_ids?: string[] | null
          trending_colors?: string[] | null
          trending_patterns?: string[] | null
          trending_styles?: string[] | null
          valid_from: string
          valid_until: string
          year: number
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          region?: string | null
          season_name?: string | null
          source?: string | null
          trend_description?: string | null
          trending_category_ids?: string[] | null
          trending_colors?: string[] | null
          trending_patterns?: string[] | null
          trending_styles?: string[] | null
          valid_from?: string
          valid_until?: string
          year?: number
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string | null
          display_name: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      style_tags: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_trending: boolean | null
          name: string
          popularity_score: number | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_trending?: boolean | null
          name: string
          popularity_score?: number | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_trending?: boolean | null
          name?: string
          popularity_score?: number | null
          source?: string | null
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          clothing_item_id: string | null
          feedback_text: string | null
          id: string
          interacted_at: string | null
          interaction_type_name: string | null
          rating: number | null
          recommendation_id: string | null
          user_id: string
        }
        Insert: {
          clothing_item_id?: string | null
          feedback_text?: string | null
          id?: string
          interacted_at?: string | null
          interaction_type_name?: string | null
          rating?: number | null
          recommendation_id?: string | null
          user_id: string
        }
        Update: {
          clothing_item_id?: string | null
          feedback_text?: string | null
          id?: string
          interacted_at?: string | null
          interaction_type_name?: string | null
          rating?: number | null
          recommendation_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          body_type_name: string | null
          color_preferences: string[] | null
          created_at: string | null
          cultural_preferences: Json | null
          default_activity_level_name: string | null
          display_name: string | null
          height_cm: number | null
          location_city: string | null
          location_country: string | null
          onboarding_completed: boolean | null
          preferred_fit_name: string | null
          profile_image_url: string | null
          style_preferences: string[] | null
          sustainability_score: number | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          body_type_name?: string | null
          color_preferences?: string[] | null
          created_at?: string | null
          cultural_preferences?: Json | null
          default_activity_level_name?: string | null
          display_name?: string | null
          height_cm?: number | null
          location_city?: string | null
          location_country?: string | null
          onboarding_completed?: boolean | null
          preferred_fit_name?: string | null
          profile_image_url?: string | null
          style_preferences?: string[] | null
          sustainability_score?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          body_type_name?: string | null
          color_preferences?: string[] | null
          created_at?: string | null
          cultural_preferences?: Json | null
          default_activity_level_name?: string | null
          display_name?: string | null
          height_cm?: number | null
          location_city?: string | null
          location_country?: string | null
          onboarding_completed?: boolean | null
          preferred_fit_name?: string | null
          profile_image_url?: string | null
          style_preferences?: string[] | null
          sustainability_score?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      wardrobe_gaps: {
        Row: {
          addressed_at: string | null
          category_id: string | null
          created_at: string | null
          description: string
          estimated_cost: number | null
          gap_type: string
          id: string
          is_addressed: boolean | null
          priority: number | null
          suggested_items: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          addressed_at?: string | null
          category_id?: string | null
          created_at?: string | null
          description: string
          estimated_cost?: number | null
          gap_type: string
          id?: string
          is_addressed?: boolean | null
          priority?: number | null
          suggested_items?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          addressed_at?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string
          estimated_cost?: number | null
          gap_type?: string
          id?: string
          is_addressed?: boolean | null
          priority?: number | null
          suggested_items?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wardrobe_gaps_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "clothing_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_wardrobe_analytics: {
        Row: {
          avg_sustainability: number | null
          category_diversity: number | null
          last_item_added: string | null
          last_recommendation_generated: string | null
          liked_recommendations: number | null
          recommendation_acceptance_rate: number | null
          total_items: number | null
          total_recommendations: number | null
          total_wears: number | null
          user_id: string | null
          worn_recommendations: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_style_tags_to_item: {
        Args: { item_id: string; tag_names: string[] }
        Returns: undefined
      }
      add_trending_categories_to_trend: {
        Args: { category_names: string[]; trend_id: string }
        Returns: undefined
      }
      calculate_wardrobe_diversity: {
        Args: { target_user_id: string }
        Returns: number
      }
      check_category_creation_rate_limit: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      cleanup_orphaned_records: { Args: never; Returns: number }
      find_or_create_category: {
        Args: { category_name: string }
        Returns: string
      }
      find_or_create_fit_preference: {
        Args: { fit_name: string }
        Returns: string
      }
      find_or_create_season: { Args: { season_name: string }; Returns: string }
      find_or_create_subcategory: {
        Args: { parent_category_id: string; subcategory_name: string }
        Returns: string
      }
      find_similar_items: {
        Args: {
          limit_count?: number
          similarity_threshold?: number
          target_embedding: string
          target_user_id: string
        }
        Returns: {
          category_name: string
          item_id: string
          name: string
          similarity_score: number
        }[]
      }
      get_active_categories_for_prompt: { Args: never; Returns: Json }
      get_clothing_item_with_categories: {
        Args: { item_id: string }
        Returns: Json
      }
      get_trending_categories_for_season:
        | {
            Args: { target_season: string; target_year: number }
            Returns: Json
          }
        | {
            Args: {
              target_season: Database["public"]["Enums"]["season"]
              target_year: number
            }
            Returns: Json
          }
      log_error: {
        Args: {
          error_context?: Json
          error_message: string
          error_type: string
          target_user_id: string
        }
        Returns: undefined
      }
      normalize_enum_value: { Args: { input_value: string }; Returns: string }
      refresh_wardrobe_analytics: { Args: never; Returns: undefined }
      schedule_analytics_refresh: { Args: never; Returns: undefined }
      validate_ai_clothing_analysis: {
        Args: { analysis_json: Json }
        Returns: boolean
      }
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "very-active"
      body_type:
        | "hourglass"
        | "pear"
        | "apple"
        | "rectangle"
        | "inverted-triangle"
        | "petite"
        | "tall"
        | "athletic"
        | "plus-size"
        | "prefer-not-to-say"
      fit_preference: "tight" | "fitted" | "regular" | "loose" | "oversized"
      interaction_type:
        | "liked"
        | "disliked"
        | "worn"
        | "skipped"
        | "saved"
        | "shared"
      mood:
        | "confident"
        | "relaxed"
        | "professional"
        | "playful"
        | "romantic"
        | "edgy"
        | "elegant"
        | "sporty"
        | "bohemian"
        | "minimalist"
        | "bold"
        | "comfortable"
        | "trendy"
        | "classic"
        | "creative"
        | "adventurous"
      occasion:
        | "casual"
        | "work"
        | "formal"
        | "business-casual"
        | "party"
        | "wedding"
        | "date"
        | "sports"
        | "outdoor"
        | "beach"
        | "gym"
        | "travel"
        | "religious"
        | "interview"
        | "networking"
        | "brunch"
        | "dinner"
        | "concert"
        | "festival"
        | "graduation"
        | "everyday"
      season: "spring" | "summer" | "fall" | "winter" | "all-season"
      weather_condition:
        | "sunny"
        | "cloudy"
        | "rainy"
        | "snowy"
        | "windy"
        | "hot"
        | "cold"
        | "mild"
        | "humid"
        | "dry"
        | "stormy"
        | "foggy"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_level: [
        "sedentary",
        "light",
        "moderate",
        "active",
        "very-active",
      ],
      body_type: [
        "hourglass",
        "pear",
        "apple",
        "rectangle",
        "inverted-triangle",
        "petite",
        "tall",
        "athletic",
        "plus-size",
        "prefer-not-to-say",
      ],
      fit_preference: ["tight", "fitted", "regular", "loose", "oversized"],
      interaction_type: [
        "liked",
        "disliked",
        "worn",
        "skipped",
        "saved",
        "shared",
      ],
      mood: [
        "confident",
        "relaxed",
        "professional",
        "playful",
        "romantic",
        "edgy",
        "elegant",
        "sporty",
        "bohemian",
        "minimalist",
        "bold",
        "comfortable",
        "trendy",
        "classic",
        "creative",
        "adventurous",
      ],
      occasion: [
        "casual",
        "work",
        "formal",
        "business-casual",
        "party",
        "wedding",
        "date",
        "sports",
        "outdoor",
        "beach",
        "gym",
        "travel",
        "religious",
        "interview",
        "networking",
        "brunch",
        "dinner",
        "concert",
        "festival",
        "graduation",
        "everyday",
      ],
      season: ["spring", "summer", "fall", "winter", "all-season"],
      weather_condition: [
        "sunny",
        "cloudy",
        "rainy",
        "snowy",
        "windy",
        "hot",
        "cold",
        "mild",
        "humid",
        "dry",
        "stormy",
        "foggy",
      ],
    },
  },
} as const

