import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-current border-t-transparent",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12",
        xl: "h-16 w-16"
      },
      variant: {
        default: "text-primary",
        secondary: "text-secondary-foreground",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
        success: "text-green-500",
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
)

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  text?: string
  centered?: boolean
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, text, centered = false, ...props }, ref) => {
    const spinner = (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, variant, className }))}
        {...props}
      />
    )

    if (text) {
      return (
        <div className={cn(
          "flex items-center gap-2",
          centered && "justify-center"
        )}>
          {spinner}
          <span className="text-sm text-muted-foreground">{text}</span>
        </div>
      )
    }

    if (centered) {
      return (
        <div className="flex items-center justify-center">
          {spinner}
        </div>
      )
    }

    return spinner
  }
)

LoadingSpinner.displayName = "LoadingSpinner"

export { LoadingSpinner, spinnerVariants }
