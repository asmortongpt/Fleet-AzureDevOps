import { ComponentProps, forwardRef } from "react"

import { cn } from "@/lib/utils"

const Card = forwardRef<HTMLDivElement, ComponentProps<"div">>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground border border-white/[0.08] rounded-lg flex flex-col gap-2 py-3 px-3 shadow-sm",
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
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-2",
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
      className={cn("leading-tight font-semibold text-base text-foreground", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm leading-relaxed", className)}
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
      className={cn("flex items-center px-3 [.border-t]:pt-2", className)}
      {...props}
    />
  )
}

function CardGlass({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground border border-border rounded-lg flex flex-col gap-2 py-2",
        "transition-colors duration-150 hover:border-border/80 shadow-sm",
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
        "bg-card text-card-foreground flex flex-col gap-3 rounded-lg border border-border p-3",
        "transition-all duration-150",
        "hover:border-border/80 shadow-sm",
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
        "bg-card text-card-foreground flex flex-col gap-3 rounded-lg border border-white/[0.08]",
        "relative overflow-hidden",
        "shadow-sm p-4",
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
        "bg-card text-card-foreground flex flex-col gap-3 rounded-lg border-l-4 border-l-white/20 border border-white/[0.08] p-4",
        "shadow-sm",
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
        "bg-card text-card-foreground flex flex-col gap-3 rounded-lg border-l-4 border-l-white/15 border border-white/[0.08] p-4",
        "shadow-sm",
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
