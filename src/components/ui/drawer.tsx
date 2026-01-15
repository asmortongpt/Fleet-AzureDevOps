import { X as XIcon } from "lucide-react"
import { ComponentProps } from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

function Drawer({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  showClose = true,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Content> & { showClose?: boolean }) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content fixed z-50 flex h-auto flex-col",
          "bg-background/95 backdrop-blur-xl",
          // Bottom drawer
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0",
          "data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[85vh]",
          "data-[vaul-drawer-direction=bottom]:rounded-t-2xl data-[vaul-drawer-direction=bottom]:border-t",
          // Top drawer
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0",
          "data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[85vh]",
          "data-[vaul-drawer-direction=top]:rounded-b-2xl data-[vaul-drawer-direction=top]:border-b",
          // Right drawer
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0",
          "data-[vaul-drawer-direction=right]:w-[85vw] data-[vaul-drawer-direction=right]:sm:w-[400px] data-[vaul-drawer-direction=right]:sm:max-w-md",
          "data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:rounded-l-2xl",
          // Left drawer
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0",
          "data-[vaul-drawer-direction=left]:w-[85vw] data-[vaul-drawer-direction=left]:sm:w-[400px] data-[vaul-drawer-direction=left]:sm:max-w-md",
          "data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:rounded-r-2xl",
          // Border styling
          "border-border/50",
          className
        )}
        {...props}
      >
        {/* Drag handle for bottom drawer */}
        <div className="mx-auto mt-2 hidden h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20 group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />

        {/* Close button for side drawers */}
        {showClose && (
          <DrawerPrimitive.Close
            className={cn(
              "absolute top-4 right-4 rounded-lg p-2",
              "text-muted-foreground hover:text-foreground",
              "bg-muted/50 hover:bg-muted",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "hidden group-data-[vaul-drawer-direction=left]/drawer-content:block group-data-[vaul-drawer-direction=right]/drawer-content:block",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4"
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DrawerPrimitive.Close>
        )}

        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-1.5 p-2 sm:p-3",
        "border-b border-border/50",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "mt-auto flex flex-col gap-2 p-2 sm:p-3",
        "border-t border-border/50",
        className
      )}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-sm font-semibold text-foreground tracking-tight", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  )
}

// Scrollable body for drawer content
function DrawerBody({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-body"
      className={cn(
        "flex-1 overflow-y-auto p-2 sm:p-3",
        "overscroll-contain",
        className
      )}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
}
