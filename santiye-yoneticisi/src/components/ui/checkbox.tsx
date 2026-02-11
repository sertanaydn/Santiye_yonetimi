
"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps {
    className?: string
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    id?: string
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
    ({ className, checked, onCheckedChange, id, ...props }, ref) => {
        return (
            <button
                type="button"
                id={id}
                role="checkbox"
                aria-checked={checked}
                onClick={() => onCheckedChange?.(!checked)}
                className={cn(
                    "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground flex items-center justify-center",
                    className
                )}
                data-state={checked ? "checked" : "unchecked"}
                ref={ref}
                {...props}
            >
                {checked && <Check className="h-3 w-3 text-white" />}
            </button>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
