import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import type { FilterCondition } from '@/hooks/use-saved-views'

interface FilterPillProps {
  filter: FilterCondition
  fields: { value: string; label: string }[]
  onUpdate: (filter: FilterCondition) => void
  onRemove: (id: string) => void
}

const OPERATORS: { value: FilterCondition['operator']; label: string }[] = [
  { value: 'equals', label: 'equals' },
  { value: 'contains', label: 'contains' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
  { value: 'between', label: 'between' },
  { value: 'in', label: 'in' },
]

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ref, onClose])
}

export function FilterPill({ filter, fields, onUpdate, onRemove }: FilterPillProps) {
  const [fieldOpen, setFieldOpen] = useState(false)
  const [operatorOpen, setOperatorOpen] = useState(false)
  const [editingValue, setEditingValue] = useState(false)
  const [valueInput, setValueInput] = useState(
    Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value)
  )

  const fieldRef = useRef<HTMLDivElement>(null)
  const operatorRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef<HTMLDivElement>(null)

  useClickOutside(fieldRef, () => setFieldOpen(false))
  useClickOutside(operatorRef, () => setOperatorOpen(false))
  useClickOutside(valueRef, () => {
    if (editingValue) {
      commitValue()
      setEditingValue(false)
    }
  })

  const fieldLabel = fields.find((f) => f.value === filter.field)?.label ?? filter.field
  const operatorLabel = OPERATORS.find((o) => o.value === filter.operator)?.label ?? filter.operator

  function commitValue() {
    const trimmed = valueInput.trim()
    let newValue: string | number | string[] = trimmed
    if (filter.operator === 'in' || filter.operator === 'between') {
      newValue = trimmed.split(',').map((s) => s.trim()).filter(Boolean)
    } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
      newValue = Number(trimmed)
    }
    onUpdate({ ...filter, value: newValue })
  }

  function handleFieldSelect(value: string) {
    onUpdate({ ...filter, field: value })
    setFieldOpen(false)
  }

  function handleOperatorSelect(value: FilterCondition['operator']) {
    onUpdate({ ...filter, operator: value })
    setOperatorOpen(false)
  }

  function handleValueKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      commitValue()
      setEditingValue(false)
    }
    if (e.key === 'Escape') {
      setValueInput(
        Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value)
      )
      setEditingValue(false)
    }
  }

  const displayValue = Array.isArray(filter.value)
    ? filter.value.join(', ')
    : String(filter.value)

  return (
    <div
      className="inline-flex items-center gap-1 bg-[#2A1878] border border-[rgba(0,204,254,0.15)] rounded-full pl-3 pr-1 py-1 text-sm"
      style={{ fontFamily: 'Montserrat, sans-serif' }}
    >
      {/* Field selector */}
      <div ref={fieldRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setFieldOpen(!fieldOpen)
            setOperatorOpen(false)
          }}
          className="inline-flex items-center gap-0.5 text-[#00CCFE] font-medium hover:opacity-80 transition-opacity"
        >
          {fieldLabel}
          <ChevronDown className="w-3 h-3" />
        </button>
        {fieldOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-[#221060] border border-[rgba(0,204,254,0.15)] rounded-xl shadow-[0_8px_24px_rgba(26,6,72,0.5)] p-1 min-w-[140px]">
            {fields.map((f) => (
              <div
                key={f.value}
                onClick={() => handleFieldSelect(f.value)}
                className="px-3 py-1.5 rounded-lg hover:bg-[#2A1878] cursor-pointer text-[rgba(255,255,255,0.85)] whitespace-nowrap"
              >
                {f.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Operator selector */}
      <div ref={operatorRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setOperatorOpen(!operatorOpen)
            setFieldOpen(false)
          }}
          className="inline-flex items-center gap-0.5 text-[rgba(255,255,255,0.40)] hover:text-[rgba(255,255,255,0.60)] transition-colors"
        >
          {operatorLabel}
          <ChevronDown className="w-3 h-3" />
        </button>
        {operatorOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-[#221060] border border-[rgba(0,204,254,0.15)] rounded-xl shadow-[0_8px_24px_rgba(26,6,72,0.5)] p-1 min-w-[120px]">
            {OPERATORS.map((op) => (
              <div
                key={op.value}
                onClick={() => handleOperatorSelect(op.value)}
                className="px-3 py-1.5 rounded-lg hover:bg-[#2A1878] cursor-pointer text-[rgba(255,255,255,0.85)] whitespace-nowrap"
              >
                {op.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Value display / editor */}
      <div ref={valueRef} className="relative">
        {editingValue ? (
          <input
            type="text"
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            onKeyDown={handleValueKeyDown}
            autoFocus
            className="bg-transparent border-b border-[rgba(0,204,254,0.3)] text-white outline-none px-1 py-0 text-sm w-[100px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingValue(true)}
            className="text-white hover:text-[#00CCFE] transition-colors px-1"
          >
            {displayValue || (
              <span className="text-[rgba(255,255,255,0.25)] italic">value</span>
            )}
          </button>
        )}
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(filter.id)}
        className="rounded-full p-0.5 hover:bg-[#FF4300]/20 hover:text-[#FF4300] text-[rgba(255,255,255,0.40)] transition-colors ml-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
