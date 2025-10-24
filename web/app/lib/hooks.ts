import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Database } from './supabase'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Database['public']['Tables']['user_profiles']['Row'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  return { profile, loading, error }
}

export function useClothingItems(userId: string | undefined) {
  const [items, setItems] = useState<Database['public']['Tables']['clothing_items']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from('clothing_items')
          .select('*')
          .eq('user_id', userId)
          .eq('is_archived', false)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (error) throw error
        setItems(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch items')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()

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
        () => {
          fetchItems()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  return { items, loading, error }
}

export function useOutfitRecommendations(userId: string | undefined) {
  const [recommendations, setRecommendations] = useState<Database['public']['Tables']['outfit_recommendations']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchRecommendations = async () => {
      try {
        const { data, error } = await supabase
          .from('outfit_recommendations')
          .select('*')
          .eq('user_id', userId)
          .order('generated_at', { ascending: false })
          .limit(20)

        if (error) throw error
        setRecommendations(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recommendations')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [userId])

  return { recommendations, loading, error }
}

export function useOutfitCollections(userId: string | undefined) {
  const [collections, setCollections] = useState<Database['public']['Tables']['outfit_collections']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchCollections = async () => {
      try {
        const { data, error } = await supabase
          .from('outfit_collections')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setCollections(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch collections')
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [userId])

  return { collections, loading, error }
}

export function useWardrobeGaps(userId: string | undefined) {
  const [gaps, setGaps] = useState<Database['public']['Tables']['wardrobe_gaps']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchGaps = async () => {
      try {
        const { data, error } = await supabase
          .from('wardrobe_gaps')
          .select('*')
          .eq('user_id', userId)
          .eq('is_addressed', false)
          .order('priority', { ascending: false })

        if (error) throw error
        setGaps(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch gaps')
      } finally {
        setLoading(false)
      }
    }

    fetchGaps()
  }, [userId])

  return { gaps, loading, error }
}

export function useSeasonalTrends() {
  const [trends, setTrends] = useState<Database['public']['Tables']['seasonal_trends']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const { data, error } = await supabase
          .from('seasonal_trends')
          .select('*')
          .eq('region', 'global')
          .order('valid_from', { ascending: false })

        if (error) throw error
        setTrends(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trends')
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [])

  return { trends, loading, error }
}
