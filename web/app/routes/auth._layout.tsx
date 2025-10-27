import { Outlet } from "react-router";
import { redirect } from "react-router";
import { createClient } from "@/lib/supabase.server";

export async function loader({ request }: { request: Request }) {
  const { supabase } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    throw redirect("/");
  }

  return { user: null };
}

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <Outlet />
    </div>
  );
}
