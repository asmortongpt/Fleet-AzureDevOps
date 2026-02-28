

import * as SwitchPrimitive from "@radix-ui/react-switch"
import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-[#00CCFE] data-[state=unchecked]:bg-[#1a1a1a] focus-visible:border-[#00CCFE] focus-visible:ring-[#00CCFE]/50 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-[rgba(255,255,255,0.08)] shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-white data-[state=checked]:bg-[#111111] pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
