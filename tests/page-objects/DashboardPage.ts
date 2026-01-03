import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Dashboard Page
 */
export class DashboardPage extends BasePage {
  // Main sections
  private get mainContent() {
    return this.getByTestId('dashboard-content') || this.page.locator('main');
  }

  private get sidebar() {
    return this.getByTestId('sidebar') || this.page.locator('[role="navigation"]');
  }

  private get header() {
    return this.getByTestId('header') || this.page.locator('header');
  }

  // Metrics and KPIs
  private get totalVehiclesCard() {
    return this.getByTestId('metric-total-vehicles');
  }

  private get activeVehiclesCard() {
    return this.getByTestId('metric-active-vehicles');
  }

  private get maintenanceAlertsCard() {
    return this.getByTestId('metric-maintenance-alerts');
  }

  private get fuelEfficiencyCard() {
    return this.getByTestId('metric-fuel-efficiency');
  }

  // Navigation items
  private get fleetNavItem() {
    return this.getByTestId('nav-fleet') || this.getByRole('link', { name: /fleet/i });
  }

  private get vehiclesNavItem() {
    return this.getByTestId('nav-vehicles') || this.getByRole('link', { name: /vehicles/i });
  }

  private get driversNavItem() {
    return this.getByTestId('nav-drivers') || this.getByRole('link', { name: /drivers/i });
  }

  private get maintenanceNavItem() {
    return this.getByTestId('nav-maintenance') || this.getByRole('link', { name: /maintenance/i });
  }

  private get reportsNavItem() {
    return this.getByTestId('nav-reports') || this.getByRole('link', { name: /reports/i });
  }

  // User menu
  private get userMenuButton() {
    return this.getByTestId('user-menu-button') || this.page.locator('[aria-label="User menu"]');
  }

  private get logoutButton() {
    return this.getByTestId('logout-button') || this.getByRole('menuitem', { name: /log out|sign out/i });
  }

  private get profileMenuItem() {
    return this.getByTestId('profile-menu-item') || this.getByRole('menuitem', { name: /profile/i });
  }

  private get settingsMenuItem() {
    return this.getByTestId('settings-menu-item') || this.getByRole('menuitem', { name: /settings/i });
  }

  // Search and filters
  private get searchInput() {
    return this.getByTestId('global-search') || this.getByPlaceholder(/search/i);
  }

  private get filterButton() {
    return this.getByTestId('filter-button') || this.getByRole('button', { name: /filter/i });
  }

  // Charts and visualizations
  private get vehicleStatusChart() {
    return this.getByTestId('chart-vehicle-status');
  }

  private get maintenanceChart() {
    return this.getByTestId('chart-maintenance');
  }

  private get fuelTrendsChart() {
    return this.getByTestId('chart-fuel-trends');
  }

  // Alerts feed
  private get alertsFeed() {
    return this.getByTestId('alerts-feed');
  }

  private get alertItems() {
    return this.alertsFeed.locator('[data-testid^="alert-item-"]');
  }

  // Map
  private get fleetMap() {
    return this.getByTestId('fleet-map');
  }

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await super.goto('/dashboard');
    await this.waitForDashboardLoad();
  }

  /**
   * Wait for dashboard to load
   */
  async waitForDashboardLoad() {
    await this.waitForVisible(this.mainContent);
    await this.waitForLoadingToFinish();
    // Wait for at least one metric card to load
    await this.waitForVisible(this.totalVehiclesCard, 15000);
  }

  /**
   * Get total vehicles count
   */
  async getTotalVehicles(): Promise<number> {
    const text = await this.totalVehiclesCard.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Get active vehicles count
   */
  async getActiveVehicles(): Promise<number> {
    const text = await this.activeVehiclesCard.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Get maintenance alerts count
   */
  async getMaintenanceAlerts(): Promise<number> {
    const text = await this.maintenanceAlertsCard.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Navigate to Fleet page
   */
  async navigateToFleet() {
    await this.fleetNavItem.click();
    await this.page.waitForURL(/fleet/, { timeout: 10000 });
    await this.waitForLoadingToFinish();
  }

  /**
   * Navigate to Vehicles page
   */
  async navigateToVehicles() {
    await this.vehiclesNavItem.click();
    await this.page.waitForURL(/vehicles/, { timeout: 10000 });
    await this.waitForLoadingToFinish();
  }

  /**
   * Navigate to Drivers page
   */
  async navigateToDrivers() {
    await this.driversNavItem.click();
    await this.page.waitForURL(/drivers/, { timeout: 10000 });
    await this.waitForLoadingToFinish();
  }

  /**
   * Navigate to Maintenance page
   */
  async navigateToMaintenance() {
    await this.maintenanceNavItem.click();
    await this.page.waitForURL(/maintenance/, { timeout: 10000 });
    await this.waitForLoadingToFinish();
  }

  /**
   * Navigate to Reports page
   */
  async navigateToReports() {
    await this.reportsNavItem.click();
    await this.page.waitForURL(/reports/, { timeout: 10000 });
    await this.waitForLoadingToFinish();
  }

  /**
   * Open user menu
   */
  async openUserMenu() {
    await this.userMenuButton.click();
    await this.waitForVisible(this.logoutButton);
  }

  /**
   * Logout user
   */
  async logout() {
    await this.openUserMenu();
    await this.logoutButton.click();
    await this.page.waitForURL(/login/, { timeout: 10000 });
  }

  /**
   * Navigate to profile
   */
  async navigateToProfile() {
    await this.openUserMenu();
    await this.profileMenuItem.click();
    await this.page.waitForURL(/profile/, { timeout: 10000 });
  }

  /**
   * Navigate to settings
   */
  async navigateToSettings() {
    await this.openUserMenu();
    await this.settingsMenuItem.click();
    await this.page.waitForURL(/settings/, { timeout: 10000 });
  }

  /**
   * Search globally
   */
  async search(query: string) {
    await this.fill(this.searchInput, query);
    await this.pressKey('Enter');
    await this.waitForLoadingToFinish();
  }

  /**
   * Open filters
   */
  async openFilters() {
    await this.filterButton.click();
    await this.waitForVisible(this.getByTestId('filter-panel'));
  }

  /**
   * Get alerts count
   */
  async getAlertsCount(): Promise<number> {
    return await this.getElementCount(this.alertItems);
  }

  /**
   * Get alert at index
   */
  getAlert(index: number): Locator {
    return this.alertItems.nth(index);
  }

  /**
   * Click alert at index
   */
  async clickAlert(index: number) {
    const alert = this.getAlert(index);
    await alert.click();
    await this.waitForLoadingToFinish();
  }

  /**
   * Verify dashboard metrics are visible
   */
  async verifyMetricsVisible() {
    await expect(this.totalVehiclesCard).toBeVisible();
    await expect(this.activeVehiclesCard).toBeVisible();
    await expect(this.maintenanceAlertsCard).toBeVisible();
    await expect(this.fuelEfficiencyCard).toBeVisible();
  }

  /**
   * Verify charts are rendered
   */
  async verifyChartsRendered() {
    await expect(this.vehicleStatusChart).toBeVisible();
    await expect(this.maintenanceChart).toBeVisible();
    await expect(this.fuelTrendsChart).toBeVisible();
  }

  /**
   * Verify map is rendered
   */
  async verifyMapRendered() {
    await expect(this.fleetMap).toBeVisible();
  }

  /**
   * Verify navigation is present
   */
  async verifyNavigationPresent() {
    await expect(this.sidebar).toBeVisible();
    await expect(this.fleetNavItem).toBeVisible();
    await expect(this.vehiclesNavItem).toBeVisible();
    await expect(this.driversNavItem).toBeVisible();
    await expect(this.maintenanceNavItem).toBeVisible();
  }

  /**
   * Verify header is present
   */
  async verifyHeaderPresent() {
    await expect(this.header).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.userMenuButton).toBeVisible();
  }

  /**
   * Wait for real-time updates
   */
  async waitForRealtimeUpdate(timeout: number = 30000) {
    // Wait for WebSocket connection indicator
    const wsIndicator = this.getByTestId('websocket-status');
    await wsIndicator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Wait for data update
    await this.page.waitForFunction(
      () => {
        const element = document.querySelector('[data-last-updated]');
        return element && element.getAttribute('data-last-updated');
      },
      {},
      { timeout }
    );
  }

  /**
   * Verify accessibility features
   */
  async verifyAccessibility() {
    // Check skip navigation link
    const skipNav = this.page.locator('[href="#main-content"]');
    await expect(skipNav).toBeInViewport();

    // Check ARIA landmarks
    await expect(this.page.locator('[role="main"]')).toBeVisible();
    await expect(this.page.locator('[role="navigation"]')).toBeVisible();

    // Check focus management
    await this.page.keyboard.press('Tab');
    await expect(this.page.locator(':focus')).toBeVisible();
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation() {
    // Focus on first navigation item
    await this.fleetNavItem.focus();

    // Navigate through menu items
    await this.pressKey('ArrowDown');
    await expect(this.vehiclesNavItem).toBeFocused();

    await this.pressKey('ArrowDown');
    await expect(this.driversNavItem).toBeFocused();

    // Activate with Enter
    await this.pressKey('Enter');
    await this.page.waitForURL(/drivers/);
  }
}
