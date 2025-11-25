import { useState, useEffect, Suspense } from "react"
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Gear,
  Bell,
  SignOut,
  List,
  X,
  CarProfile,
  MapTrifold,
  UsersThree,
  ClipboardText,
  ChartBar
} from "@phosphor-icons/react"
import { EntityLinkingProvider } from "@/contexts/EntityLinkingContext"
import { DrilldownProvider } from "@/contexts/DrilldownContext"
import { UniversalSearch, SearchTrigger, useGlobalSearch } from "@/components/UniversalSearch"
import { RealTimeEventHub, EventBadge } from "@/components/RealTimeEventHub"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RoleSwitcher } from "@/components/demo/RoleSwitcher"
import { ToastContainer } from "@/components/common/ToastContainer"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ThemeToggle } from "@/components/ThemeToggle"
import { DrilldownManager } from "@/components/DrilldownManager"
import { InspectDrawer } from "@/components/inspect/InspectDrawer"
import { useFleetData } from "@/hooks/use-fleet-data"
import { ModuleLoadingSpinner } from "@/components/common/ModuleLoadingSpinner"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

// Lazy load hub pages
import OperationsHub from "@/pages/hubs/OperationsHub"
import FleetHub from "@/pages/hubs/FleetHub"
import PeopleHub from "@/pages/hubs/PeopleHub"
import WorkHub from "@/pages/hubs/WorkHub"
import InsightsHub from "@/pages/hubs/InsightsHub"

// Navigation configuration for 5 hub pages
const hubNavigation = [
  {
    id: 'operations',
    label: 'Operations',
    path: '/operations',
    icon: <MapTrifold size={20} />
  },
  {
    id: 'fleet',
    label: 'Fleet',
    path: '/fleet',
    icon: <CarProfile size={20} />
  },
  {
    id: 'people',
    label: 'People',
    path: '/people',
    icon: <UsersThree size={20} />
  },
  {
    id: 'work',
    label: 'Work',
    path: '/work',
    icon: <ClipboardText size={20} />
  },
  {
    id: 'insights',
    label: 'Insights',
    path: '/insights',
    icon: <ChartBar size={20} />
  }
]

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { isOpen: searchOpen, setIsOpen: setSearchOpen } = useGlobalSearch()
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const fleetData = useFleetData()

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fleetData.initializeData()
  }, [fleetData.initializeData])

  // Keyboard shortcuts for navigation
  useKeyboardShortcuts([
    {
      key: 'k',
      meta: true,
      callback: () => setSearchOpen(true),
      description: 'Open search'
    },
    {
      key: 'b',
      meta: true,
      callback: () => setSidebarOpen(!sidebarOpen),
      description: 'Toggle sidebar'
    },
    {
      key: 'Escape',
      callback: () => {
        if (searchOpen) setSearchOpen(false)
      },
      description: 'Close search'
    },
    {
      key: '1',
      meta: true,
      callback: () => navigate('/operations'),
      description: 'Go to operations'
    },
    {
      key: '2',
      meta: true,
      callback: () => navigate('/fleet'),
      description: 'Go to fleet'
    },
    {
      key: '3',
      meta: true,
      callback: () => navigate('/people'),
      description: 'Go to people'
    },
    {
      key: '4',
      meta: true,
      callback: () => navigate('/work'),
      description: 'Go to work'
    },
    {
      key: '5',
      meta: true,
      callback: () => navigate('/insights'),
      description: 'Go to insights'
    }
  ])

  return (
    <EntityLinkingProvider>
      <DrilldownProvider>
        <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile Overlay Background */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'fixed left-0 top-0 h-full z-50' : 'relative'}
          ${sidebarOpen ? "w-64" : "w-0"}
          transition-all duration-300 bg-card border-r flex flex-col overflow-hidden
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        `}>
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CarProfile size={32} weight="bold" className="text-primary" />
              <h1 className="font-bold text-lg">Fleet Manager</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {hubNavigation.map((item) => (
                <Button
                  key={item.id}
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    navigate(item.path)
                    if (isMobile) {
                      setSidebarOpen(false)
                    }
                  }}
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b bg-card">
            <div className="flex items-center justify-between p-3 md:p-4">
              <div className="flex items-center gap-2">
                {!sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    className={isMobile ? 'h-10 w-10' : ''}
                  >
                    <List size={isMobile ? 24 : 20} />
                  </Button>
                )}
                <SearchTrigger onOpen={() => setSearchOpen(true)} />
              </div>

              <div className="flex items-center gap-1 md:gap-2">
                <div className="hidden sm:flex items-center gap-1 md:gap-2">
                  <ThemeToggle />
                  <RoleSwitcher />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`relative ${isMobile ? 'h-10 w-10' : ''}`}
                    >
                      <Bell size={isMobile ? 24 : 20} />
                      <EventBadge />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className={isMobile ? "w-[calc(100vw-2rem)]" : "w-[400px]"}
                  >
                    <RealTimeEventHub />
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={isMobile ? 'h-10 w-10' : ''}
                    >
                      <Avatar className={isMobile ? "h-9 w-9" : "h-8 w-8"}>
                        <AvatarFallback>AM</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={isMobile ? "w-48" : ""}>
                    {isMobile && (
                      <>
                        <DropdownMenuItem className="sm:hidden">
                          <Gear size={16} className="mr-2" />
                          Theme
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="sm:hidden" />
                      </>
                    )}
                    <DropdownMenuItem>
                      <Gear size={16} className="mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <SignOut size={16} className="mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Hub Content */}
          <div className="flex-1 overflow-hidden">
            <ErrorBoundary>
              <Suspense fallback={<ModuleLoadingSpinner />}>
                <Routes>
                  {/* Hub Pages */}
                  <Route path="/operations" element={<OperationsHub />} />
                  <Route path="/fleet" element={<FleetHub />} />
                  <Route path="/people" element={<PeopleHub />} />
                  <Route path="/work" element={<WorkHub />} />
                  <Route path="/insights" element={<InsightsHub />} />

                  {/* Legacy Redirects */}
                  <Route path="/dispatch" element={<Navigate to="/operations" replace />} />
                  <Route path="/dispatch-console" element={<Navigate to="/operations" replace />} />
                  <Route path="/gps-tracking" element={<Navigate to="/operations" replace />} />
                  <Route path="/obd2-dashboard" element={<Navigate to="/fleet" replace />} />
                  <Route path="/vehicles" element={<Navigate to="/fleet" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/fleet" replace />} />
                  <Route path="/garage" element={<Navigate to="/fleet" replace />} />
                  <Route path="/drivers" element={<Navigate to="/people" replace />} />
                  <Route path="/people-management" element={<Navigate to="/people" replace />} />
                  <Route path="/driver-mgmt" element={<Navigate to="/people" replace />} />
                  <Route path="/routes" element={<Navigate to="/work" replace />} />
                  <Route path="/tasks" element={<Navigate to="/work" replace />} />
                  <Route path="/reports" element={<Navigate to="/insights" replace />} />
                  <Route path="/analytics" element={<Navigate to="/insights" replace />} />
                  <Route path="/comprehensive" element={<Navigate to="/insights" replace />} />

                  {/* Default Route */}
                  <Route path="/" element={<Navigate to="/operations" replace />} />
                  <Route path="*" element={<Navigate to="/operations" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>

        {/* Universal Search */}
        <UniversalSearch
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
        />

        {/* Drilldown Manager */}
        <DrilldownManager />

        {/* Inspect Drawer */}
        <InspectDrawer />

        {/* Toast Notifications */}
        <ToastContainer />
      </div>
      </DrilldownProvider>
    </EntityLinkingProvider>
  )
}

export default App
