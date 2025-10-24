import type { Route } from "./+types/_index";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route');
  await requireAuth(request);
  return null;
}

export default function Trends() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Fashion Trends</h1>
      <p className="text-gray-600 mt-2">Discover the latest fashion trends</p>
    </div>
  )
}