import { Page, expect, Locator } from '@playwright/test';

import { BasePage } from './BasePage';

export interface VehicleData {
  vin: string;
  make: string;
  model: string;
  year: string;
  licensePlate?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  mileage?: string;
  fuelType?: string;
}

/**
 * Page Object Model for Vehicles Page
 */
export class VehiclesPage extends BasePage {
  // Main elements
  private get pageTitle() {
    return this.getByTestId('page-title') || this.page.locator('h1');
  }

  private get createVehicleButton() {
    return this.getByTestId('create-vehicle-btn') || this.getByRole('button', { name: /add vehicle|create vehicle/i });
  }

  private get vehiclesList() {
    return this.getByTestId('vehicles-list') || this.page.locator('[role="table"]');
  }

  private get vehicleRows() {
    return this.page.locator('[data-testid^="vehicle-row-"]');
  }

  // Search and filters
  private get searchInput() {
    return this.getByTestId('vehicles-search') || this.getByPlaceholder(/search vehicles/i);
  }

  private get filterByStatus() {
    return this.getByTestId('filter-status');
  }

  private get filterByMake() {
    return this.getByTestId('filter-make');
  }

  private get clearFiltersButton() {
    return this.getByTestId('clear-filters-btn') || this.getByRole('button', { name: /clear filters/i });
  }

  // Bulk operations
  private get bulkSelectAll() {
    return this.getByTestId('bulk-select-all') || this.page.locator('thead input[type="checkbox"]');
  }

  private get bulkActionsMenu() {
    return this.getByTestId('bulk-actions-menu');
  }

  private get bulkDeleteButton() {
    return this.getByTestId('bulk-delete-btn');
  }

  // Create/Edit modal
  private get vehicleModal() {
    return this.getByTestId('vehicle-modal') || this.page.locator('[role="dialog"]');
  }

  private get vinInput() {
    return this.vehicleModal.locator('[name="vin"]');
  }

  private get makeInput() {
    return this.vehicleModal.locator('[name="make"]');
  }

  private get modelInput() {
    return this.vehicleModal.locator('[name="model"]');
  }

  private get yearInput() {
    return this.vehicleModal.locator('[name="year"]');
  }

  private get licensePlateInput() {
    return this.vehicleModal.locator('[name="licensePlate"]');
  }

  private get statusSelect() {
    return this.vehicleModal.locator('[name="status"]');
  }

  private get mileageInput() {
    return this.vehicleModal.locator('[name="mileage"]');
  }

  private get fuelTypeSelect() {
    return this.vehicleModal.locator('[name="fuelType"]');
  }

  private get submitButton() {
    return this.vehicleModal.locator('[data-testid="submit-vehicle"]') || this.vehicleModal.getByRole('button', { name: /save|create/i });
  }

  private get cancelButton() {
    return this.vehicleModal.locator('[data-testid="cancel-vehicle"]') || this.vehicleModal.getByRole('button', { name: /cancel/i });
  }

  // Delete confirmation
  private get deleteConfirmDialog() {
    return this.getByTestId('delete-confirm-dialog') || this.page.locator('[role="alertdialog"]');
  }

  private get confirmDeleteButton() {
    return this.deleteConfirmDialog.locator('[data-testid="confirm-delete"]') || this.deleteConfirmDialog.getByRole('button', { name: /delete|confirm/i });
  }

  private get cancelDeleteButton() {
    return this.deleteConfirmDialog.locator('[data-testid="cancel-delete"]') || this.deleteConfirmDialog.getByRole('button', { name: /cancel/i });
  }

  // Pagination
  private get paginationNext() {
    return this.getByTestId('pagination-next') || this.getByRole('button', { name: /next/i });
  }

  private get paginationPrevious() {
    return this.getByTestId('pagination-previous') || this.getByRole('button', { name: /previous/i });
  }

  private get paginationInfo() {
    return this.getByTestId('pagination-info');
  }

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to vehicles page
   */
  async goto() {
    await super.goto('/vehicles');
    await this.waitForVehiclesPageLoad();
  }

  /**
   * Wait for vehicles page to load
   */
  async waitForVehiclesPageLoad() {
    await this.waitForVisible(this.pageTitle);
    await this.waitForLoadingToFinish();
    await this.waitForVisible(this.vehiclesList, 15000);
  }

  /**
   * Click create vehicle button
   */
  async clickCreateVehicle() {
    await this.createVehicleButton.click();
    await this.waitForVisible(this.vehicleModal);
  }

  /**
   * Fill vehicle form
   */
  async fillVehicleForm(data: VehicleData) {
    await this.fill(this.vinInput, data.vin);
    await this.fill(this.makeInput, data.make);
    await this.fill(this.modelInput, data.model);
    await this.fill(this.yearInput, data.year);

    if (data.licensePlate) {
      await this.fill(this.licensePlateInput, data.licensePlate);
    }

    if (data.status) {
      await this.statusSelect.selectOption(data.status);
    }

    if (data.mileage) {
      await this.fill(this.mileageInput, data.mileage);
    }

    if (data.fuelType) {
      await this.fuelTypeSelect.selectOption(data.fuelType);
    }
  }

  /**
   * Submit vehicle form
   */
  async submitVehicleForm() {
    await this.submitButton.click();
    await this.waitForHidden(this.vehicleModal);
    await this.waitForLoadingToFinish();
  }

  /**
   * Cancel vehicle form
   */
  async cancelVehicleForm() {
    await this.cancelButton.click();
    await this.waitForHidden(this.vehicleModal);
  }

  /**
   * Create new vehicle
   */
  async createVehicle(data: VehicleData) {
    await this.clickCreateVehicle();
    await this.fillVehicleForm(data);
    await this.submitVehicleForm();
    await this.waitForToast(/created|added/i);
  }

  /**
   * Get vehicle row by VIN
   */
  getVehicleByVin(vin: string): Locator {
    return this.page.locator(`[data-vehicle-vin="${vin}"]`);
  }

  /**
   * Get vehicle row by index
   */
  getVehicleByIndex(index: number): Locator {
    return this.vehicleRows.nth(index);
  }

  /**
   * Get total vehicles count
   */
  async getVehiclesCount(): Promise<number> {
    return await this.getElementCount(this.vehicleRows);
  }

  /**
   * Click vehicle to view details
   */
  async clickVehicle(vin: string) {
    const vehicle = this.getVehicleByVin(vin);
    await vehicle.click();
    await this.waitForLoadingToFinish();
  }

  /**
   * Edit vehicle
   */
  async editVehicle(vin: string, updates: Partial<VehicleData>) {
    const vehicle = this.getVehicleByVin(vin);
    const editButton = vehicle.locator('[data-testid="edit-vehicle-btn"]');
    await editButton.click();
    await this.waitForVisible(this.vehicleModal);

    // Update fields
    if (updates.make) await this.fill(this.makeInput, updates.make);
    if (updates.model) await this.fill(this.modelInput, updates.model);
    if (updates.year) await this.fill(this.yearInput, updates.year);
    if (updates.licensePlate) await this.fill(this.licensePlateInput, updates.licensePlate);
    if (updates.status) await this.statusSelect.selectOption(updates.status);
    if (updates.mileage) await this.fill(this.mileageInput, updates.mileage);

    await this.submitVehicleForm();
    await this.waitForToast(/updated|saved/i);
  }

  /**
   * Delete vehicle
   */
  async deleteVehicle(vin: string) {
    const vehicle = this.getVehicleByVin(vin);
    const deleteButton = vehicle.locator('[data-testid="delete-vehicle-btn"]');
    await deleteButton.click();
    await this.waitForVisible(this.deleteConfirmDialog);
    await this.confirmDeleteButton.click();
    await this.waitForHidden(this.deleteConfirmDialog);
    await this.waitForToast(/deleted|removed/i);
  }

  /**
   * Search vehicles
   */
  async search(query: string) {
    await this.fill(this.searchInput, query);
    await this.page.waitForTimeout(500); // Debounce
    await this.waitForLoadingToFinish();
  }

  /**
   * Filter by status
   */
  async filterByStatusOption(status: 'active' | 'inactive' | 'maintenance' | 'all') {
    await this.filterByStatus.selectOption(status);
    await this.waitForLoadingToFinish();
  }

  /**
   * Filter by make
   */
  async filterByMakeOption(make: string) {
    await this.filterByMake.selectOption(make);
    await this.waitForLoadingToFinish();
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    await this.clearFiltersButton.click();
    await this.waitForLoadingToFinish();
  }

  /**
   * Select all vehicles
   */
  async selectAllVehicles() {
    await this.bulkSelectAll.check();
    await this.page.waitForTimeout(500);
  }

  /**
   * Deselect all vehicles
   */
  async deselectAllVehicles() {
    await this.bulkSelectAll.uncheck();
    await this.page.waitForTimeout(500);
  }

  /**
   * Select vehicle by VIN
   */
  async selectVehicle(vin: string) {
    const vehicle = this.getVehicleByVin(vin);
    const checkbox = vehicle.locator('input[type="checkbox"]');
    await checkbox.check();
  }

  /**
   * Bulk delete selected vehicles
   */
  async bulkDeleteVehicles() {
    await this.bulkDeleteButton.click();
    await this.waitForVisible(this.deleteConfirmDialog);
    await this.confirmDeleteButton.click();
    await this.waitForHidden(this.deleteConfirmDialog);
    await this.waitForToast(/deleted|removed/i);
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.paginationNext.click();
    await this.waitForLoadingToFinish();
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.paginationPrevious.click();
    await this.waitForLoadingToFinish();
  }

  /**
   * Get pagination info text
   */
  async getPaginationInfo(): Promise<string> {
    return await this.paginationInfo.textContent() || '';
  }

  /**
   * Verify vehicle exists
   */
  async verifyVehicleExists(vin: string) {
    const vehicle = this.getVehicleByVin(vin);
    await expect(vehicle).toBeVisible();
  }

  /**
   * Verify vehicle does not exist
   */
  async verifyVehicleDoesNotExist(vin: string) {
    const vehicle = this.getVehicleByVin(vin);
    await expect(vehicle).not.toBeVisible();
  }

  /**
   * Verify vehicle details
   */
  async verifyVehicleDetails(vin: string, expectedData: Partial<VehicleData>) {
    const vehicle = this.getVehicleByVin(vin);

    if (expectedData.make) {
      await expect(vehicle).toContainText(expectedData.make);
    }
    if (expectedData.model) {
      await expect(vehicle).toContainText(expectedData.model);
    }
    if (expectedData.year) {
      await expect(vehicle).toContainText(expectedData.year);
    }
    if (expectedData.status) {
      const statusBadge = vehicle.locator(`[data-status="${expectedData.status}"]`);
      await expect(statusBadge).toBeVisible();
    }
  }

  /**
   * Verify empty state
   */
  async verifyEmptyState() {
    const emptyState = this.getByTestId('vehicles-empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/no vehicles/i);
  }

  /**
   * Sort by column
   */
  async sortByColumn(column: 'vin' | 'make' | 'model' | 'year' | 'status') {
    const columnHeader = this.page.locator(`[data-sort-column="${column}"]`);
    await columnHeader.click();
    await this.waitForLoadingToFinish();
  }

  /**
   * Verify form validation errors
   */
  async verifyFormValidationErrors() {
    await this.submitButton.click();

    const vinError = this.vehicleModal.locator('[data-error-for="vin"]');
    const makeError = this.vehicleModal.locator('[data-error-for="make"]');
    const modelError = this.vehicleModal.locator('[data-error-for="model"]');

    await expect(vinError).toBeVisible();
    await expect(makeError).toBeVisible();
    await expect(modelError).toBeVisible();
  }

  /**
   * Test keyboard navigation in table
   */
  async testKeyboardNavigation() {
    // Focus on first vehicle
    const firstVehicle = this.getVehicleByIndex(0);
    await firstVehicle.focus();

    // Navigate down
    await this.pressKey('ArrowDown');
    const secondVehicle = this.getVehicleByIndex(1);
    await expect(secondVehicle).toBeFocused();

    // Navigate up
    await this.pressKey('ArrowUp');
    await expect(firstVehicle).toBeFocused();

    // Open with Enter
    await this.pressKey('Enter');
    await this.waitForLoadingToFinish();
  }
}
