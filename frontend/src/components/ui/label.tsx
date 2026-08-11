import * as React from "react"
import { cn } from "../../utils/cn"

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-primary",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
