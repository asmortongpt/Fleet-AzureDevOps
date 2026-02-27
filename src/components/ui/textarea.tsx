import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[var(--radius-md)] border px-3 py-2 text-[var(--text-base)]",
        "bg-[var(--surface-3)] text-[var(--text-primary)] border-[var(--border-default)]",
        "placeholder:text-[var(--text-muted)]",
        "transition-all duration-[var(--duration-fast)]",
        "focus:outline-none focus:border-[var(--border-focus)] focus:shadow-[0_0_0_2px_rgba(16,185,129,0.15)]",
        "hover:border-[var(--border-strong)]",
        "aria-invalid:border-[var(--status-danger)]/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
