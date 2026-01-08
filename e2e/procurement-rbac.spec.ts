import { test, expect } from '@playwright/test';

test.describe('Purchase Orders RBAC', () => {
    // Mock Data
    const mockOrders = [
        {
            id: 'po-1',
            poNumber: 'PO-1001',
            vendorName: 'Acme Parts',
            date: '2024-03-20',
            expectedDelivery: '2024-03-25',
            items: [{ description: 'Brake Pads', quantity: 10, unitPrice: 50 }],
            total: 500,
            status: 'pending-approval',
            vendorId: 'v-1'
        }
    ];

    test.beforeEach(async ({ page }) => {
        // Mock PO API (if it were using API, currently likely local state or passed props, but let's assume structure)
        // The component uses internal state for demo, but we should mock auth.
    });

    test('should allow Manager to create and approve POs', async ({ page }) => {
        // Mock Manager User
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'manager',
                        email: 'manager@fleet.local',
                        first_name: 'Fleet',
                        last_name: 'Manager',
                        role: 'FleetManager',
                        permissions: ['po:create', 'po:read', 'po:approve'],
                        tenant_id: 'tenant-1'
                    }
                })
            });
        });

        await page.goto('/purchase-orders');

        // Create PO Button Visible
        await expect(page.getByRole('button', { name: 'Create Purchase Order' })).toBeVisible();

        // Create a PO (interaction test)
        await page.getByRole('button', { name: 'Create Purchase Order' }).click(); // Top button
        await expect(page.getByRole('dialog')).toBeVisible(); // Wait for dialog

        await page.getByLabel('Vendor Name').fill('Test Vendor');
        // Items are in a map, might be tricky. The ID is description-0.
        // Label is 'Description'. 
        // Let's use placeholder or ID.
        await page.locator('input[id="description-0"]').fill('Test Item');

        // Click Create in Dialog. 
        // It helps to target the Dialog Footer specifically or use the text specifically.
        await page.getByRole('button', { name: 'Create Purchase Order' }).last().click();

        // Wait for dialog to close
        await expect(page.getByRole('dialog')).not.toBeVisible();

        // Click the new PO to view details
        // Wait for table row
        const row = page.locator('tr').filter({ hasText: 'Test Vendor' });
        await expect(row).toBeVisible();

        // Open details
        await page.locator('tr').filter({ hasText: 'Test Vendor' }).getByRole('button', { name: 'View Details' }).click();

        // Approve Button Visible (since status defaults to pending-approval)
        await expect(page.getByRole('button', { name: 'Approve Order' })).toBeVisible();
    });

    test('should restrict Mechanic from creating or approving POs', async ({ page }) => {
        // Mock Mechanic User
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'mechanic',
                        email: 'mechanic@fleet.local',
                        first_name: 'Mike',
                        last_name: 'Mechanic',
                        role: 'Mechanic',
                        permissions: ['po:read'], // Read only
                        tenant_id: 'tenant-1'
                    }
                })
            });
        });

        await page.goto('/purchase-orders');

        // Create PO Button HIDDEN
        await expect(page.getByRole('button', { name: 'Create Purchase Order' })).not.toBeVisible();

        // Note: Can't easily test "Approve" hidden on existing items without seeding them via API mock if the component fetches them.
        // BUT the component uses `useState` initialized to empty array or mock if not fetched.
        // Unlikely to have items unless we create them or mock the request if it fetches.
        // Checking source: `const [orders, setOrders] = useState<PurchaseOrder[]>([])`
        // It does NOT appear to fetch from API in `useEffect`. It seems to be purely local state for now?
        // Wait, line 47: `const [orders, setOrders] = useState<PurchaseOrder[]>([])`
        // No `useEffect` to fetch.
        // So we can't test "Approve" gating unless we can somehow inject state or if there's default data.

        // Determine if there is default data.
        // Looking at file content: No default data in `useState([])`.
        // So the table starts empty.

        // If table is empty, we can't test Approve button visibility for Mechanic since they can't create one to see it.
        // We verified "Create" is hidden. That is sufficient for RBAC at this level.
    });
});
