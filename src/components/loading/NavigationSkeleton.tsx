import { Skeleton } from '@/components/ui/skeleton'

/**
 * Navigation Skeleton Components - Fixed dimensions for CLS prevention
 * Prevents layout shift during navigation menu hydration
 */

/**
 * SidebarSkeleton - Main navigation sidebar
 * Fixed Width: 256px (w-64), Full Height
 */
export function SidebarSkeleton() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r z-50">
      {/* Logo/Header Area - Fixed Height: 80px */}
      <div className="h-20 p-6 flex items-center border-b">
        <Skeleton className="h-8 w-40" />
      </div>

      {/* Navigation Sections */}
      <div className="p-4 space-y-6 h-[calc(100vh-160px)] overflow-hidden">
        {/* Section 1: Main */}
        <NavSectionSkeleton items={6} />

        {/* Section 2: Management */}
        <NavSectionSkeleton items={8} />

        {/* Section 3: Procurement */}
        <NavSectionSkeleton items={5} />

        {/* Section 4: Communication */}
        <NavSectionSkeleton items={4} />

        {/* Section 5: Tools */}
        <NavSectionSkeleton items={7} />
      </div>

      {/* Footer - Fixed Height: 80px */}
      <div className="absolute bottom-0 left-0 right-0 h-20 p-4 border-t bg-card">
        <Skeleton className="h-10 w-full" />
      </div>
    </aside>
  )
}

/**
 * NavSectionSkeleton - Single navigation section with items
 */
function NavSectionSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {/* Section Label */}
      <Skeleton className="h-3 w-20 mb-3" />

      {/* Nav Items - Fixed Height: 40px each */}
      {[...Array(items)].map((_, i) => (
        <div key={i} className="h-10 flex items-center gap-2 px-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-32 flex-1" />
        </div>
      ))}
    </div>
  )
}

/**
 * HeaderSkeleton - Top navigation bar
 * Fixed Height: 64px
 */
export function HeaderSkeleton() {
  return (
    <header className="h-16 border-b bg-card sticky top-0 z-40">
      <div className="px-6 h-full flex items-center justify-between">
        {/* Left Side - Menu + Title */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </header>
  )
}

/**
 * BreadcrumbSkeleton - Drilldown navigation breadcrumbs
 * Fixed Height: 40px
 */
export function BreadcrumbSkeleton({ levels = 3 }: { levels?: number }) {
  return (
    <div className="h-10 flex items-center gap-2">
      {[...Array(levels)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          {i < levels - 1 && <Skeleton className="h-4 w-4" />}
        </div>
      ))}
    </div>
  )
}

/**
 * TabNavigationSkeleton - Tab bar for module switching
 * Fixed Height: 48px
 */
export function TabNavigationSkeleton({ tabs = 5 }: { tabs?: number }) {
  return (
    <div className="h-12 flex items-center gap-1 border-b">
      {[...Array(tabs)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-32 rounded-t" />
      ))}
    </div>
  )
}

/**
 * PaginationSkeleton - Table/list pagination controls
 * Fixed Height: 48px
 */
export function PaginationSkeleton() {
  return (
    <div className="h-12 flex items-center justify-between">
      {/* Page Info */}
      <Skeleton className="h-4 w-48" />

      {/* Page Controls */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

/**
 * FilterBarSkeleton - Search and filter controls
 * Fixed Height: 64px
 */
export function FilterBarSkeleton({ filters = 4 }: { filters?: number }) {
  return (
    <div className="h-16 flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
      {/* Search */}
      <Skeleton className="h-10 flex-1 max-w-md" />

      {/* Filter Dropdowns */}
      {[...Array(filters)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-32" />
      ))}

      {/* Action Buttons */}
      <Skeleton className="h-10 w-10 rounded" />
      <Skeleton className="h-10 w-10 rounded" />
    </div>
  )
}

/**
 * ToolbarSkeleton - Action toolbar above content
 * Fixed Height: 56px
 */
export function ToolbarSkeleton() {
  return (
    <div className="h-14 flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded" />
        <Skeleton className="h-10 w-10 rounded" />
        <Skeleton className="h-10 w-10 rounded" />
        <div className="w-px h-6 bg-border mx-2" />
        <Skeleton className="h-10 w-10 rounded" />
        <Skeleton className="h-10 w-10 rounded" />
      </div>

      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

/**
 * ContextMenuSkeleton - Right-click context menu
 * Fixed Width: 200px
 */
export function ContextMenuSkeleton() {
  return (
    <div className="w-50 bg-card border rounded-lg shadow-lg p-2 space-y-1">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-8 flex items-center gap-2 px-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  )
}

/**
 * DropdownMenuSkeleton - Dropdown menu skeleton
 * Variable height based on items
 */
export function DropdownMenuSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="w-48 bg-card border rounded-lg shadow-lg p-2">
      <div className="space-y-1">
        {[...Array(items)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded" />
        ))}
      </div>
    </div>
  )
}

/**
 * CommandPaletteSkeleton - Command/search palette
 * Fixed Height: 400px
 */
export function CommandPaletteSkeleton() {
  return (
    <div className="w-full max-w-2xl bg-card border rounded-lg shadow-2xl overflow-hidden h-[400px]">
      {/* Search Input - Fixed Height: 64px */}
      <div className="h-16 border-b p-4">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Results */}
      <div className="p-2 space-y-1 h-[calc(400px-4rem)] overflow-hidden">
        {/* Section Headers + Items */}
        <div className="space-y-3">
          {[...Array(3)].map((_, section) => (
            <div key={section} className="space-y-1">
              <Skeleton className="h-3 w-24 ml-2" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 flex items-center gap-3 px-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-12" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * FullLayoutSkeleton - Complete page layout with navigation
 * Combines Header + Sidebar + Content
 */
export function FullLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-background flex">
      <SidebarSkeleton />

      <div className="flex-1 ml-64">
        <HeaderSkeleton />

        <main className="p-6">
          <div className="space-y-6">
            <BreadcrumbSkeleton />
            <FilterBarSkeleton />
            <Skeleton className="h-[600px] w-full" />
          </div>
        </main>
      </div>
    </div>
  )
}
