import type { Route } from "./+types/settings";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('@/lib/protected-route');
  await requireAuth(request);
  return null;
}

export default function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-gray-600 mt-2">Manage your account settings</p>
    </div>
  )
}