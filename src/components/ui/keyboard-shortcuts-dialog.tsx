import { X, Keyboard } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "./button"

import { cn } from "@/lib/utils"



interface ShortcutGroup {
  category: string
  shortcuts: Array<{
    keys: string[]
    description: string
  }>
}

export function KeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open dialog with ? key
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault()
        setIsOpen(true)
      }
      // Close dialog with Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
  const modKey = isMac ? "⌘" : "Ctrl"

  const shortcutGroups: ShortcutGroup[] = [
    {
      category: "Navigation",
      shortcuts: [
        { keys: [modKey, "K"], description: "Open search" },
        { keys: [modKey, "1-9"], description: "Switch between modules" },
        { keys: ["Escape"], description: "Close modal/dialog" },
        { keys: [modKey, "B"], description: "Toggle sidebar" },
      ],
    },
    {
      category: "Actions",
      shortcuts: [
        { keys: [modKey, "N"], description: "Create new item" },
        { keys: [modKey, "S"], description: "Save changes" },
        { keys: [modKey, "Enter"], description: "Submit form" },
      ],
    },
    {
      category: "Data Management",
      shortcuts: [
        { keys: [modKey, "F"], description: "Filter data" },
        { keys: [modKey, "E"], description: "Export data" },
        { keys: [modKey, "R"], description: "Refresh data" },
      ],
    },
    {
      category: "Help",
      shortcuts: [
        { keys: ["?"], description: "Show keyboard shortcuts" },
        { keys: [modKey, "/"], description: "Search help" },
      ],
    },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-labelledby="keyboard-shortcuts-title"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-lg shadow-lg border animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-primary" />
            <h2 id="keyboard-shortcuts-title" className="text-lg font-semibold">
              Keyboard Shortcuts
            </h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="touch-icon-btn"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {shortcutGroups.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className={cn(
                            "inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded border bg-muted text-xs font-mono font-medium",
                            "shadow-sm"
                          )}
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">?</kbd> to toggle
            this dialog
          </p>
        </div>
      </div>
    </>
  )
}

// Hook to control the dialog
export function useKeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return { isOpen, setIsOpen }
}
