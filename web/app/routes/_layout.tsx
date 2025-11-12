import { Outlet, useLoaderData } from 'react-router'
import { requireAuth } from '@/lib/protected-route'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

export async function loader({ request }: { request: Request }) {
  const { user } = await requireAuth(request)
  return { user }
}

export default function ProtectedLayout() {
  const { user } = useLoaderData<typeof loader>()
  
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}