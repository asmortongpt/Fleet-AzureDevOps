-- CTA Fleet demo budget seed (Tallahassee, FL)
-- Ensures active budgets exist for cost-per-mile benchmarks and dashboard KPIs.

DO $$
DECLARE
  tenant_uuid uuid := '8e33a492-9b42-4e7a-8654-0572c9773b71';
BEGIN
  -- Only seed if no active budgets exist for this tenant
  IF NOT EXISTS (
    SELECT 1 FROM budgets
    WHERE tenant_id = tenant_uuid
      AND status = 'active'
  ) THEN
    INSERT INTO budgets (
      tenant_id,
      budget_name,
      budget_period,
      fiscal_year,
      period_start,
      period_end,
      department,
      cost_center,
      budget_category,
      budgeted_amount,
      spent_to_date,
      committed_amount,
      forecast_end_of_period,
      status,
      notes
    )
    VALUES
      (tenant_uuid, 'CTA Fuel Budget FY2026', 'annual', 2026, '2026-01-01', '2026-12-31', 'Operations', 'OPS-100', 'fuel', 180000, 0, 0, 180000, 'active', 'Fleet fuel budget'),
      (tenant_uuid, 'CTA Maintenance Budget FY2026', 'annual', 2026, '2026-01-01', '2026-12-31', 'Maintenance', 'MNT-200', 'maintenance', 125000, 0, 0, 125000, 'active', 'Preventive and corrective maintenance'),
      (tenant_uuid, 'CTA Parts Budget FY2026', 'annual', 2026, '2026-01-01', '2026-12-31', 'Maintenance', 'MNT-210', 'parts', 65000, 0, 0, 65000, 'active', 'Parts inventory and replacement'),
      (tenant_uuid, 'CTA Labor Budget FY2026', 'annual', 2026, '2026-01-01', '2026-12-31', 'Maintenance', 'MNT-220', 'labor', 95000, 0, 0, 95000, 'active', 'Technician labor and overtime'),
      (tenant_uuid, 'CTA Equipment Budget FY2026', 'annual', 2026, '2026-01-01', '2026-12-31', 'Operations', 'OPS-120', 'equipment', 110000, 0, 0, 110000, 'active', 'Large equipment allocation'),
      (tenant_uuid, 'CTA Administrative Budget FY2026', 'annual', 2026, '2026-01-01', '2026-12-31', 'Admin', 'ADM-300', 'administrative', 45000, 0, 0, 45000, 'active', 'Training, compliance, and admin overhead');
  END IF;
END $$;
