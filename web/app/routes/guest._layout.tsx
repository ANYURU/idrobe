import { Outlet } from "react-router";
import { redirect } from "react-router";
import { PublicNavbar } from "@/components/public-navbar";
import { createClient } from "@/lib/supabase.server";

export async function loader({ request }: { request: Request }) {
  const { supabase } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    throw redirect("/dashboard");
  }

  return { user: null };
}

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
