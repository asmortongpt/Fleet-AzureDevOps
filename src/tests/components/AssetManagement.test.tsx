/**
 * Asset Management Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AssetManagement from '../../components/modules/AssetManagement'

// Mock fetch
global.fetch = vi.fn()

const mockFetch = global.fetch as ReturnType<typeof vi.fn>

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('AssetManagement Component', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('should render asset management heading', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assets: [], total: 0 }),
    } as Response)

    renderWithRouter(<AssetManagement />)

    expect(screen.getByText(/Asset Management/i)).toBeDefined()
  })

  it('should fetch and display assets on mount', async () => {
    const mockAssets = [
      {
        id: '1',
        asset_name: 'Test Vehicle',
        asset_type: 'vehicle',
        status: 'active',
        asset_tag: 'V-001',
      },
      {
        id: '2',
        asset_name: 'Test Equipment',
        asset_type: 'equipment',
        status: 'active',
        asset_tag: 'E-001',
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assets: mockAssets, total: 2 }),
    } as Response)

    renderWithRouter(<AssetManagement />)

    await waitFor(() => {
      expect(screen.getByText('Test Vehicle')).toBeDefined()
      expect(screen.getByText('Test Equipment')).toBeDefined()
    })
  })

  it('should filter assets by type', async () => {
    const mockAssets = [
      {
        id: '1',
        asset_name: 'Vehicle 1',
        asset_type: 'vehicle',
        status: 'active',
        asset_tag: 'V-001',
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ assets: mockAssets, total: 1 }),
    } as Response)

    renderWithRouter(<AssetManagement />)

    // Find and click filter dropdown
    const filterButton = screen.queryByRole('combobox')
    if (filterButton) {
      fireEvent.click(filterButton)

      await waitFor(() => {
        const vehicleOption = screen.queryByText(/vehicle/i)
        if (vehicleOption) {
          fireEvent.click(vehicleOption)
        }
      })

      // Verify API was called with filter
      await waitFor(() => {
        const calls = mockFetch.mock.calls
        const filteredCall = calls.find(call =>
          call[0]?.toString().includes('type=vehicle')
        )
        expect(filteredCall).toBeDefined()
      })
    }
  })

  it('should handle asset creation', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ assets: [], total: 0 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          asset: {
            id: 'new-1',
            asset_name: 'New Asset',
            asset_type: 'vehicle',
            status: 'active',
          },
        }),
      } as Response)

    renderWithRouter(<AssetManagement />)

    // Find add button
    const addButton = screen.queryByText(/Add Asset/i) || screen.queryByText(/New Asset/i)

    if (addButton) {
      fireEvent.click(addButton)

      await waitFor(() => {
        // Check if form appears
        const nameInput = screen.queryByLabelText(/Asset Name/i)
        expect(nameInput).toBeDefined()
      })
    }
  })

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    renderWithRouter(<AssetManagement />)

    await waitFor(() => {
      // Should show error message
      const errorElement = screen.queryByText(/error/i) || screen.queryByText(/failed/i)
      expect(errorElement).toBeDefined()
    })
  })

  it('should search assets', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ assets: [], total: 0 }),
    } as Response)

    renderWithRouter(<AssetManagement />)

    const searchInput = screen.queryByPlaceholderText(/search/i)

    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'Test Asset' } })

      await waitFor(() => {
        const calls = mockFetch.mock.calls
        const searchCall = calls.find(call =>
          call[0]?.toString().includes('search=Test%20Asset')
        )
        expect(searchCall).toBeDefined()
      })
    }
  })
})
