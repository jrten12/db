import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center py-2 cursor-pointer group z-10",
      className
    )}
    data-no-click-sound
    {...props}
  >
    <SliderPrimitive.Track className="relative h-3 md:h-4 w-full grow overflow-hidden rounded-full bg-[hsl(25_20%_18%)] shadow-inner shadow-black/30 border border-[rgba(180,140,70,0.2)]">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-[hsl(38_55%_38%)] to-[hsl(145_48%_36%)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-7 w-7 md:h-8 md:w-8 rounded-full bg-[hsl(40_35%_92%)] shadow-lg shadow-black/35 ring-2 ring-[rgba(212,175,55,0.35)] transition-all duration-150 hover:scale-110 hover:ring-[rgba(212,175,55,0.55)] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(212,175,55,0.4)] disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing z-20" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
