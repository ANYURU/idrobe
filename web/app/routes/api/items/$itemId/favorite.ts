import { createClient } from '@/lib/supabase.server';
import type { Route } from './+types/favorite';

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import('@/lib/protected-route');
  const { user } = await requireAuth(request);

  const { supabase } = createClient(request);

  const formData = await request.formData();

  const { error } = await supabase
    .from('clothing_items')
    .update({ is_favorite: formData.get('isFavorite') === 'true' })
    .eq('id', params.itemId)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: 'Failed to update favorite' };
  }

  return {
    success: true,
    message: formData.get('isFavorite') === 'true' ? 'Item added to favorites!' : 'Item removed from favorites!',
    isFavorite: formData.get('isFavorite') === 'true',
  };
}
