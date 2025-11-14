import { createClient } from '@/lib/supabase.server';
import type { Route } from './+types/worn';

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import('@/lib/protected-route');
  await requireAuth(request);

  const { supabase } = createClient(request);

  const { error } = await supabase.rpc('mark_item_worn', {
    p_item_id: params.itemId,
  });

  if (error) {
    return { success: false, error: error.message || 'Failed to mark item as worn' };
  }

  return {
    success: true,
    message: 'Item marked as worn today!',
  };
}
