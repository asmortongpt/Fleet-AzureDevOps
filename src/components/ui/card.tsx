import { ComponentProps, forwardRef } from "react"

import { cn } from "@/lib/utils"

const Card = forwardRef<HTMLDivElement, ComponentProps<"div">>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="card"
      className={cn(
        "bg-[#221060] text-card-foreground border border-[rgba(0,204,254,0.08)] rounded-xl flex flex-col gap-2 py-3 px-3 shadow-[0_1px_3px_rgba(26,6,72,0.3)] hover:border-[rgba(0,204,254,0.15)] hover:shadow-[0_4px_12px_rgba(26,6,72,0.4)] transition-all duration-200",
        className
      )}
      {...props}
    />
  )
})

Card.displayName = "Card"

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-3 font-['Montserrat',sans-serif] has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-2",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-tight font-semibold text-base text-white", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[rgba(255,255,255,0.65)] font-['Montserrat',sans-serif] text-sm leading-relaxed", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-3 border-t border-[rgba(0,204,254,0.08)] [.border-t]:pt-2", className)}
      {...props}
    />
  )
}

function CardGlass({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-[#221060] text-card-foreground border border-[rgba(0,204,254,0.08)] rounded-xl flex flex-col gap-2 py-2",
        "transition-all duration-200 hover:border-[rgba(0,204,254,0.15)] hover:shadow-[0_4px_12px_rgba(26,6,72,0.4)] shadow-[0_1px_3px_rgba(26,6,72,0.3)]",
        className
      )}
      {...props}
    />
  )
}

function CardCompact({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-[#221060] text-card-foreground flex flex-col gap-3 rounded-xl border border-[rgba(0,204,254,0.08)] p-3",
        "transition-all duration-200",
        "hover:border-[rgba(0,204,254,0.15)] hover:shadow-[0_4px_12px_rgba(26,6,72,0.4)] shadow-[0_1px_3px_rgba(26,6,72,0.3)]",
        className
      )}
      {...props}
    />
  )
}

function CardPremium({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-premium"
      className={cn(
        "bg-[#221060] text-card-foreground flex flex-col gap-3 rounded-xl border border-[rgba(0,204,254,0.08)]",
        "relative overflow-hidden",
        "shadow-[0_1px_3px_rgba(26,6,72,0.3)] hover:border-[rgba(0,204,254,0.15)] hover:shadow-[0_4px_12px_rgba(26,6,72,0.4)] transition-all duration-200 p-4",
        className
      )}
      {...props}
    />
  )
}

function CardOrangeAccent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-orange-accent"
      className={cn(
        "bg-[#221060] text-card-foreground flex flex-col gap-3 rounded-xl border-l-4 border-l-white/20 border border-[rgba(0,204,254,0.08)] p-4",
        "shadow-[0_1px_3px_rgba(26,6,72,0.3)] hover:border-[rgba(0,204,254,0.15)] hover:shadow-[0_4px_12px_rgba(26,6,72,0.4)] transition-all duration-200",
        className
      )}
      {...props}
    />
  )
}

function CardGoldAccent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-gold-accent"
      className={cn(
        "bg-[#221060] text-card-foreground flex flex-col gap-3 rounded-xl border-l-4 border-l-white/15 border border-[rgba(0,204,254,0.08)] p-4",
        "shadow-[0_1px_3px_rgba(26,6,72,0.3)] hover:border-[rgba(0,204,254,0.15)] hover:shadow-[0_4px_12px_rgba(26,6,72,0.4)] transition-all duration-200",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardGlass,
  CardCompact,
  CardPremium,
  CardOrangeAccent,
  CardGoldAccent,
}
