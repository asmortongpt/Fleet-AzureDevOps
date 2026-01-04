import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-2xl border border-border/50 py-6 shadow-sm",
        "transition-all duration-300 ease-out",
        "hover:shadow-md hover:border-border/70",
        className
      )}
      {...props}
    />
  )
}

interface CardInteractiveProps extends ComponentProps<"div"> {
  onClick?: () => void
}

function CardInteractive({ className, onClick, ...props }: CardInteractiveProps) {
  return (
    <div
      data-slot="card"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-2xl border border-border/50 py-6 shadow-sm",
        "transition-all duration-300 ease-out",
        onClick && [
          "cursor-pointer",
          "hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5",
          "active:translate-y-0 active:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        ],
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
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
      className={cn("leading-tight font-semibold text-lg", className)}
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
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

// Card variant for glass/frosted effect
function CardGlass({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card/80 backdrop-blur-xl text-card-foreground flex flex-col gap-6 rounded-2xl border border-border/30 py-6 shadow-lg",
        "transition-all duration-300 ease-out",
        className
      )}
      {...props}
    />
  )
}

// Compact card for dashboard stats
function CardCompact({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-3 rounded-xl border border-border/50 p-4 shadow-sm",
        "transition-all duration-200 ease-out",
        "hover:shadow-md hover:border-border/70",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardInteractive,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardGlass,
  CardCompact,
}
