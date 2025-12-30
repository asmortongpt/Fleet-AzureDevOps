import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import VehicleInventory from "../VehicleInventory"

// Mock hooks
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: vi.fn(() => ({
    hasAnyRole: vi.fn(() => true),
    isLoading: false,
    isAdmin: true
  }))
}))

vi.mock("@/hooks/useVehicleInventory", () => ({
  useVehicleInventory: vi.fn(() => ({
    assignedParts: mockAssignedParts,
    compatibleParts: mockCompatibleParts,
    usageHistory: mockUsageHistory,
    maintenanceHistory: [],
    isLoading: false,
    assignPart: vi.fn(),
    removePart: vi.fn(),
    recordUsage: vi.fn(),
    refetch: vi.fn()
  }))
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock data
const mockAssignedParts = [
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
    partNumber: "AIR-FILTER-003",
    name: "Engine Air Filter",
    description: "Premium air filter",
    category: "filters" as const,
    manufacturer: "K&N",
    compatibleVehicles: ["vehicle-1"],
    quantityOnHand: 8,
    minStockLevel: 15,
    maxStockLevel: 75,
    reorderPoint: 20,
    unitCost: 24.99,
    location: "Shelf A-15",
    alternateVendors: []
  }
]

const mockCompatibleParts = [
  {
    id: "part-3",
    partNumber: "BRAKE-PAD-002",
    name: "Front Brake Pads",
    description: "Ceramic brake pads",
    category: "brakes" as const,
    manufacturer: "Brembo",
    compatibleVehicles: ["vehicle-1"],
    quantityOnHand: 12,
    minStockLevel: 10,
    maxStockLevel: 50,
    reorderPoint: 15,
    unitCost: 89.99,
    location: "Shelf B-5",
    alternateVendors: []
  },
  {
    id: "part-4",
    partNumber: "BATTERY-006",
    name: "Heavy-Duty Battery",
    description: "12V battery",
    category: "electrical" as const,
    manufacturer: "Interstate",
    compatibleVehicles: ["vehicle-1"],
    quantityOnHand: 0,
    minStockLevel: 5,
    maxStockLevel: 20,
    reorderPoint: 8,
    unitCost: 149.99,
    location: "Battery Cabinet",
    alternateVendors: []
  }
]

const mockUsageHistory = [
  {
    id: "trans-1",
    partId: "part-1",
    partNumber: "OIL-FILTER-001",
    type: "usage" as const,
    quantity: -1,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    workOrderId: "WO-12345",
    cost: 12.99,
    performedBy: "Tech Smith",
    notes: "Regular oil change"
  },
  {
    id: "trans-2",
    partId: "part-2",
    partNumber: "AIR-FILTER-003",
    type: "usage" as const,
    quantity: -1,
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    workOrderId: "WO-12320",
    cost: 24.99,
    performedBy: "Tech Johnson",
    notes: "Filter replacement"
  }
]

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("VehicleInventory", () => {
  let user: ReturnType<typeof userEvent.setup>

  const defaultProps = {
    vehicleId: "vehicle-1",
    vehicleNumber: "FLT-001",
    vehicleMake: "Ford",
    vehicleModel: "F-150"
  }

  beforeEach(() => {
    user = userEvent.setup()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Component Rendering", () => {
    it("should render without crashing", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })
      expect(screen.getByRole("main")).toBeInTheDocument()
    })

    it("should display vehicle information in header", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText(/Vehicle Inventory - FLT-001/i)).toBeInTheDocument()
      expect(screen.getByText(/Ford F-150/i)).toBeInTheDocument()
    })

    it("should render assign parts button", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })
      expect(screen.getByRole("button", { name: /assign parts/i })).toBeInTheDocument()
    })
  })

  describe("Permission Control", () => {
    it("should show access denied for unauthorized users", async () => {
      const { usePermissions } = await import("@/hooks/usePermissions")
      vi.mocked(usePermissions).mockReturnValue({
        hasAnyRole: vi.fn(() => false),
        isLoading: false,
        isAdmin: false
      } as any)

      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText("Access Denied")).toBeInTheDocument()
      expect(
        screen.getByText(/You do not have permission to view vehicle inventory/i)
      ).toBeInTheDocument()
    })

    it("should show loading spinner while checking permissions", async () => {
      const { usePermissions } = await import("@/hooks/usePermissions")
      vi.mocked(usePermissions).mockReturnValue({
        hasAnyRole: vi.fn(() => true),
        isLoading: true,
        isAdmin: false
      } as any)

      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const spinner = screen.getByRole("main").querySelector("svg")
      expect(spinner).toBeInTheDocument()
    })
  })

  describe("Metrics Display", () => {
    it("should display assigned parts count", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })
      expect(screen.getByText("2")).toBeInTheDocument() // mockAssignedParts.length
    })

    it("should display total parts value", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })
      // (45 * 12.99) + (8 * 24.99) = 784.47
      const totalValue = 45 * 12.99 + 8 * 24.99
      expect(screen.getByText(`$${Math.floor(totalValue).toLocaleString()}`)).toBeInTheDocument()
    })

    it("should display low stock parts count", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })
      // part-2 has 8 units with reorder point of 20
      expect(screen.getByText("1")).toBeInTheDocument()
    })

    it("should display parts used in last 30 days", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })
      // 2 parts used (from mockUsageHistory)
      expect(screen.getByText("2")).toBeInTheDocument()
    })
  })

  describe("Tabs Navigation", () => {
    it("should render all tabs", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByRole("tab", { name: /assigned parts/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /compatible parts/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /usage history/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /maintenance/i })).toBeInTheDocument()
    })

    it("should display assigned parts tab by default", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByRole("tab", { name: /assigned parts/i })).toHaveAttribute(
        "data-state",
        "active"
      )
    })

    it("should switch to compatible parts tab", async () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const compatibleTab = screen.getByRole("tab", { name: /compatible parts/i })
      await user.click(compatibleTab)

      await waitFor(() => {
        expect(compatibleTab).toHaveAttribute("data-state", "active")
        expect(screen.getByText("BRAKE-PAD-002")).toBeInTheDocument()
      })
    })

    it("should switch to usage history tab", async () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const usageTab = screen.getByRole("tab", { name: /usage history/i })
      await user.click(usageTab)

      await waitFor(() => {
        expect(usageTab).toHaveAttribute("data-state", "active")
        expect(screen.getByText("WO-12345")).toBeInTheDocument()
      })
    })
  })

  describe("Assigned Parts Tab", () => {
    it("should display all assigned parts", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText("OIL-FILTER-001")).toBeInTheDocument()
      expect(screen.getByText("Engine Oil Filter")).toBeInTheDocument()
      expect(screen.getByText("AIR-FILTER-003")).toBeInTheDocument()
      expect(screen.getByText("Engine Air Filter")).toBeInTheDocument()
    })

    it("should display stock status for each part", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText("In Stock")).toBeInTheDocument() // part-1
      expect(screen.getByText("Low Stock")).toBeInTheDocument() // part-2
    })

    it("should have use button for each part", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const useButtons = screen.getAllByRole("button", { name: /use/i })
      expect(useButtons).toHaveLength(2)
    })

    it("should have remove button for each part", () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const removeButtons = screen.getAllByRole("button", { name: /remove/i })
      expect(removeButtons).toHaveLength(2)
    })

    it("should filter assigned parts by search", async () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const searchInput = screen.getByPlaceholderText("Search assigned parts...")
      await user.type(searchInput, "oil")

      await waitFor(() => {
        expect(screen.getByText("OIL-FILTER-001")).toBeInTheDocument()
        expect(screen.queryByText("AIR-FILTER-003")).not.toBeInTheDocument()
      })
    })
  })

  describe("Compatible Parts Tab", () => {
    it("should display compatible parts", async () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const compatibleTab = screen.getByRole("tab", { name: /compatible parts/i })
      await user.click(compatibleTab)

      await waitFor(() => {
        expect(screen.getByText("BRAKE-PAD-002")).toBeInTheDocument()
        expect(screen.getByText("BATTERY-006")).toBeInTheDocument()
      })
    })

    it("should have assign button for each compatible part", async () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const compatibleTab = screen.getByRole("tab", { name: /compatible parts/i })
      await user.click(compatibleTab)

      await waitFor(() => {
        const assignButtons = screen.getAllByRole("button", { name: /assign/i })
        expect(assignButtons.length).toBeGreaterThan(0)
      })
    })

    it("should disable assign button for out of stock parts", async () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const compatibleTab = screen.getByRole("tab", { name: /compatible parts/i })
      await user.click(compatibleTab)

      await waitFor(() => {
        const assignButtons = screen.getAllByRole("button", { name: /assign/i })
        // BATTERY-006 has 0 quantity, so its button should be disabled
        const disabledButton = assignButtons.find(btn => btn.hasAttribute("disabled"))
        expect(disabledButton).toBeDefined()
      })
    })
  })

  describe("Usage History Tab", () => {
    it("should display usage history records", async () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const usageTab = screen.getByRole("tab", { name: /usage history/i })
      await user.click(usageTab)

      await waitFor(() => {
        expect(screen.getByText("WO-12345")).toBeInTheDocument()
        expect(screen.getByText("WO-12320")).toBeInTheDocument()
        expect(screen.getByText("Regular oil change")).toBeInTheDocument()
        expect(screen.getByText("Filter replacement")).toBeInTheDocument()
      })
    })

    it("should display usage costs", async () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const usageTab = screen.getByRole("tab", { name: /usage history/i })
      await user.click(usageTab)

      await waitFor(() => {
        expect(screen.getByText("$12.99")).toBeInTheDocument()
        expect(screen.getByText("$24.99")).toBeInTheDocument()
      })
    })
  })

  describe("Part Assignment", () => {
    it("should open assign parts dialog", async () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const assignButton = screen.getByRole("button", { name: /assign parts/i })
      await user.click(assignButton)

      await waitFor(() => {
        expect(screen.getByText("Assign Parts to Vehicle")).toBeInTheDocument()
        expect(screen.getByText(/Select compatible parts to assign to FLT-001/i)).toBeInTheDocument()
      })
    })

    it("should show compatible parts in dialog", async () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const assignButton = screen.getByRole("button", { name: /assign parts/i })
      await user.click(assignButton)

      await waitFor(() => {
        expect(screen.getByText("BRAKE-PAD-002")).toBeInTheDocument()
        expect(screen.getByText("BATTERY-006")).toBeInTheDocument()
      })
    })
  })

  describe("Record Usage", () => {
    it("should open usage dialog when clicking use button", async () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const useButtons = screen.getAllByRole("button", { name: /use/i })
      await user.click(useButtons[0])

      await waitFor(() => {
        expect(screen.getByText("Record Parts Usage")).toBeInTheDocument()
        expect(screen.getByText(/Record usage of Engine Oil Filter/i)).toBeInTheDocument()
      })
    })

    it("should display usage form fields", async () => {
      render(<VehicleInventory {...defaultProps} />, { wrapper: createWrapper() })

      const useButtons = screen.getAllByRole("button", { name: /use/i })
      await user.click(useButtons[0])

      await waitFor(() => {
        expect(screen.getByLabelText(/quantity used/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/work order id/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
      })
    })
  })
})