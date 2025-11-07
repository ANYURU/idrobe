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
          currency: string | null
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
          currency?: string | null
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
          currency?: string | null
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
          currency: string | null
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
          currency?: string | null
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
          currency?: string | null
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
          currency: string | null
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
          currency?: string | null
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
          currency?: string | null
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
      discount_codes: {
        Row: {
          applies_to_plans: string[] | null
          code: string
          created_at: string | null
          currency: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          minimum_amount: number | null
          name: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applies_to_plans?: string[] | null
          code: string
          created_at?: string | null
          currency?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          minimum_amount?: number | null
          name?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applies_to_plans?: string[] | null
          code?: string
          created_at?: string | null
          currency?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          minimum_amount?: number | null
          name?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
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
      event_outfit_choices: {
        Row: {
          choice_type: string
          created_at: string | null
          event_id: string
          feedback_note: string | null
          outfit_recommendation_id: string
        }
        Insert: {
          choice_type: string
          created_at?: string | null
          event_id: string
          feedback_note?: string | null
          outfit_recommendation_id: string
        }
        Update: {
          choice_type?: string
          created_at?: string | null
          event_id?: string
          feedback_note?: string | null
          outfit_recommendation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_outfit_choices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_templates: {
        Row: {
          created_at: string | null
          default_occasion: string | null
          id: string
          is_favorite: boolean | null
          name: string
          updated_at: string | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_occasion?: string | null
          id?: string
          is_favorite?: boolean | null
          name: string
          updated_at?: string | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_occasion?: string | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          event_datetime: string
          id: string
          location: string | null
          notes: string | null
          status: string | null
          template_id: string | null
          title: string
          updated_at: string | null
          user_id: string
          weather_at_creation: Json | null
        }
        Insert: {
          created_at?: string | null
          event_datetime: string
          id?: string
          location?: string | null
          notes?: string | null
          status?: string | null
          template_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          weather_at_creation?: Json | null
        }
        Update: {
          created_at?: string | null
          event_datetime?: string
          id?: string
          location?: string | null
          notes?: string | null
          status?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          weather_at_creation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "event_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string | null
          fetched_at: string | null
          id: string
          is_active: boolean | null
          provider: string | null
          rate: number
          rate_date: string | null
          target_currency: string
          update_frequency: string | null
          valid_until: string | null
        }
        Insert: {
          base_currency?: string
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string | null
          rate: number
          rate_date?: string | null
          target_currency: string
          update_frequency?: string | null
          valid_until?: string | null
        }
        Update: {
          base_currency?: string
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string | null
          rate?: number
          rate_date?: string | null
          target_currency?: string
          update_frequency?: string | null
          valid_until?: string | null
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
          currency: string | null
          description: string | null
          estimated_cost: number | null
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
          currency?: string | null
          description?: string | null
          estimated_cost?: number | null
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
          currency?: string | null
          description?: string | null
          estimated_cost?: number | null
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
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          external_transaction_id: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          mobile_provider: string | null
          paid_at: string | null
          payment_type: string
          phone_number: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          external_transaction_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          mobile_provider?: string | null
          paid_at?: string | null
          payment_type?: string
          phone_number?: string | null
          status: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          external_transaction_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          mobile_provider?: string | null
          paid_at?: string | null
          payment_type?: string
          phone_number?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          created_at: string | null
          id: string
          limit_type: string
          limit_value: number
          period: string
          plan_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          limit_type: string
          limit_value: number
          period?: string
          plan_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          limit_type?: string
          limit_value?: number
          period?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
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
      referrals: {
        Row: {
          completed_at: string | null
          conversion_data: Json | null
          created_at: string | null
          expires_at: string | null
          id: string
          referee_id: string
          referral_code: string
          referral_source: string | null
          referrer_id: string
          reward_currency: string
          reward_type: string
          reward_value: number
          status: string
        }
        Insert: {
          completed_at?: string | null
          conversion_data?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          referee_id: string
          referral_code: string
          referral_source?: string | null
          referrer_id: string
          reward_currency?: string
          reward_type?: string
          reward_value: number
          status?: string
        }
        Update: {
          completed_at?: string | null
          conversion_data?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          referee_id?: string
          referral_code?: string
          referral_source?: string | null
          referrer_id?: string
          reward_currency?: string
          reward_type?: string
          reward_value?: number
          status?: string
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
          external_source: string | null
          id: string
          keywords: string[] | null
          last_synced_at: string | null
          popularity_score: number | null
          region: string | null
          season_name: string | null
          source: string | null
          sync_metadata: Json | null
          trend_description: string | null
          trend_score: number | null
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
          external_source?: string | null
          id?: string
          keywords?: string[] | null
          last_synced_at?: string | null
          popularity_score?: number | null
          region?: string | null
          season_name?: string | null
          source?: string | null
          sync_metadata?: Json | null
          trend_description?: string | null
          trend_score?: number | null
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
          external_source?: string | null
          id?: string
          keywords?: string[] | null
          last_synced_at?: string | null
          popularity_score?: number | null
          region?: string | null
          season_name?: string | null
          source?: string | null
          sync_metadata?: Json | null
          trend_description?: string | null
          trend_score?: number | null
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
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string | null
          currency: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          billing_interval: string
          created_at?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_interval?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_currency: string
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          grandfathered: boolean | null
          id: string
          plan_id: string
          status: string
          stripe_subscription_id: string | null
          trial_end_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_currency?: string
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          grandfathered?: boolean | null
          id?: string
          plan_id: string
          status?: string
          stripe_subscription_id?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_currency?: string
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          grandfathered?: boolean | null
          id?: string
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      supported_currencies: {
        Row: {
          code: string
          decimal_places: number | null
          display_order: number | null
          is_active: boolean | null
          name: string
          symbol: string | null
        }
        Insert: {
          code: string
          decimal_places?: number | null
          display_order?: number | null
          is_active?: boolean | null
          name: string
          symbol?: string | null
        }
        Update: {
          code?: string
          decimal_places?: number | null
          display_order?: number | null
          is_active?: boolean | null
          name?: string
          symbol?: string | null
        }
        Relationships: []
      }
      sustainability_tracking: {
        Row: {
          created_at: string | null
          id: string
          metric_type: string
          period_end: string | null
          period_start: string
          related_item_id: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_type: string
          period_end?: string | null
          period_start: string
          related_item_id?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_type?: string
          period_end?: string | null
          period_start?: string
          related_item_id?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      trend_keywords: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          keyword: string
          last_updated: string | null
          search_volume: number | null
          trend_direction: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          keyword: string
          last_updated?: string | null
          search_volume?: number | null
          trend_direction?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          keyword?: string
          last_updated?: string | null
          search_volume?: number | null
          trend_direction?: string | null
        }
        Relationships: []
      }
      trend_sync_jobs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          last_run_at: string | null
          metadata: Json | null
          next_run_at: string | null
          source: string
          status: string | null
          trends_updated: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_run_at?: string | null
          metadata?: Json | null
          next_run_at?: string | null
          source: string
          status?: string | null
          trends_updated?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_run_at?: string | null
          metadata?: Json | null
          next_run_at?: string | null
          source?: string
          status?: string | null
          trends_updated?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          usage_count: number | null
          usage_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          usage_count?: number | null
          usage_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          usage_count?: number | null
          usage_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          amount: number
          created_at: string | null
          credit_type: string
          currency: string
          description: string | null
          expires_at: string | null
          id: string
          source_id: string | null
          used_at: string | null
          used_for_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          credit_type: string
          currency?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          source_id?: string | null
          used_at?: string | null
          used_for_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          credit_type?: string
          currency?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          source_id?: string | null
          used_at?: string | null
          used_for_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_used_for_payment_id_fkey"
            columns: ["used_for_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
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
          billing_currency: string | null
          body_type_name: string | null
          color_preferences: string[] | null
          created_at: string | null
          cultural_preferences: Json | null
          current_plan_id: string | null
          default_activity_level_name: string | null
          display_name: string | null
          height_cm: number | null
          location_city: string | null
          location_country: string | null
          monthly_recs_used: number | null
          monthly_tryons_used: number | null
          monthly_uploads_used: number | null
          onboarding_completed: boolean | null
          plan_expires_at: string | null
          preferred_currency: string | null
          preferred_fit_name: string | null
          profile_image_url: string | null
          style_preferences: string[] | null
          subscription_status: string | null
          sustainability_score: number | null
          timezone: string | null
          updated_at: string | null
          usage_reset_date: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          billing_currency?: string | null
          body_type_name?: string | null
          color_preferences?: string[] | null
          created_at?: string | null
          cultural_preferences?: Json | null
          current_plan_id?: string | null
          default_activity_level_name?: string | null
          display_name?: string | null
          height_cm?: number | null
          location_city?: string | null
          location_country?: string | null
          monthly_recs_used?: number | null
          monthly_tryons_used?: number | null
          monthly_uploads_used?: number | null
          onboarding_completed?: boolean | null
          plan_expires_at?: string | null
          preferred_currency?: string | null
          preferred_fit_name?: string | null
          profile_image_url?: string | null
          style_preferences?: string[] | null
          subscription_status?: string | null
          sustainability_score?: number | null
          timezone?: string | null
          updated_at?: string | null
          usage_reset_date?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          billing_currency?: string | null
          body_type_name?: string | null
          color_preferences?: string[] | null
          created_at?: string | null
          cultural_preferences?: Json | null
          current_plan_id?: string | null
          default_activity_level_name?: string | null
          display_name?: string | null
          height_cm?: number | null
          location_city?: string | null
          location_country?: string | null
          monthly_recs_used?: number | null
          monthly_tryons_used?: number | null
          monthly_uploads_used?: number | null
          onboarding_completed?: boolean | null
          plan_expires_at?: string | null
          preferred_currency?: string | null
          preferred_fit_name?: string | null
          profile_image_url?: string | null
          style_preferences?: string[] | null
          subscription_status?: string | null
          sustainability_score?: number | null
          timezone?: string | null
          updated_at?: string | null
          usage_reset_date?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_current_plan_id_fkey"
            columns: ["current_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_archive: {
        Row: {
          created_at: string | null
          email: string
          id: string
          migrated_at: string | null
          migrated_to_referral_id: string | null
          referred_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          migrated_at?: string | null
          migrated_to_referral_id?: string | null
          referred_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          migrated_at?: string | null
          migrated_to_referral_id?: string | null
          referred_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      wardrobe_gaps: {
        Row: {
          addressed_at: string | null
          category_id: string | null
          created_at: string | null
          currency: string | null
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
          currency?: string | null
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
          currency?: string | null
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
          total_items: number | null
          total_wears: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_trending_categories_to_trend: {
        Args: { category_names: string[]; trend_id: string }
        Returns: undefined
      }
      analyze_rls_performance: {
        Args: never
        Returns: {
          estimated_cost: number
          policy_name: string
          recommendation: string
          table_name: string
        }[]
      }
      calculate_wardrobe_diversity: {
        Args: { target_user_id: string }
        Returns: number
      }
      check_category_creation_rate_limit: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_usage_limit: {
        Args: { target_user_id: string; usage_type_param: string }
        Returns: boolean
      }
      cleanup_old_data: { Args: { days_to_keep?: number }; Returns: number }
      cleanup_orphaned_records: { Args: never; Returns: number }
      convert_currency: {
        Args: { amount: number; from_currency: string; to_currency: string }
        Returns: number
      }
      daitch_mokotoff: { Args: { "": string }; Returns: string[] }
      dmetaphone: { Args: { "": string }; Returns: string }
      dmetaphone_alt: { Args: { "": string }; Returns: string }
      find_or_create_category: {
        Args: { category_name: string }
        Returns: string
      }
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
      get_converted_amount: {
        Args: {
          amount: number
          from_currency: string
          target_user_id?: string
          to_currency: string
        }
        Returns: Json
      }
      get_trending_categories_for_season: {
        Args: { target_season: string; target_year: number }
        Returns: Json
      }
      get_user_plan_limits: {
        Args: { limit_type_param: string; target_user_id: string }
        Returns: number
      }
      get_user_preferred_currency: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_user_sustainability_score: {
        Args: { metric_type_param: string; target_user_id: string }
        Returns: number
      }
      grant_waitlist_bonus: {
        Args: { new_user_id: string; user_email: string }
        Returns: boolean
      }
      increment_template_usage: {
        Args: { template_uuid: string }
        Returns: undefined
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
      refresh_all_materialized_views: { Args: never; Returns: number }
      refresh_wardrobe_analytics: { Args: never; Returns: undefined }
      schedule_analytics_refresh: { Args: never; Returns: undefined }
      soundex: { Args: { "": string }; Returns: string }
      text_soundex: { Args: { "": string }; Returns: string }
      update_trend_scores: { Args: never; Returns: undefined }
      validate_ai_clothing_analysis: {
        Args: { analysis_json: Json }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

