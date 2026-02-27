import { ComponentProps, forwardRef } from "react"

import { cn } from "@/lib/utils"

const Card = forwardRef<HTMLDivElement, ComponentProps<"div">>(({ className, style, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="card"
      className={cn(
        "premium-card text-[var(--text-primary)] flex flex-col gap-2 p-4",
        className
      )}
      style={style}
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
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-2",
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
      className={cn("leading-tight font-semibold text-[var(--text-base)] text-[var(--text-primary)]", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[var(--text-secondary)] text-[var(--text-sm)] leading-relaxed", className)}
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
      className={cn("", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center [.border-t]:pt-3", className)}
      {...props}
    />
  )
}

function CardGlass({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-[var(--surface-glass)] backdrop-blur-sm text-[var(--text-primary)] rounded-xl border border-[var(--border-subtle)] flex flex-col gap-2 p-4 transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-glass-hover)]",
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
        "bg-[var(--surface-2)] text-[var(--text-primary)] flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] p-3",
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
        "premium-section text-[var(--text-primary)] flex flex-col gap-3 p-4",
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
        "bg-[var(--surface-2)] text-[var(--text-primary)] flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] p-4",
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
        "bg-[var(--surface-2)] text-[var(--text-primary)] flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] p-4",
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
