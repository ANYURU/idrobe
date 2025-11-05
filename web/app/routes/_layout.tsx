import { Outlet, useLoaderData } from 'react-router'
import { requireAuth } from '@/lib/protected-route'
import { Sidebar } from '@/components/sidebar'

export async function loader({ request }: { request: Request }) {
  const { user } = await requireAuth(request)
  return { user }
}

export default function ProtectedLayout() {
  const { user } = useLoaderData<typeof loader>()
  
  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto md:ml-0">
        <Outlet />
      </main>
    </div>
  )
}