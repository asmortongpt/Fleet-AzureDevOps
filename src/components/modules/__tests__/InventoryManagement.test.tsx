/**
 * InventoryManagement Component Tests
 *
 * Comprehensive test suite for the InventoryManagement component including:
 * - Component rendering and layout
 * - Permission-based access control
 * - Inventory metrics and statistics
 * - Parts CRUD operations
 * - Search and filtering functionality
 * - Barcode scanning simulation
 * - Transaction recording
 * - Export functionality
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import InventoryManagement from "../InventoryManagement"

// Mock hooks
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: vi.fn(() => ({
    hasAnyRole: vi.fn(() => true),
    isLoading: false,
    isAdmin: true,
    isFleetManager: false
  }))
}))

vi.mock("@/hooks/useInventory", () => ({
  useInventory: vi.fn(() => ({
    parts: mockParts,
    isLoading: false,
    addPart: vi.fn(),
    updatePart: vi.fn(),
    deletePart: vi.fn(),
    createTransaction: vi.fn(),
    refetch: vi.fn()
  }))
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

// Mock data
const mockParts = [
  {
    id: "part-1",
    partNumber: "OIL-FILTER-001",
    name: "Engine Oil Filter",
    description: "High-performance oil filter",
    category: "filters" as const,
    manufacturer: "ACDelco",
    compatibleVehicles: ["vehicle-1"],
    quantityOnHand: 45,
    minStockLevel: 20,
    maxStockLevel: 100,
    reorderPoint: 30,
    unitCost: 12.99,
    location: "Shelf A-12",
    alternateVendors: []
  },
  {
    id: "part-2",
    partNumber: "BRAKE-PAD-002",
    name: "Front Brake Pads",
    description: "Ceramic brake pads",
    category: "brakes" as const,
    manufacturer: "Brembo",
    compatibleVehicles: ["vehicle-1"],
    quantityOnHand: 5,
    minStockLevel: 10,
    maxStockLevel: 50,
    reorderPoint: 15,
    unitCost: 89.99,
    location: "Shelf B-5",
    alternateVendors: []
  },
  {
    id: "part-3",
    partNumber: "TIRE-ALL-004",
    name: "All-Season Tire",
    description: "Commercial tire",
    category: "tires" as const,
    manufacturer: "Michelin",
    compatibleVehicles: ["vehicle-2"],
    quantityOnHand: 0,
    minStockLevel: 8,
    maxStockLevel: 32,
    reorderPoint: 12,
    unitCost: 189.99,
    location: "Tire Rack 1",
    alternateVendors: []
  },
  {
    id: "part-4",
    partNumber: "COOLANT-007",
    name: "Engine Coolant",
    description: "Extended life coolant",
    category: "fluids" as const,
    manufacturer: "Prestone",
    compatibleVehicles: ["vehicle-1", "vehicle-2"],
    quantityOnHand: 110,
    minStockLevel: 25,
    maxStockLevel: 100,
    reorderPoint: 35,
    unitCost: 14.99,
    location: "Fluids Storage",
    alternateVendors: []
  }
]

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("InventoryManagement", () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Component Rendering", () => {
    it("should render without crashing", () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })
      expect(screen.getByRole("main")).toBeInTheDocument()
    })

    it("should render page title and description", () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })
      expect(screen.getByText("Inventory Management")).toBeInTheDocument()
      expect(
        screen.getByText(/Comprehensive parts and supplies tracking/i)
      ).toBeInTheDocument()
    })

    it("should render action buttons", () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })
      expect(screen.getByRole("button", { name: /scan barcode/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /add part/i })).toBeInTheDocument()
    })
  })

  describe("Permission Control", () => {
    it("should show access denied for unauthorized users", async () => {
      const { usePermissions } = await import("@/hooks/usePermissions")
      vi.mocked(usePermissions).mockReturnValue({
        hasAnyRole: vi.fn(() => false),
        isLoading: false,
        isAdmin: false,
        isFleetManager: false
      } as any)

      render(<InventoryManagement />, { wrapper: createWrapper() })

      expect(screen.getByText("Access Denied")).toBeInTheDocument()
      expect(
        screen.getByText(/You do not have permission to access inventory management/i)
      ).toBeInTheDocument()
    })

    it("should show loading state while checking permissions", async () => {
      const { usePermissions } = await import("@/hooks/usePermissions")
      vi.mocked(usePermissions).mockReturnValue({
        hasAnyRole: vi.fn(() => false),
        isLoading: true,
        isAdmin: false,
        isFleetManager: false
      } as any)

      render(<InventoryManagement />, { wrapper: createWrapper() })

      expect(screen.getByText("Loading permissions...")).toBeInTheDocument()
    })
  })

  describe("Metrics Display", () => {
    it("should display total parts count", () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })
      expect(screen.getByText("4")).toBeInTheDocument() // mockParts.length
    })

    it("should display total inventory value", () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })
      // Calculate: (45*12.99) + (5*89.99) + (0*189.99) + (110*14.99)
      const totalValue = 45 * 12.99 + 5 * 89.99 + 0 * 189.99 + 110 * 14.99
      expect(screen.getByText(`$${totalValue.toLocaleString()}`)).toBeInTheDocument()
    })

    it("should display low stock count", () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })
      // part-2 has 5 units with reorder point of 15
      expect(screen.getByText("1")).toBeInTheDocument()
    })

    it("should display out of stock count", () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })
      // part-3 has 0 units
      expect(screen.getByText("1")).toBeInTheDocument()
    })

    it("should display overstocked count", () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })
      // part-4 has 110 units with max of 100
      expect(screen.getByText("1")).toBeInTheDocument()
    })
  })

  describe("Inventory Table", () => {
    it("should render parts table with all columns", () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })

      expect(screen.getByText("Part Number")).toBeInTheDocument()
      expect(screen.getByText("Name")).toBeInTheDocument()
      expect(screen.getByText("Category")).toBeInTheDocument()
      expect(screen.getByText("Location")).toBeInTheDocument()
      expect(screen.getByText("Stock Level")).toBeInTheDocument()
      expect(screen.getByText("Quantity")).toBeInTheDocument()
      expect(screen.getByText("Unit Cost")).toBeInTheDocument()
      expect(screen.getByText("Total Value")).toBeInTheDocument()
      expect(screen.getByText("Status")).toBeInTheDocument()
      expect(screen.getByText("Actions")).toBeInTheDocument()
    })

    it("should display all parts in the table", () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })

      expect(screen.getByText("OIL-FILTER-001")).toBeInTheDocument()
      expect(screen.getByText("BRAKE-PAD-002")).toBeInTheDocument()
      expect(screen.getByText("TIRE-ALL-004")).toBeInTheDocument()
      expect(screen.getByText("COOLANT-007")).toBeInTheDocument()
    })

    it("should display correct stock status badges", () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })

      expect(screen.getByText("In Stock")).toBeInTheDocument() // part-1
      expect(screen.getByText("Low Stock")).toBeInTheDocument() // part-2
      expect(screen.getByText("Out of Stock")).toBeInTheDocument() // part-3
      expect(screen.getByText("Overstocked")).toBeInTheDocument() // part-4
    })
  })

  describe("Search and Filtering", () => {
    it("should filter parts by search term", async () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })

      const searchInput = screen.getByPlaceholderText("Search parts...")
      await user.type(searchInput, "oil")

      await waitFor(() => {
        expect(screen.getByText("OIL-FILTER-001")).toBeInTheDocument()
        expect(screen.queryByText("BRAKE-PAD-002")).not.toBeInTheDocument()
      })
    })

    it("should filter parts by category", async () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })

      const categorySelect = screen.getAllByRole("combobox")[0] as HTMLElement
      await user.click(categorySelect)

      const brakesOption = screen.getByRole("option", { name: "Brakes" }) as HTMLElement
      if (brakesOption) {
        await user.click(brakesOption)
      }

      await waitFor(() => {
        expect(screen.getByText("BRAKE-PAD-002")).toBeInTheDocument()
        expect(screen.queryByText("OIL-FILTER-001")).not.toBeInTheDocument()
      })
    })

    it("should filter parts by status", async () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })

      const statusSelect = screen.getAllByRole("combobox")[1] as HTMLElement
      await user.click(statusSelect)

      const lowStockOption = screen.getByRole("option", { name: "Low Stock" }) as HTMLElement
      if (lowStockOption) {
        await user.click(lowStockOption)
      }

      await waitFor(() => {
        expect(screen.getByText("BRAKE-PAD-002")).toBeInTheDocument()
        expect(screen.queryByText("OIL-FILTER-001")).not.toBeInTheDocument()
      })
    })

    it("should show empty state when no parts match filters", async () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })

      const searchInput = screen.getByPlaceholderText("Search parts...")
      await user.type(searchInput, "nonexistent")

      await waitFor(() => {
        expect(screen.getByText(/No parts found/i)).toBeInTheDocument()
        expect(screen.getByText(/Try adjusting your filters/i)).toBeInTheDocument()
      })
    })
  })

  describe("Add Part Dialog", () => {
    it("should open add part dialog", async () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })

      const addButton = screen.getByRole("button", { name: /add part/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByText("Add New Part")).toBeInTheDocument()
        expect(screen.getByText("Enter part information to add to inventory")).toBeInTheDocument()
      })
    })

    it("should display all required form fields", async () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })

      const addButton = screen.getByRole("button", { name: /add part/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/Part Number/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Category/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Part Name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Manufacturer/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Storage Location/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Current Quantity/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Unit Cost/i)).toBeInTheDocument()
      })
    })

    it("should validate required fields", async () => {
      const { toast } = await import("sonner")
      render(<InventoryManagement />, { wrapper: createWrapper() })

      const addButton = screen.getByRole("button", { name: /add part/i })
      await user.click(addButton)

      await waitFor(() => {
        const submitButton = screen.getAllByRole("button", { name: /add part/i })[1] as HTMLElement
        if (submitButton) {
          user.click(submitButton)
        }
      })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Part Number and Name are required")
      })
    })
  })

  describe("Barcode Scanner", () => {
    it("should open barcode scanner dialog", async () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })

      const scanButton = screen.getByRole("button", { name: /scan barcode/i })
      await user.click(scanButton)

      await waitFor(() => {
        expect(screen.getByText("Barcode Scanner")).toBeInTheDocument()
        expect(screen.getByText(/Enter or scan a barcode to look up a part/i)).toBeInTheDocument()
      })
    })

    it("should find part by barcode", async () => {
      const { toast } = await import("sonner")
      render(<InventoryManagement />, { wrapper: createWrapper() })

      const scanButton = screen.getByRole("button", { name: /scan barcode/i })
      await user.click(scanButton)

      await waitFor(async () => {
        const barcodeInput = screen.getByLabelText(/Barcode \/ Part Number/i)
        await user.type(barcodeInput, "OIL-FILTER-001")

        const lookupButton = screen.getByRole("button", { name: /lookup/i })
        await user.click(lookupButton)
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Found: Engine Oil Filter")
      })
    })
  })

  describe("Export Functionality", () => {
    it("should export inventory to CSV", async () => {
      const { toast } = await import("sonner")
      const createElementSpy = vi.spyOn(document, "createElement")
      const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock")
      const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL")

      render(<InventoryManagement />, { wrapper: createWrapper() })

      const exportButton = screen.getByRole("button", { name: /export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith("a")
        expect(createObjectURLSpy).toHaveBeenCalled()
        expect(revokeObjectURLSpy).toHaveBeenCalled()
        expect(toast.success).toHaveBeenCalledWith("Inventory exported")
      })

      createElementSpy.mockRestore()
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })

      expect(screen.getByRole("main", { name: "Inventory Management" })).toBeInTheDocument()
    })

    it("should be keyboard navigable", async () => {
      render(<InventoryManagement />, { wrapper: createWrapper() })

      const searchInput = screen.getByPlaceholderText("Search parts...")
      await user.tab()
      expect(searchInput).toHaveFocus()
    })
  })
})