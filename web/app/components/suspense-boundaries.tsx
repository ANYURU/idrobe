import { Suspense } from 'react'
import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Loading skeleton for cards
 */
export function CardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading skeleton for grid items
 */
export function GridItemSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-slate-200 rounded-lg mb-3"></div>
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
    </div>
  )
}

/**
 * Loading skeleton for list items
 */
export function ListItemSkeleton() {
  return (
    <div className="animate-pulse flex gap-4">
      <div className="h-12 w-12 bg-slate-200 rounded-lg shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>
  )
}

/**
 * Suspense boundary for cards
 */
export function CardSuspense({
  children,
  fallback = <CardSkeleton />,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}

/**
 * Suspense boundary for grid items
 */
export function GridSuspense({
  children,
  count = 6,
}: {
  children: ReactNode
  count?: number
}) {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(count)].map((_, i) => (
            <GridItemSkeleton key={i} />
          ))}
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

/**
 * Suspense boundary for list items
 */
export function ListSuspense({
  children,
  count = 5,
}: {
  children: ReactNode
  count?: number
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {[...Array(count)].map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

/**
 * Suspense boundary for full page
 */
export function PageSuspense({
  children,
}: {
  children: ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
