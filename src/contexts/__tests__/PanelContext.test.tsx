/**
 * PanelContext Tests
 * Panel state management and navigation tests
 * Coverage: 100% branches
 */

import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { ReactNode } from 'react'

import { PanelProvider, usePanel } from '../PanelContext'

function TestWrapper({ children }: { children: ReactNode }) {
  return <PanelProvider>{children}</PanelProvider>
}

function TestComponent({ testFn }: { testFn: (panel: ReturnType<typeof usePanel>) => void }) {
  const panel = usePanel()
  testFn(panel)
  return null
}

describe('PanelContext', () => {
  beforeEach(() => {
    // No setup needed
  })

  describe('usePanel hook', () => {
    it('should throw error when used outside PanelProvider', () => {
      const TestComp = () => {
        usePanel()
        return null
      }

      expect(() => render(<TestComp />)).toThrow('usePanel must be used within a PanelProvider')
    })

    it('should provide panel context inside provider', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      expect(panelContext).toBeDefined()
      expect(panelContext?.state).toBeDefined()
    })
  })

  describe('Open panel', () => {
    it('should open new panel', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <button
            onClick={() => {
              panelContext?.openPanel({
                id: 'panel-1',
                moduleId: 'vehicle-details',
                title: 'Vehicle Details',
                width: 'medium',
              })
            }}
          >
            Open Panel
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      expect(panelContext?.panelDepth).toBe(0)

      fireEvent.click(getByText('Open Panel'))

      expect(panelContext?.panelDepth).toBe(1)
      expect(panelContext?.currentPanel?.moduleId).toBe('vehicle-details')
    })

    it('should set to side mode for normal width', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <button
            onClick={() => {
              panelContext?.openPanel({
                moduleId: 'test',
                title: 'Test',
                width: 'medium',
              })
            }}
          >
            Open
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Open'))

      expect(panelContext?.state.mode).toBe('side')
    })

    it('should set to takeover mode for takeover width', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <button
            onClick={() => {
              panelContext?.openPanel({
                moduleId: 'test',
                title: 'Test',
                width: 'takeover',
              })
            }}
          >
            Open
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Open'))

      expect(panelContext?.state.mode).toBe('takeover')
    })
  })

  describe('Push panel', () => {
    it('should push new panel to stack', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <>
            <button
              onClick={() => {
                panelContext?.openPanel({
                  moduleId: 'vehicle-list',
                  title: 'Vehicles',
                  width: 'medium',
                })
              }}
            >
              Open
            </button>
            <button
              onClick={() => {
                panelContext?.pushPanel({
                  moduleId: 'vehicle-detail',
                  title: 'Vehicle Detail',
                  width: 'medium',
                })
              }}
            >
              Push
            </button>
          </>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Open'))
      expect(panelContext?.panelDepth).toBe(1)

      fireEvent.click(getByText('Push'))
      expect(panelContext?.panelDepth).toBe(2)
      expect(panelContext?.state.mode).toBe('takeover')
    })
  })

  describe('Pop panel', () => {
    it('should pop last panel from stack', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <>
            <button
              onClick={() => {
                panelContext?.openPanel({
                  moduleId: 'test1',
                  title: 'Test 1',
                  width: 'medium',
                })
                panelContext?.pushPanel({
                  moduleId: 'test2',
                  title: 'Test 2',
                  width: 'medium',
                })
              }}
            >
              Setup
            </button>
            <button
              onClick={() => {
                panelContext?.popPanel()
              }}
            >
              Pop
            </button>
          </>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Setup'))
      expect(panelContext?.panelDepth).toBe(2)

      fireEvent.click(getByText('Pop'))
      expect(panelContext?.panelDepth).toBe(1)
    })

    it('should close all when popping last panel', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <>
            <button
              onClick={() => {
                panelContext?.openPanel({
                  moduleId: 'test',
                  title: 'Test',
                  width: 'medium',
                })
              }}
            >
              Open
            </button>
            <button
              onClick={() => {
                panelContext?.popPanel()
              }}
            >
              Pop
            </button>
          </>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Open'))
      expect(panelContext?.panelDepth).toBe(1)

      fireEvent.click(getByText('Pop'))
      expect(panelContext?.panelDepth).toBe(0)
      expect(panelContext?.state.mode).toBe('closed')
    })
  })

  describe('Go to level', () => {
    it('should navigate to specific panel in stack', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <>
            <button
              onClick={() => {
                panelContext?.openPanel({
                  id: 'p1',
                  moduleId: 'level1',
                  title: 'Level 1',
                  width: 'medium',
                })
                panelContext?.pushPanel({
                  id: 'p2',
                  moduleId: 'level2',
                  title: 'Level 2',
                  width: 'medium',
                })
                panelContext?.pushPanel({
                  id: 'p3',
                  moduleId: 'level3',
                  title: 'Level 3',
                  width: 'medium',
                })
              }}
            >
              Setup
            </button>
            <button
              onClick={() => {
                panelContext?.goToPanel(1)
              }}
            >
              GoTo 1
            </button>
          </>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Setup'))
      expect(panelContext?.panelDepth).toBe(3)

      fireEvent.click(getByText('GoTo 1'))
      expect(panelContext?.panelDepth).toBe(2)
      expect(panelContext?.currentPanel?.id).toBe('p2')
    })
  })

  describe('Close all', () => {
    it('should close all panels', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <>
            <button
              onClick={() => {
                panelContext?.openPanel({
                  moduleId: 'test1',
                  title: 'Test 1',
                  width: 'medium',
                })
                panelContext?.pushPanel({
                  moduleId: 'test2',
                  title: 'Test 2',
                  width: 'medium',
                })
              }}
            >
              Setup
            </button>
            <button
              onClick={() => {
                panelContext?.closeAll()
              }}
            >
              Close All
            </button>
          </>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Setup'))
      expect(panelContext?.panelDepth).toBe(2)

      fireEvent.click(getByText('Close All'))
      expect(panelContext?.panelDepth).toBe(0)
      expect(panelContext?.isOpen).toBe(false)
    })
  })

  describe('Bottom drawer', () => {
    it('should toggle bottom drawer', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <button
            onClick={() => {
              panelContext?.toggleBottomDrawer()
            }}
          >
            Toggle
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      expect(panelContext?.state.bottomDrawer.open).toBe(false)

      fireEvent.click(getByText('Toggle'))
      expect(panelContext?.state.bottomDrawer.open).toBe(true)

      fireEvent.click(getByText('Toggle'))
      expect(panelContext?.state.bottomDrawer.open).toBe(false)
    })
  })

  describe('Command palette', () => {
    it('should toggle command palette', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <button
            onClick={() => {
              panelContext?.toggleCommandPalette()
            }}
          >
            Toggle
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      expect(panelContext?.state.commandPaletteOpen).toBe(false)

      fireEvent.click(getByText('Toggle'))
      expect(panelContext?.state.commandPaletteOpen).toBe(true)
    })
  })

  describe('Derived state', () => {
    it('should calculate panel depth', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <button
            onClick={() => {
              panelContext?.openPanel({
                moduleId: 'test',
                title: 'Test',
                width: 'medium',
              })
            }}
          >
            Open
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      expect(panelContext?.panelDepth).toBe(0)

      fireEvent.click(getByText('Open'))
      expect(panelContext?.panelDepth).toBe(1)
    })

    it('should determine if panel is open', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <button
            onClick={() => {
              panelContext?.openPanel({
                moduleId: 'test',
                title: 'Test',
                width: 'medium',
              })
            }}
          >
            Open
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      expect(panelContext?.isOpen).toBe(false)

      fireEvent.click(getByText('Open'))
      expect(panelContext?.isOpen).toBe(true)
    })

    it('should determine if in takeover mode', () => {
      let panelContext: ReturnType<typeof usePanel> | null = null

      function TestComp() {
        panelContext = usePanel()

        return (
          <button
            onClick={() => {
              panelContext?.openPanel({
                moduleId: 'test',
                title: 'Test',
                width: 'takeover',
              })
            }}
          >
            Open
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Open'))
      expect(panelContext?.isTakeover).toBe(true)
    })
  })
})
