import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border bg-[#1A0648] border-[rgba(0,204,254,0.15)] px-3 py-2 text-sm text-white font-['Montserrat',sans-serif] placeholder:text-[rgba(255,255,255,0.40)] transition-all duration-200 ease-out outline-none focus-visible:border-[#00CCFE] focus-visible:ring-2 focus-visible:ring-[#00CCFE]/20 focus-visible:ring-offset-0 hover:border-[rgba(0,204,254,0.3)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
