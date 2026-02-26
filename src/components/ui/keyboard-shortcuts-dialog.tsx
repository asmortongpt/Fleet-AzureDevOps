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
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault()
        setIsOpen(true)
      }
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
        { keys: [modKey, "K"], description: "Open command palette" },
        { keys: ["1–5"], description: "Switch between hubs" },
        { keys: ["["], description: "Toggle sidebar" },
        { keys: ["/"], description: "Focus search" },
        { keys: ["Escape"], description: "Close panel / modal" },
      ],
    },
    {
      category: "Actions",
      shortcuts: [
        { keys: ["N"], description: "New item (context-sensitive)" },
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-labelledby="keyboard-shortcuts-title"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#221060] rounded-xl shadow-[0_8px_24px_rgba(26,6,72,0.5)] border border-[rgba(0,204,254,0.15)] animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#221060] border-b border-[rgba(0,204,254,0.08)] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="w-4 h-4 text-[#00CCFE]" />
            <h2
              id="keyboard-shortcuts-title"
              className="text-sm font-semibold text-white"
              style={{ fontFamily: '"Montserrat", sans-serif' }}
            >
              Keyboard Shortcuts
            </h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="text-[rgba(255,255,255,0.40)] hover:text-white hover:bg-[#2A1878]"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Gradient accent */}
        <div className="h-[3px] bg-gradient-to-r from-[#00CCFE]/30 via-[#1F3076]/20 to-transparent" />

        {/* Content */}
        <div className="p-4 space-y-4">
          {shortcutGroups.map((group) => (
            <div key={group.category}>
              <h3
                className="text-[10px] font-medium uppercase tracking-[0.15em] text-[rgba(255,255,255,0.40)] mb-3"
                style={{ fontFamily: '"Montserrat", sans-serif' }}
              >
                {group.category}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#2A1878] transition-colors"
                  >
                    <span className="text-sm text-[rgba(255,255,255,0.65)]">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className={cn(
                            "inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md border border-[rgba(0,204,254,0.15)] bg-[#1A0648] text-xs font-mono font-medium text-[rgba(255,255,255,0.65)]",
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
        <div className="border-t border-[rgba(0,204,254,0.08)] px-4 py-2.5 bg-[#1A0648]/50">
          <p className="text-xs text-[rgba(255,255,255,0.40)] text-center">
            Press <kbd className="px-1.5 py-0.5 rounded-md bg-[#1A0648] text-xs font-mono border border-[rgba(0,204,254,0.15)] text-[rgba(255,255,255,0.65)]">?</kbd> to toggle
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
