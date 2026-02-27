

import * as TabsPrimitive from "@radix-ui/react-tabs"
import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-[var(--surface-glass)] text-[var(--text-tertiary)] inline-flex min-h-8 h-auto w-fit items-center justify-center rounded-lg p-1 gap-0.5",
        "border border-[var(--border-subtle)]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles
        "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2",
        "text-sm font-medium whitespace-nowrap",
        "transition-all duration-200 ease-out",
        // Default state
        "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-glass)]",
        // Active state
        "data-[state=active]:bg-[var(--surface-3)] data-[state=active]:text-[var(--text-primary)]",
        "data-[state=active]:border data-[state=active]:border-[var(--border-subtle)]",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",
        // SVG handling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none mt-2",
        "data-[state=active]:animate-fade-in",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
}

// Underline variant tabs for hub pages
function TabsListUnderline({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 items-center gap-2 border-b border-[var(--border-subtle)]",
        "overflow-x-auto no-scrollbar",
        className
      )}
      {...props}
    />
  )
}

function TabsTriggerUnderline({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles
        "relative inline-flex h-full items-center justify-center gap-2 px-1 pb-3",
        "text-sm font-medium whitespace-nowrap",
        "transition-colors duration-200",
        // Default state
        "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
        // Active state
        "data-[state=active]:text-[var(--text-primary)]",
        // Underline indicator — emerald accent
        "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
        "after:bg-emerald-500 after:rounded-full after:transition-transform after:duration-200",
        "after:scale-x-0 data-[state=active]:after:scale-x-100",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-md",
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",
        // SVG handling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

// Pill variant for compact tabs
function TabsListPill({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.04]",
        className
      )}
      {...props}
    />
  )
}

function TabsTriggerPill({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles
        "inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-full",
        "text-xs font-medium whitespace-nowrap",
        "transition-all duration-200",
        // Default state
        "text-muted-foreground hover:text-foreground",
        // Active state
        "data-[state=active]:bg-white/[0.08] data-[state=active]:text-white",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",
        // SVG handling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsListUnderline,
  TabsTriggerUnderline,
  TabsListPill,
  TabsTriggerPill
}
