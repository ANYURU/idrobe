import { useFetcher } from 'react-router'
import { useEffect } from 'react'
import { useToast } from '@/lib/use-toast'

// Standardized response format for all actions
export interface ActionResponse<TData = unknown> {
  success?: boolean
  error?: string
  message?: string
  data?: TData
}

export function useActionWithToast<TData = unknown>(actionUrl?: string) {
  const fetcher = useFetcher<ActionResponse<TData>>()
  const toast = useToast()

  // Handle toast notifications based on response
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.error) {
        toast.error(fetcher.data.error, {
          action: fetcher.formData ? {
            label: 'Retry',
            onClick: () => fetcher.submit(fetcher.formData!, { method: 'post' })
          } : undefined
        })
      } else if (fetcher.data.success && fetcher.data.message) {
        toast.success(fetcher.data.message)
      }
    }
  }, [fetcher.data, toast])

  const submit = (data: FormData | Record<string, string | number | boolean>, options?: {
    method?: 'post' | 'put' | 'patch' | 'delete'
    action?: string
  }) => {
    const formData = data instanceof FormData ? data : new FormData()
    
    if (!(data instanceof FormData)) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const stringValue = typeof value === 'string' ? value : String(value)
          formData.append(key, stringValue)
        }
      })
    }

    fetcher.submit(formData, {
      method: options?.method || 'post',
      action: options?.action || actionUrl
    })
  }

  return {
    submit,
    data: fetcher.data?.data,
    isLoading: fetcher.state === 'submitting' || fetcher.state === 'loading',
    isSubmitting: fetcher.state === 'submitting',
    error: fetcher.data?.error,
    success: fetcher.data?.success,
    reset: () => fetcher.load('/api/reset') // Dummy load to reset state
  }
}