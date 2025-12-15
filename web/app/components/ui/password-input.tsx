import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const disabled = !props.value || props.value === ""

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer disabled:opacity-50"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled || props.disabled}
          tabIndex={-1}
        >
          <div className="relative w-4 h-4">
            <EyeOff 
              className={cn(
                "h-4 w-4 text-muted-foreground absolute inset-0 transition-all duration-200",
                showPassword ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
              )} 
              aria-hidden="true" 
            />
            <Eye 
              className={cn(
                "h-4 w-4 text-muted-foreground absolute inset-0 transition-all duration-200",
                showPassword ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
              )} 
              aria-hidden="true" 
            />
          </div>
          <span className="sr-only">
            {showPassword ? "Hide password" : "Show password"}
          </span>
        </Button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
