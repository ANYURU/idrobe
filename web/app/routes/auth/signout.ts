import { redirect } from 'react-router';
import { createClient } from '@/lib/supabase.server';
import type { Route } from './+types/signout';

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  await supabase.auth.signOut();
  throw redirect('/auth/login');
}