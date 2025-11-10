import { toast } from 'sonner'

export function useToast() {
  return {
    success: (message: string, options?: { action?: { label: string; onClick: () => void } }) => 
      toast.success(message, options),
    error: (message: string, options?: { action?: { label: string; onClick: () => void } }) => 
      toast.error(message, options),
    info: (message: string) => toast.info(message),
    warning: (message: string) => toast.warning(message),
    loading: (message: string) => toast.loading(message),
    promise: toast.promise,
    dismiss: toast.dismiss
  }
}