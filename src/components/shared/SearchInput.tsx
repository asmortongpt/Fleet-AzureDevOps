import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { MagnifyingGlass, X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/useDebounce"

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  onDebouncedChange?: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
  ariaLabel?: string
  id?: string
  disabled?: boolean
}

/**
 * Accessible search input with debouncing and clear button
 *
 * Features:
 * - Debounced onChange for expensive operations
 * - Built-in clear button
 * - Proper ARIA labels
 * - Search icon
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   onDebouncedChange={performSearch}
 *   placeholder="Search vehicles..."
 *   ariaLabel="Search fleet vehicles"
 * />
 * ```
 */
export function SearchInput({
  value: controlledValue,
  onChange,
  onDebouncedChange,
  placeholder = "Search...",
  debounceMs = 300,
  className,
  ariaLabel,
  id,
  disabled = false
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || "")
  const debouncedValue = useDebounce(internalValue, debounceMs)

  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== internalValue) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue])

  // Call debounced callback
  useEffect(() => {
    if (onDebouncedChange) {
      onDebouncedChange(debouncedValue)
    }
  }, [debouncedValue, onDebouncedChange])

  const handleChange = (newValue: string) => {
    setInternalValue(newValue)
    onChange(newValue)
  }

  const handleClear = () => {
    setInternalValue("")
    onChange("")
    if (onDebouncedChange) {
      onDebouncedChange("")
    }
  }

  const showClearButton = internalValue.length > 0

  return (
    <div className={cn("relative flex-1", className)}>
      <MagnifyingGlass
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <Input
        id={id}
        type="search"
        value={internalValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={cn("pl-9", showClearButton && "pr-9")}
        aria-label={ariaLabel || placeholder}
        disabled={disabled}
        role="searchbox"
        autoComplete="off"
      />
      {showClearButton && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
          aria-label="Clear search"
          disabled={disabled}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
