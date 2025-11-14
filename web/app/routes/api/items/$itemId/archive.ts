import { createClient } from '@/lib/supabase.server';
import type { Route } from './+types/archive';

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import('@/lib/protected-route');
  const { user } = await requireAuth(request);

  const { supabase } = createClient(request);

  const formData = await request.formData();

  const { error } = await supabase
    .from('clothing_items')
    .update({ is_archived: formData.get('isArchived') === 'true' })
    .eq('id', params.itemId)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: 'Failed to archive item' };
  }

  return {
    success: true,
    message: formData.get('isArchived') === 'true' ? 'Item archived successfully!' : 'Item unarchived successfully!',
  };
}
