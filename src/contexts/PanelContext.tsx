/**
 * PanelContext - Core state management for the ArchonY single-page panel system
 *
 * Manages the panel stack (side panels and takeover views), replacing both
 * NavigationContext (module switching) and DrilldownContext (record navigation).
 */
import {
  createContext,
  useContext,
  useCallback,
  useReducer,
  type ReactNode,
  type Dispatch,
} from 'react'
import type { PanelWidth, ModuleCategory } from '@/config/module-registry'

// ============================================================================
// TYPES
// ============================================================================

export interface PanelEntry {
  id: string
  moduleId: string
  title: string
  width: PanelWidth
  category?: ModuleCategory
  data?: any
  timestamp: number
}

export type PanelMode = 'closed' | 'side' | 'takeover'

interface BottomDrawerState {
  open: boolean
  title?: string
}

export interface PanelState {
  stack: PanelEntry[]
  mode: PanelMode
  activeCategory: ModuleCategory | null
  flyoutCategory: ModuleCategory | null
  bottomDrawer: BottomDrawerState
  commandPaletteOpen: boolean
}

// ============================================================================
// ACTIONS
// ============================================================================

type PanelAction =
  | { type: 'OPEN_PANEL'; payload: Omit<PanelEntry, 'timestamp'> }
  | { type: 'PUSH_PANEL'; payload: Omit<PanelEntry, 'timestamp'> }
  | { type: 'POP_PANEL' }
  | { type: 'GO_TO_PANEL'; payload: number }
  | { type: 'CLOSE_ALL' }
  | { type: 'SET_TAKEOVER'; payload: boolean }
  | { type: 'SET_FLYOUT'; payload: ModuleCategory | null }
  | { type: 'TOGGLE_BOTTOM_DRAWER' }
  | { type: 'SET_BOTTOM_DRAWER'; payload: BottomDrawerState }
  | { type: 'TOGGLE_COMMAND_PALETTE' }
  | { type: 'SET_COMMAND_PALETTE'; payload: boolean }

// ============================================================================
// REDUCER
// ============================================================================

const initialState: PanelState = {
  stack: [],
  mode: 'closed',
  activeCategory: null,
  flyoutCategory: null,
  bottomDrawer: { open: false },
  commandPaletteOpen: false,
}

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'OPEN_PANEL': {
      const entry: PanelEntry = { ...action.payload, timestamp: Date.now() }
      const width = entry.width
      return {
        ...state,
        stack: [entry],
        mode: width === 'takeover' ? 'takeover' : 'side',
        activeCategory: entry.category ?? state.activeCategory,
        flyoutCategory: null,
      }
    }

    case 'PUSH_PANEL': {
      const entry: PanelEntry = { ...action.payload, timestamp: Date.now() }
      return {
        ...state,
        stack: [...state.stack, entry],
        mode: 'takeover', // Drilldowns always go takeover
      }
    }

    case 'POP_PANEL': {
      if (state.stack.length <= 1) {
        return { ...state, stack: [], mode: 'closed', activeCategory: null }
      }
      const newStack = state.stack.slice(0, -1)
      const top = newStack[newStack.length - 1]
      return {
        ...state,
        stack: newStack,
        mode: newStack.length === 1 && top.width !== 'takeover' ? 'side' : 'takeover',
      }
    }

    case 'GO_TO_PANEL': {
      const idx = action.payload
      if (idx < 0 || idx >= state.stack.length) return state
      const newStack = state.stack.slice(0, idx + 1)
      const top = newStack[newStack.length - 1]
      return {
        ...state,
        stack: newStack,
        mode: newStack.length === 1 && top.width !== 'takeover' ? 'side' : 'takeover',
      }
    }

    case 'CLOSE_ALL':
      return {
        ...state,
        stack: [],
        mode: 'closed',
        activeCategory: null,
      }

    case 'SET_TAKEOVER':
      return {
        ...state,
        mode: action.payload ? 'takeover' : (state.stack.length > 0 ? 'side' : 'closed'),
      }

    case 'SET_FLYOUT':
      return {
        ...state,
        flyoutCategory: action.payload,
      }

    case 'TOGGLE_BOTTOM_DRAWER':
      return {
        ...state,
        bottomDrawer: { ...state.bottomDrawer, open: !state.bottomDrawer.open },
      }

    case 'SET_BOTTOM_DRAWER':
      return { ...state, bottomDrawer: action.payload }

    case 'TOGGLE_COMMAND_PALETTE':
      return { ...state, commandPaletteOpen: !state.commandPaletteOpen }

    case 'SET_COMMAND_PALETTE':
      return { ...state, commandPaletteOpen: action.payload }

    default:
      return state
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface PanelContextValue {
  state: PanelState
  dispatch: Dispatch<PanelAction>

  // Convenience methods
  openPanel: (entry: Omit<PanelEntry, 'timestamp'>) => void
  pushPanel: (entry: Omit<PanelEntry, 'timestamp'>) => void
  popPanel: () => void
  goToPanel: (index: number) => void
  closeAll: () => void
  setTakeover: (on: boolean) => void
  setFlyout: (cat: ModuleCategory | null) => void
  toggleBottomDrawer: () => void
  toggleCommandPalette: () => void

  // Derived state
  currentPanel: PanelEntry | null
  panelDepth: number
  isOpen: boolean
  isTakeover: boolean
}

const PanelContext = createContext<PanelContextValue | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

export function PanelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(panelReducer, initialState)

  const openPanel = useCallback(
    (entry: Omit<PanelEntry, 'timestamp'>) => dispatch({ type: 'OPEN_PANEL', payload: entry }),
    []
  )

  const pushPanel = useCallback(
    (entry: Omit<PanelEntry, 'timestamp'>) => dispatch({ type: 'PUSH_PANEL', payload: entry }),
    []
  )

  const popPanel = useCallback(() => dispatch({ type: 'POP_PANEL' }), [])
  const goToPanel = useCallback((idx: number) => dispatch({ type: 'GO_TO_PANEL', payload: idx }), [])
  const closeAll = useCallback(() => dispatch({ type: 'CLOSE_ALL' }), [])
  const setTakeover = useCallback((on: boolean) => dispatch({ type: 'SET_TAKEOVER', payload: on }), [])
  const setFlyout = useCallback(
    (cat: ModuleCategory | null) => dispatch({ type: 'SET_FLYOUT', payload: cat }),
    []
  )
  const toggleBottomDrawer = useCallback(() => dispatch({ type: 'TOGGLE_BOTTOM_DRAWER' }), [])
  const toggleCommandPalette = useCallback(() => dispatch({ type: 'TOGGLE_COMMAND_PALETTE' }), [])

  const currentPanel = state.stack.length > 0 ? state.stack[state.stack.length - 1] : null

  const value: PanelContextValue = {
    state,
    dispatch,
    openPanel,
    pushPanel,
    popPanel,
    goToPanel,
    closeAll,
    setTakeover,
    setFlyout,
    toggleBottomDrawer,
    toggleCommandPalette,
    currentPanel,
    panelDepth: state.stack.length,
    isOpen: state.mode !== 'closed',
    isTakeover: state.mode === 'takeover',
  }

  return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>
}

// ============================================================================
// HOOK
// ============================================================================

export function usePanel(): PanelContextValue {
  const ctx = useContext(PanelContext)
  if (!ctx) {
    throw new Error('usePanel must be used within a PanelProvider')
  }
  return ctx
}
