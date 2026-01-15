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
      "relative flex w-full touch-none select-none items-center py-2 cursor-pointer group",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-3 md:h-4 w-full grow overflow-hidden rounded-full bg-slate-700/80 shadow-inner shadow-black/30">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-7 w-7 md:h-8 md:w-8 rounded-full bg-white shadow-xl shadow-black/40 ring-2 ring-white/20 transition-all duration-150 hover:scale-110 hover:ring-purple-400/50 hover:shadow-purple-400/30 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/50 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
