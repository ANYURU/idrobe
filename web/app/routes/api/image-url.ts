import type { Route } from "./+types/image-url";
import { createClient } from "@/lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const filePath = url.searchParams.get("path");
  
  if (!filePath || filePath.includes('undefined') || filePath.startsWith('http')) {
    return Response.json({ error: "Invalid file path" }, { status: 400 });
  }

  const { supabase } = createClient(request);
  
  const { data, error } = await supabase.storage
    .from('clothing')
    .createSignedUrl(filePath, 60 * 60);

  if (error || !data) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  return Response.json({ signedUrl: data.signedUrl });
}

export default function ImageUrl() {
  return null;
}