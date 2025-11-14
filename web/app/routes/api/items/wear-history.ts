import { createClient } from '@/lib/supabase.server';
import type { Route } from './+types/wear-history';

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route');
  const { user } = await requireAuth(request);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const itemId = url.searchParams.get('itemId');

  if (!itemId) {
    return { history: [], totalCount: 0, error: 'Item ID required' };
  }

  const { supabase } = createClient(request);

  const { data, count } = await supabase
    .from('wear_history')
    .select('id, worn_date, created_at, occasion_name, notes, weather', { count: 'exact' })
    .eq('item_id', itemId)
    .eq('user_id', user.id)
    .order('worn_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(0, limit - 1);

  return { history: data || [], totalCount: count || 0 };
}
