import { motion, HTMLMotionProps } from "framer-motion"
import { ComponentProps, forwardRef } from "react"

import { cn } from "@/lib/utils"

// Separate the motion props from HTML props
type CardProps = HTMLMotionProps<"div">

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      data-slot="card"
      className={cn(
        "bg-[var(--minimalist-bg-secondary)] border border-[var(--minimalist-border-subtle)] rounded-lg flex flex-col gap-2 py-2 transition-colors duration-150 hover:border-[var(--minimalist-border-medium)]",
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
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-2",
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
      className={cn("leading-tight font-semibold text-base", className)}
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
      className={cn("px-2", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-2 [.border-t]:pt-2", className)}
      {...props}
    />
  )
}

// Card variant for minimalist style (no glass effect)
function CardGlass({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-[var(--minimalist-bg-secondary)] border border-[var(--minimalist-border-subtle)] rounded-lg flex flex-col gap-2 py-2",
        "transition-colors duration-150 ease-out hover:border-[var(--minimalist-border-medium)]",
        className
      )}
      {...props}
    />
  )
}

// Compact card for dashboard stats - minimalist version
function CardCompact({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-[var(--minimalist-bg-secondary)] text-[var(--minimalist-text-primary)] flex flex-col gap-3 rounded-lg border border-[var(--minimalist-border-subtle)] p-2",
        "transition-all duration-150 ease-out",
        "hover:border-[var(--minimalist-border-medium)]",
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
}
