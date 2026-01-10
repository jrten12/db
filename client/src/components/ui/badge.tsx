import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // @replit
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          // Enhanced 3D effect with glow and depth
          "border-transparent bg-primary text-primary-foreground " +
          "shadow-[0_2px_8px_rgba(16,185,129,0.4),0_4px_16px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_2px_rgba(0,0,0,0.2)] " +
          "hover:shadow-[0_4px_12px_rgba(16,185,129,0.5),0_6px_20px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] " +
          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-0 before:hover:opacity-100 before:transition-opacity",
        secondary:
          // Enhanced with subtle metallic sheen
          "border-transparent bg-secondary text-secondary-foreground " +
          "shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.2)] " +
          "hover:shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] " +
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-black/10",
        destructive:
          // Enhanced with danger glow
          "border-transparent bg-destructive text-destructive-foreground " +
          "shadow-[0_2px_8px_rgba(239,68,68,0.4),0_4px_16px_rgba(239,68,68,0.2),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.2)] " +
          "hover:shadow-[0_4px_12px_rgba(239,68,68,0.5),0_6px_20px_rgba(239,68,68,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] " +
          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/15 before:to-transparent",
        outline:
          // Enhanced outline with subtle glow
          "text-foreground border-2 [border-color:var(--badge-outline)] " +
          "shadow-[0_2px_6px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.05)] " +
          "hover:shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.1)] " +
          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
