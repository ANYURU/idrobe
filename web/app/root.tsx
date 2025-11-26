import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRevalidator,
} from 'react-router'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ClientOnly } from '@/components/ClientOnly'
import { Toaster } from 'sonner'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase.server'

import './index.css'

export const meta = () => {
  const title = "Idrobe | AI Personal Stylist & Digital Closet";
  const description = "Turn your closet into a curated wardrobe. Idrobe uses AI to organize your clothes, plan daily outfits, and help you rediscover your personal style.";
  const url = "https://idrobe-web.vercel.app/";
  const image = "https://idrobe-web.vercel.app/og-image.png";

  return [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { title },
    { name: "description", content: description },
    
    // Open Graph
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:site_name", content: "Idrobe" },
    
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
};

export async function loader({ request }: { request: Request }) {
  const { supabase, headers } = createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    user,
    env: {
      SUPABASE_URL: process.env.VITE_SUPABASE_URL!,
      SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY!,
    },
    headers, // Propagate headers from createClient/getUser
  }
}

export default function Root({ loaderData }: { loaderData: Awaited<ReturnType<typeof loader>> }) {
  const { env, user } = loaderData
  const revalidator = useRevalidator()

  const [supabase] = useState(() =>
    createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  )

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Revalidate if the user ID changes (login/logout) or token refreshes
      // This ensures the server is always in sync with the client's auth state
      if (newSession?.user?.id !== user?.id || event === 'TOKEN_REFRESHED') {
        revalidator.revalidate()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, user, revalidator])

  return (
    <html lang="en">
      <head>
        <Meta />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <Links />
      </head>
      <body suppressHydrationWarning={true}>
        <ThemeProvider defaultTheme="warm" storageKey="idrobe-theme">
          <Outlet context={{ supabase, user }} />
        </ThemeProvider>
        <ClientOnly>
          <Toaster 
            position="top-right" 
            richColors 
            closeButton 
            duration={4000}
          />
        </ClientOnly>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}