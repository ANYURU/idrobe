import { useFetcher } from 'react-router'
import { useEffect, useRef } from 'react'
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
  const { error: showError, success: showSuccess } = useToast()

  const lastDataRef = useRef<ActionResponse<TData> | undefined>(undefined)

  // Handle toast notifications based on response
  useEffect(() => {
    if (fetcher.data && fetcher.data !== lastDataRef.current) {
      lastDataRef.current = fetcher.data
      
      if (fetcher.data.error) {
        showError(fetcher.data.error, {
          action: fetcher.formData ? {
            label: 'Retry',
            onClick: () => fetcher.submit(fetcher.formData!, { method: 'post' })
          } : undefined
        })
      } else if (fetcher.data.success && fetcher.data.message) {
        showSuccess(fetcher.data.message)
      }
    }
  }, [fetcher.data, fetcher.formData, showError, showSuccess])

  const submit = (data: FormData | Record<string, string | number | boolean | string[]>, options?: {
    method?: 'post' | 'put' | 'patch' | 'delete'
    action?: string
  }) => {
    let formData: FormData
    
    if (data instanceof FormData) {
      // Use the existing FormData directly
      formData = data
    } else {
      // Create new FormData from object
      formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            // Handle arrays by adding multiple entries with the same key
            value.forEach(item => formData.append(key, String(item)))
          } else {
            const stringValue = typeof value === 'string' ? value : String(value)
            formData.append(key, stringValue)
          }
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