import React from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import {
  MapPin, Edit, FileText, UserPlus, History, Download, Archive,
  User, MessageSquare, Car, Clock, BarChart3,
  Eye, ArrowRightLeft, Printer, Copy, Trash2
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type EntityType = 'vehicle' | 'driver' | 'work-order'

interface EntityContextMenuProps {
  entityType: EntityType
  entityId: string
  entityName?: string
  children: React.ReactNode
  onAction?: (action: string, entityId: string) => void
}

interface MenuAction {
  type: 'item' | 'separator'
  action?: string
  label?: string
  icon?: LucideIcon
  destructive?: boolean
}

const vehicleActions: MenuAction[] = [
  { type: 'item', action: 'locate-on-map', label: 'Locate on Map', icon: MapPin },
  { type: 'item', action: 'edit-vehicle', label: 'Edit Vehicle', icon: Edit },
  { type: 'item', action: 'create-work-order', label: 'Create Work Order', icon: FileText },
  { type: 'item', action: 'assign-driver', label: 'Assign Driver', icon: UserPlus },
  { type: 'separator' },
  { type: 'item', action: 'view-history', label: 'View History', icon: History },
  { type: 'item', action: 'export-data', label: 'Export Data', icon: Download },
  { type: 'separator' },
  { type: 'item', action: 'archive', label: 'Archive', icon: Archive, destructive: true },
]

const driverActions: MenuAction[] = [
  { type: 'item', action: 'view-profile', label: 'View Profile', icon: User },
  { type: 'item', action: 'send-message', label: 'Send Message', icon: MessageSquare },
  { type: 'item', action: 'assign-vehicle', label: 'Assign Vehicle', icon: Car },
  { type: 'separator' },
  { type: 'item', action: 'view-hos', label: 'View HOS', icon: Clock },
  { type: 'item', action: 'performance-report', label: 'Performance Report', icon: BarChart3 },
]

const workOrderActions: MenuAction[] = [
  { type: 'item', action: 'view-details', label: 'View Details', icon: Eye },
  { type: 'item', action: 'change-status', label: 'Change Status', icon: ArrowRightLeft },
  { type: 'item', action: 'assign-technician', label: 'Assign Technician', icon: UserPlus },
  { type: 'separator' },
  { type: 'item', action: 'print', label: 'Print', icon: Printer },
  { type: 'item', action: 'duplicate', label: 'Duplicate', icon: Copy },
  { type: 'separator' },
  { type: 'item', action: 'delete', label: 'Delete', icon: Trash2, destructive: true },
]

const actionsByType: Record<EntityType, MenuAction[]> = {
  vehicle: vehicleActions,
  driver: driverActions,
  'work-order': workOrderActions,
}

const entityTypeLabels: Record<EntityType, string> = {
  vehicle: 'Vehicle',
  driver: 'Driver',
  'work-order': 'Work Order',
}

export function EntityContextMenu({
  entityType,
  entityId,
  entityName,
  children,
  onAction,
}: EntityContextMenuProps) {
  const actions = actionsByType[entityType]
  const label = entityName || `${entityTypeLabels[entityType]} ${entityId}`

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] p-1 min-w-[200px] z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <ContextMenu.Label
            className="px-3 py-1.5 text-xs font-medium text-[rgba(255,255,255,0.40)] uppercase tracking-wider"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {label}
          </ContextMenu.Label>

          {actions.map((item, index) => {
            if (item.type === 'separator') {
              return (
                <ContextMenu.Separator
                  key={`sep-${index}`}
                  className="h-px bg-[rgba(255,255,255,0.06)] my-1 mx-2"
                />
              )
            }

            const Icon = item.icon!

            return (
              <ContextMenu.Item
                key={item.action}
                className={
                  item.destructive
                    ? 'rounded-lg px-3 py-2 text-sm cursor-pointer outline-none flex items-center gap-3 text-[#FF4300] data-[highlighted]:bg-[#242424] data-[highlighted]:text-[#FF4300]'
                    : 'rounded-lg px-3 py-2 text-sm cursor-pointer outline-none flex items-center gap-3 text-[rgba(255,255,255,0.85)] data-[highlighted]:bg-[#242424] data-[highlighted]:text-white'
                }
                onSelect={() => onAction?.(item.action!, entityId)}
              >
                <Icon
                  className={
                    item.destructive
                      ? 'w-4 h-4 text-[#FF4300]'
                      : 'w-4 h-4 text-[rgba(255,255,255,0.40)]'
                  }
                />
                {item.label}
              </ContextMenu.Item>
            )
          })}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

export default EntityContextMenu
