import { CaretUp, CaretDown } from "@phosphor-icons/react"
import { SortDirection } from "./types"

interface SortIconProps {
  field: string
  currentField: string
  direction: SortDirection
}

export function SortIcon({ field, currentField, direction }: SortIconProps) {
  if (field !== currentField) return null

  return direction === "asc" ? (
    <CaretUp className="w-4 h-4 inline ml-1" aria-label="Sorted ascending" />
  ) : (
    <CaretDown className="w-4 h-4 inline ml-1" aria-label="Sorted descending" />
  )
}
