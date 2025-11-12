import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ClientOnly } from '@/components/ClientOnly'
import { Toaster } from 'sonner'

import './index.css'

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning={true}>
        <ThemeProvider defaultTheme="warm" storageKey="idrobe-theme">
          <Outlet />
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