-- Migration 007: Financial & Accounting Tables
-- Created: 2026-01-08
-- Description: Complete financial management including expenses, invoices, purchase orders, budgets, depreciation, and fuel cards

-- ============================================================================
-- EXPENSES - FLAIR Expense Submission and Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    expense_number VARCHAR(50) UNIQUE NOT NULL,

    -- Classification
    expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN (
        'fuel', 'maintenance', 'repair', 'toll', 'parking',
        'registration', 'insurance', 'lease', 'rental', 'other'
    )),
    category VARCHAR(100),
    subcategory VARCHAR(100),

    -- Associations
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    submitted_by_user_id UUID NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    receipt_document_id UUID,  -- FK to documents table

    -- Financial details
    expense_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    tax_amount DECIMAL(12, 2) DEFAULT 0 CHECK (tax_amount >= 0),
    tip_amount DECIMAL(12, 2) DEFAULT 0 CHECK (tip_amount >= 0),
    total_amount DECIMAL(12, 2) GENERATED ALWAYS AS (amount + COALESCE(tax_amount, 0) + COALESCE(tip_amount, 0)) STORED,

    description TEXT NOT NULL,
    merchant_name VARCHAR(255),

    -- Approval workflow
    reimbursement_status VARCHAR(20) DEFAULT 'pending' CHECK (reimbursement_status IN (
        'pending', 'submitted', 'approved', 'rejected', 'paid', 'cancelled'
    )),
    approval_workflow_id UUID,
    approved_by_user_id UUID,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Payment tracking
    payment_method VARCHAR(50) CHECK (payment_method IN (
        'credit_card', 'debit_card', 'cash', 'check', 'wire_transfer', 'fuel_card', 'ach', 'other'
    )),
    paid_at TIMESTAMPTZ,
    payment_reference VARCHAR(100),
    reimbursed_to_payee BOOLEAN DEFAULT FALSE,

    -- Cost allocation
    cost_center VARCHAR(100),
    project_code VARCHAR(100),
    gl_account VARCHAR(50),  -- General Ledger account code

    -- Mileage (for IRS reporting)
    mileage_driven DECIMAL(8, 2),
    mileage_rate_per_mile DECIMAL(6, 3),

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    attachments TEXT[] DEFAULT '{}',  -- Additional receipt URLs

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_expense_amounts CHECK (total_amount >= 0)
);

CREATE INDEX idx_expenses_tenant_date ON expenses(tenant_id, expense_date DESC);
CREATE INDEX idx_expenses_submitted_by ON expenses(submitted_by_user_id, reimbursement_status, created_at DESC);
CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id, expense_date DESC) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_expenses_driver ON expenses(driver_id, expense_date DESC) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_expenses_vendor ON expenses(vendor_id, expense_date DESC) WHERE vendor_id IS NOT NULL;
CREATE INDEX idx_expenses_status ON expenses(reimbursement_status, expense_date DESC);
CREATE INDEX idx_expenses_approval ON expenses(approved_by_user_id, approved_at DESC) WHERE approved_by_user_id IS NOT NULL;
CREATE INDEX idx_expenses_cost_center ON expenses(cost_center, expense_date DESC) WHERE cost_center IS NOT NULL;

COMMENT ON TABLE expenses IS 'FLAIR expense submission and reimbursement tracking';

-- ============================================================================
-- INVOICES - Vendor Invoices and Accounts Payable
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,

    -- Invoice classification
    invoice_type VARCHAR(50) CHECK (invoice_type IN (
        'fuel', 'parts', 'service', 'lease', 'insurance',
        'maintenance', 'repair', 'equipment', 'software', 'utilities', 'other'
    )),

    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    received_date DATE,

    -- Purchase order reference
    po_number VARCHAR(100),
    po_id UUID,  -- FK to purchase_orders

    -- Financial amounts
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(12, 2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(12, 2) DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount DECIMAL(12, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    adjustment_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Payment terms and status
    payment_terms VARCHAR(100),  -- 'Net 30', 'Net 60', 'Due on receipt'
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN (
        'unpaid', 'partial', 'paid', 'overdue', 'disputed', 'cancelled'
    )),
    paid_amount DECIMAL(12, 2) DEFAULT 0 CHECK (paid_amount >= 0),
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),  -- Check number, transaction ID, etc.

    -- Line items (detailed breakdown)
    line_items JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{description: '', quantity: 1, unit_price: 100, amount: 100, tax: 10, part_id: uuid}]

    -- Cost allocation
    cost_center VARCHAR(100),
    project_code VARCHAR(100),
    gl_account VARCHAR(50),

    -- Approval workflow
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN (
        'pending', 'approved', 'rejected', 'disputed'
    )),
    approved_by_user_id UUID,
    approved_at TIMESTAMPTZ,

    -- Notes and attachments
    notes TEXT,
    attached_documents UUID[] DEFAULT '{}',  -- Array of document IDs

    -- Three-way match tracking
    po_matched BOOLEAN DEFAULT FALSE,
    receiving_matched BOOLEAN DEFAULT FALSE,
    match_exceptions TEXT,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT due_date_after_invoice CHECK (due_date >= invoice_date),
    CONSTRAINT paid_not_exceeds_total CHECK (paid_amount <= total_amount)
);

CREATE INDEX idx_invoices_tenant_date ON invoices(tenant_id, invoice_date DESC);
CREATE INDEX idx_invoices_vendor ON invoices(vendor_id, payment_status, due_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date, payment_status) WHERE payment_status IN ('unpaid', 'partial', 'overdue');
CREATE INDEX idx_invoices_status ON invoices(payment_status, due_date);
CREATE INDEX idx_invoices_po ON invoices(po_number) WHERE po_number IS NOT NULL;
CREATE INDEX idx_invoices_approval ON invoices(approval_status, created_at DESC);
CREATE INDEX idx_invoices_overdue ON invoices(tenant_id, due_date) WHERE payment_status = 'unpaid' AND due_date < CURRENT_DATE;

COMMENT ON TABLE invoices IS 'Vendor invoices and accounts payable tracking';

-- ============================================================================
-- PURCHASE ORDERS - Procurement Management
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,

    -- Request information
    requisition_id UUID,  -- Link to requisition (if separate workflow exists)
    po_type VARCHAR(50) CHECK (po_type IN (
        'parts', 'service', 'equipment', 'supplies', 'software', 'fuel', 'other'
    )),

    -- Dates
    po_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,

    -- Personnel
    requested_by_user_id UUID NOT NULL,
    approved_by_user_id UUID,

    -- Delivery information
    delivery_address TEXT,
    delivery_facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    delivery_contact_name VARCHAR(255),
    delivery_contact_phone VARCHAR(20),

    -- Financial amounts
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(12, 2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(12, 2) DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount DECIMAL(12, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Payment terms
    payment_terms VARCHAR(100),

    -- Status tracking
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_approval', 'approved', 'rejected',
        'sent', 'acknowledged', 'partially_received', 'received',
        'invoiced', 'paid', 'cancelled', 'on_hold'
    )),

    -- Line items (detailed breakdown)
    line_items JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{item: '', description: '', quantity: 1, unit_price: 100, amount: 100, part_id: uuid}]

    -- Cost allocation
    cost_center VARCHAR(100),
    project_code VARCHAR(100),
    budget_allocation_id UUID,

    -- Terms and conditions
    notes TEXT,
    terms_and_conditions TEXT,
    special_instructions TEXT,

    -- Receiving tracking
    received_quantity_total INTEGER DEFAULT 0,
    expected_quantity_total INTEGER,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_tenant_date ON purchase_orders(tenant_id, po_date DESC);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders(vendor_id, status, po_date DESC);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status, expected_delivery_date);
CREATE INDEX idx_purchase_orders_requested_by ON purchase_orders(requested_by_user_id, status, po_date DESC);
CREATE INDEX idx_purchase_orders_approved_by ON purchase_orders(approved_by_user_id) WHERE approved_by_user_id IS NOT NULL;
CREATE INDEX idx_purchase_orders_cost_center ON purchase_orders(cost_center, po_date DESC) WHERE cost_center IS NOT NULL;

COMMENT ON TABLE purchase_orders IS 'Purchase order management and tracking';

-- ============================================================================
-- BUDGET ALLOCATIONS - Budget Tracking and Management
-- ============================================================================
CREATE TABLE IF NOT EXISTS budget_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Time period
    fiscal_year INTEGER NOT NULL,
    fiscal_period VARCHAR(20),  -- 'Q1', 'Q2', 'Q3', 'Q4', 'JAN', 'FEB', etc.
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,

    -- Organizational structure
    department VARCHAR(100),
    cost_center VARCHAR(100),
    division VARCHAR(100),

    -- Budget category
    category VARCHAR(100) NOT NULL,  -- 'fuel', 'maintenance', 'insurance', 'depreciation', 'salaries'
    subcategory VARCHAR(100),

    -- Budget amounts
    allocated_amount DECIMAL(12, 2) NOT NULL CHECK (allocated_amount >= 0),
    spent_amount DECIMAL(12, 2) DEFAULT 0 CHECK (spent_amount >= 0),
    committed_amount DECIMAL(12, 2) DEFAULT 0 CHECK (committed_amount >= 0),  -- POs not yet invoiced

    -- Calculated fields
    remaining_amount DECIMAL(12, 2) GENERATED ALWAYS AS (
        allocated_amount - spent_amount - committed_amount
    ) STORED,
    percent_utilized DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE
            WHEN allocated_amount > 0 THEN ((spent_amount + committed_amount) / allocated_amount * 100)
            ELSE 0
        END
    ) STORED,

    -- Alerts
    warning_threshold_percent DECIMAL(5, 2) DEFAULT 80,  -- Alert at 80% utilization
    critical_threshold_percent DECIMAL(5, 2) DEFAULT 95,  -- Critical alert at 95%

    -- Approval and adjustment
    approved_by_user_id UUID,
    approved_at TIMESTAMPTZ,
    adjustment_reason TEXT,

    -- Notes
    notes TEXT,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_period CHECK (period_end_date > period_start_date),
    UNIQUE(tenant_id, fiscal_year, fiscal_period, department, cost_center, category, subcategory)
);

CREATE INDEX idx_budget_allocations_tenant_period ON budget_allocations(tenant_id, fiscal_year, fiscal_period);
CREATE INDEX idx_budget_allocations_department ON budget_allocations(department, category, fiscal_year);
CREATE INDEX idx_budget_allocations_cost_center ON budget_allocations(cost_center, fiscal_year);
CREATE INDEX idx_budget_allocations_utilization ON budget_allocations(percent_utilized DESC, fiscal_year) WHERE percent_utilized >= 80;

COMMENT ON TABLE budget_allocations IS 'Budget tracking and utilization management';

-- ============================================================================
-- COST ALLOCATIONS - Expense/Invoice Cost Distribution
-- ============================================================================
CREATE TABLE IF NOT EXISTS cost_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Source reference (what is being allocated)
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN (
        'expense', 'invoice', 'fuel_transaction', 'maintenance_record', 'work_order'
    )),
    source_id UUID NOT NULL,

    -- Allocation target
    allocation_date DATE NOT NULL,
    department VARCHAR(100),
    cost_center VARCHAR(100),
    project_code VARCHAR(100),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    gl_account VARCHAR(50),

    -- Allocation amounts
    allocated_amount DECIMAL(12, 2) NOT NULL CHECK (allocated_amount >= 0),
    allocation_percentage DECIMAL(5, 2) CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),

    -- Allocation method
    allocation_method VARCHAR(50) CHECK (allocation_method IN (
        'manual', 'automatic', 'usage_based', 'time_based', 'mileage_based', 'headcount_based'
    )),
    allocation_rule_id UUID,  -- Reference to allocation rule (if automated)

    -- Notes
    notes TEXT,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_allocations_source ON cost_allocations(source_type, source_id);
CREATE INDEX idx_cost_allocations_tenant_date ON cost_allocations(tenant_id, allocation_date DESC);
CREATE INDEX idx_cost_allocations_department ON cost_allocations(department, allocation_date DESC) WHERE department IS NOT NULL;
CREATE INDEX idx_cost_allocations_cost_center ON cost_allocations(cost_center, allocation_date DESC) WHERE cost_center IS NOT NULL;
CREATE INDEX idx_cost_allocations_project ON cost_allocations(project_code, allocation_date DESC) WHERE project_code IS NOT NULL;
CREATE INDEX idx_cost_allocations_vehicle ON cost_allocations(vehicle_id, allocation_date DESC) WHERE vehicle_id IS NOT NULL;

COMMENT ON TABLE cost_allocations IS 'Cost allocation and distribution across departments/projects';

-- ============================================================================
-- DEPRECIATION SCHEDULES - Vehicle Asset Depreciation
-- ============================================================================
CREATE TABLE IF NOT EXISTS depreciation_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

    -- Depreciation method
    depreciation_method VARCHAR(50) NOT NULL CHECK (depreciation_method IN (
        'straight_line', 'declining_balance', 'double_declining_balance',
        'sum_of_years_digits', 'units_of_production'
    )),

    -- Asset valuation
    purchase_price DECIMAL(12, 2) NOT NULL CHECK (purchase_price >= 0),
    salvage_value DECIMAL(12, 2) NOT NULL CHECK (salvage_value >= 0),
    depreciable_amount DECIMAL(12, 2) GENERATED ALWAYS AS (purchase_price - salvage_value) STORED,

    -- Useful life
    useful_life_years INTEGER CHECK (useful_life_years > 0),
    useful_life_miles INTEGER CHECK (useful_life_miles > 0),
    useful_life_months INTEGER GENERATED ALWAYS AS (useful_life_years * 12) STORED,

    -- Dates
    depreciation_start_date DATE NOT NULL,
    in_service_date DATE,

    -- Current values
    current_book_value DECIMAL(12, 2),
    accumulated_depreciation DECIMAL(12, 2) DEFAULT 0 CHECK (accumulated_depreciation >= 0),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    fully_depreciated BOOLEAN DEFAULT FALSE,
    fully_depreciated_date DATE,

    -- Additional parameters
    declining_balance_rate DECIMAL(5, 4),  -- For declining balance methods (e.g., 2.0 for double declining)

    -- Notes
    notes TEXT,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT purchase_exceeds_salvage CHECK (purchase_price >= salvage_value),
    CONSTRAINT useful_life_specified CHECK (
        (useful_life_years IS NOT NULL) OR (useful_life_miles IS NOT NULL)
    ),
    UNIQUE(vehicle_id, is_active) WHERE is_active = TRUE  -- Only one active schedule per vehicle
);

CREATE INDEX idx_depreciation_schedules_vehicle ON depreciation_schedules(vehicle_id);
CREATE INDEX idx_depreciation_schedules_tenant_active ON depreciation_schedules(tenant_id, is_active);
CREATE INDEX idx_depreciation_schedules_method ON depreciation_schedules(depreciation_method, is_active);

COMMENT ON TABLE depreciation_schedules IS 'Vehicle asset depreciation schedule configuration';

-- ============================================================================
-- DEPRECIATION ENTRIES - Periodic Depreciation Journal Entries
-- ============================================================================
CREATE TABLE IF NOT EXISTS depreciation_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    depreciation_schedule_id UUID NOT NULL REFERENCES depreciation_schedules(id) ON DELETE CASCADE,

    -- Period information
    period VARCHAR(20) NOT NULL,  -- 'YYYY-MM' or 'YYYY-Q1'
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,

    -- Depreciation calculation
    depreciation_amount DECIMAL(12, 2) NOT NULL CHECK (depreciation_amount >= 0),
    beginning_book_value DECIMAL(12, 2) NOT NULL CHECK (beginning_book_value >= 0),
    ending_book_value DECIMAL(12, 2) NOT NULL CHECK (ending_book_value >= 0),

    -- Usage-based depreciation details
    miles_driven INTEGER,
    hours_operated INTEGER,

    -- Calculation metadata
    calculation_method_used VARCHAR(50),
    calculation_details JSONB,  -- Store calculation breakdown

    -- Journal entry reference
    journal_entry_number VARCHAR(100),
    posted_to_gl BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_book_values CHECK (ending_book_value <= beginning_book_value),
    CONSTRAINT valid_period CHECK (period_end_date > period_start_date),
    UNIQUE(depreciation_schedule_id, period)
);

CREATE INDEX idx_depreciation_entries_schedule ON depreciation_entries(depreciation_schedule_id, period DESC);
CREATE INDEX idx_depreciation_entries_period ON depreciation_entries(period DESC);
CREATE INDEX idx_depreciation_entries_posted ON depreciation_entries(posted_to_gl, posted_at) WHERE posted_to_gl = FALSE;

COMMENT ON TABLE depreciation_entries IS 'Periodic depreciation journal entries and calculations';

-- ============================================================================
-- FUEL CARDS - Fleet Fuel Card Management
-- ============================================================================
CREATE TABLE IF NOT EXISTS fuel_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    card_number VARCHAR(50) UNIQUE NOT NULL,
    card_number_last_4 VARCHAR(4) GENERATED ALWAYS AS (RIGHT(card_number, 4)) STORED,

    -- Card provider
    card_provider VARCHAR(100),  -- 'WEX', 'Voyager', 'FleetCor', 'Shell', 'BP'
    card_type VARCHAR(50),  -- 'fleet', 'universal', 'merchant_specific'
    provider_account_number VARCHAR(100),

    -- Assignments
    assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    assignment_type VARCHAR(20) CHECK (assignment_type IN ('vehicle', 'driver', 'department', 'unassigned')),

    -- Card status
    card_status VARCHAR(20) DEFAULT 'active' CHECK (card_status IN (
        'active', 'suspended', 'lost', 'stolen', 'expired', 'cancelled', 'pending_activation'
    )),

    -- Financial limits
    credit_limit DECIMAL(12, 2) CHECK (credit_limit >= 0),
    daily_limit DECIMAL(12, 2) CHECK (daily_limit >= 0),
    weekly_limit DECIMAL(12, 2) CHECK (weekly_limit >= 0),
    monthly_limit DECIMAL(12, 2) CHECK (monthly_limit >= 0),
    transaction_limit DECIMAL(12, 2) CHECK (transaction_limit >= 0),
    current_balance DECIMAL(12, 2) DEFAULT 0,

    -- Security
    pin_required BOOLEAN DEFAULT TRUE,
    odometer_prompt_required BOOLEAN DEFAULT TRUE,
    driver_id_prompt_required BOOLEAN DEFAULT FALSE,

    -- Restrictions (stored as JSONB for flexibility)
    restrictions JSONB DEFAULT '{}'::jsonb,
    -- Structure: {fuel_types: ['diesel', 'unleaded'], max_amount_per_transaction: 200, allowed_days: ['mon', 'tue'], allowed_hours: {start: '06:00', end: '22:00'}, product_codes: ['001', '002'], merchant_categories: ['fuel']}

    -- Important dates
    issue_date DATE,
    activation_date DATE,
    expiration_date DATE,
    last_used_at TIMESTAMPTZ,

    -- Usage tracking
    transaction_count INTEGER DEFAULT 0,
    total_spent_amount DECIMAL(12, 2) DEFAULT 0,

    -- Notes
    notes TEXT,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fuel_cards_tenant_status ON fuel_cards(tenant_id, card_status);
CREATE INDEX idx_fuel_cards_vehicle ON fuel_cards(assigned_vehicle_id) WHERE assigned_vehicle_id IS NOT NULL;
CREATE INDEX idx_fuel_cards_driver ON fuel_cards(assigned_driver_id) WHERE assigned_driver_id IS NOT NULL;
CREATE INDEX idx_fuel_cards_provider ON fuel_cards(card_provider, card_status);
CREATE INDEX idx_fuel_cards_expiration ON fuel_cards(expiration_date) WHERE card_status = 'active' AND expiration_date IS NOT NULL;
CREATE INDEX idx_fuel_cards_number ON fuel_cards(card_number_last_4);

COMMENT ON TABLE fuel_cards IS 'Fleet fuel card management and tracking';

-- ============================================================================
-- FUEL CARD TRANSACTIONS - Detailed Fuel Card Transaction Records
-- ============================================================================
CREATE TABLE IF NOT EXISTS fuel_card_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fuel_card_id UUID NOT NULL REFERENCES fuel_cards(id) ON DELETE CASCADE,
    fuel_transaction_id UUID REFERENCES fuelTransactions(id) ON DELETE SET NULL,  -- Link to existing fuel transaction

    -- Vehicle and driver
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

    -- Transaction details
    transaction_date TIMESTAMPTZ NOT NULL,
    transaction_type VARCHAR(50) DEFAULT 'fuel' CHECK (transaction_type IN (
        'fuel', 'def', 'oil', 'maintenance', 'car_wash', 'other'
    )),

    -- Merchant information
    merchant_name VARCHAR(255),
    merchant_location TEXT,
    merchant_city VARCHAR(100),
    merchant_state VARCHAR(50),
    merchant_zip VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Fuel details
    fuel_type VARCHAR(50),
    product_code VARCHAR(50),
    quantity_liters DECIMAL(8, 2) CHECK (quantity_liters >= 0),
    quantity_gallons DECIMAL(8, 2) CHECK (quantity_gallons >= 0),
    unit_price DECIMAL(6, 3) CHECK (unit_price >= 0),

    -- Financial amounts
    subtotal_amount DECIMAL(12, 2) NOT NULL CHECK (subtotal_amount >= 0),
    tax_amount DECIMAL(12, 2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Vehicle data at transaction
    odometer INTEGER,
    engine_hours INTEGER,

    -- Approval and validation
    is_approved BOOLEAN DEFAULT TRUE,
    approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN (
        'pending', 'approved', 'flagged', 'rejected', 'under_review'
    )),
    flagged_reason TEXT,
    reviewed_by_user_id UUID,
    reviewed_at TIMESTAMPTZ,

    -- Fraud detection flags
    is_duplicate BOOLEAN DEFAULT FALSE,
    is_out_of_sequence BOOLEAN DEFAULT FALSE,  -- Odometer out of sequence
    is_outside_geofence BOOLEAN DEFAULT FALSE,
    is_excessive_quantity BOOLEAN DEFAULT FALSE,
    is_unusual_time BOOLEAN DEFAULT FALSE,
    fraud_score DECIMAL(3, 2) CHECK (fraud_score >= 0 AND fraud_score <= 1),

    -- Receipt and documentation
    receipt_url TEXT,
    receipt_document_id UUID,

    -- External system reference
    external_transaction_id VARCHAR(255),
    provider_transaction_id VARCHAR(255),

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

CREATE INDEX idx_fuel_card_transactions_card ON fuel_card_transactions(fuel_card_id, transaction_date DESC);
CREATE INDEX idx_fuel_card_transactions_vehicle ON fuel_card_transactions(vehicle_id, transaction_date DESC) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_fuel_card_transactions_driver ON fuel_card_transactions(driver_id, transaction_date DESC) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_fuel_card_transactions_tenant_date ON fuel_card_transactions(tenant_id, transaction_date DESC);
CREATE INDEX idx_fuel_card_transactions_approval_status ON fuel_card_transactions(approval_status, transaction_date DESC);
CREATE INDEX idx_fuel_card_transactions_flagged ON fuel_card_transactions(tenant_id, transaction_date DESC)
    WHERE approval_status IN ('flagged', 'rejected', 'under_review');
CREATE INDEX idx_fuel_card_transactions_fraud ON fuel_card_transactions(fraud_score DESC, transaction_date DESC)
    WHERE fraud_score > 0.5;
CREATE INDEX idx_fuel_card_transactions_geospatial ON fuel_card_transactions USING GIST (ll_to_earth(latitude, longitude))
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON TABLE fuel_card_transactions IS 'Detailed fuel card transaction records with fraud detection';

-- ============================================================================
-- PAYMENT METHODS - Payment Method Registry
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Payment type
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN (
        'credit_card', 'debit_card', 'bank_account', 'fuel_card',
        'check', 'wire_transfer', 'ach', 'paypal', 'other'
    )),
    payment_name VARCHAR(255) NOT NULL,  -- Display name

    -- Account details (masked/encrypted)
    account_number_last4 VARCHAR(4),  -- Last 4 digits for display
    account_holder_name VARCHAR(255),

    -- Bank information (for ACH/wire)
    bank_name VARCHAR(255),
    routing_number VARCHAR(50),  -- Encrypted/masked
    account_type VARCHAR(20) CHECK (account_type IN ('checking', 'savings', 'credit', NULL)),

    -- Card information
    card_brand VARCHAR(50),  -- 'Visa', 'Mastercard', 'Amex'
    card_expiry_month INTEGER CHECK (card_expiry_month >= 1 AND card_expiry_month <= 12),
    card_expiry_year INTEGER,

    -- Billing address
    billing_address TEXT,
    billing_city VARCHAR(100),
    billing_state VARCHAR(50),
    billing_zip VARCHAR(20),
    billing_country VARCHAR(50) DEFAULT 'US',

    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,

    -- Security - reference to encrypted data in secure vault
    encrypted_data_reference VARCHAR(255),  -- Reference to external encryption vault

    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT only_one_default_per_tenant UNIQUE(tenant_id, is_default) WHERE is_default = TRUE
);

CREATE INDEX idx_payment_methods_tenant_active ON payment_methods(tenant_id, is_active);
CREATE INDEX idx_payment_methods_type ON payment_methods(payment_type, is_active);
CREATE INDEX idx_payment_methods_default ON payment_methods(tenant_id, is_default) WHERE is_default = TRUE;

COMMENT ON TABLE payment_methods IS 'Payment method registry with encrypted data references';

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_financial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();
CREATE TRIGGER update_budget_allocations_updated_at BEFORE UPDATE ON budget_allocations FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();
CREATE TRIGGER update_depreciation_schedules_updated_at BEFORE UPDATE ON depreciation_schedules FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();
CREATE TRIGGER update_fuel_cards_updated_at BEFORE UPDATE ON fuel_cards FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

-- Auto-generate expense number
CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expense_number IS NULL OR NEW.expense_number = '' THEN
        NEW.expense_number = 'EXP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                            LPAD(nextval('expense_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS expense_number_seq;

CREATE TRIGGER generate_expense_number_trigger
    BEFORE INSERT ON expenses
    FOR EACH ROW EXECUTE FUNCTION generate_expense_number();

-- Update invoice payment status based on paid_amount
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.paid_amount = 0 THEN
        NEW.payment_status = 'unpaid';
    ELSIF NEW.paid_amount < NEW.total_amount THEN
        NEW.payment_status = 'partial';
    ELSIF NEW.paid_amount >= NEW.total_amount THEN
        NEW.payment_status = 'paid';
        IF NEW.paid_at IS NULL THEN
            NEW.paid_at = NOW();
        END IF;
    END IF;

    -- Check for overdue
    IF NEW.payment_status IN ('unpaid', 'partial') AND NEW.due_date < CURRENT_DATE THEN
        NEW.payment_status = 'overdue';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_payment_status_trigger
    BEFORE INSERT OR UPDATE OF paid_amount, due_date ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();

-- Update fuel card last_used_at and transaction count
CREATE OR REPLACE FUNCTION update_fuel_card_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE fuel_cards
    SET
        last_used_at = NEW.transaction_date,
        transaction_count = transaction_count + 1,
        total_spent_amount = total_spent_amount + NEW.total_amount
    WHERE id = NEW.fuel_card_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fuel_card_usage_trigger
    AFTER INSERT ON fuel_card_transactions
    FOR EACH ROW EXECUTE FUNCTION update_fuel_card_usage();

-- Update budget allocation spent_amount when expense is paid
CREATE OR REPLACE FUNCTION update_budget_on_expense_paid()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reimbursement_status = 'paid' AND (OLD.reimbursement_status IS NULL OR OLD.reimbursement_status != 'paid') THEN
        UPDATE budget_allocations
        SET spent_amount = spent_amount + NEW.total_amount
        WHERE
            tenant_id = NEW.tenant_id
            AND fiscal_year = EXTRACT(YEAR FROM NEW.expense_date)::INTEGER
            AND category = NEW.category
            AND (cost_center = NEW.cost_center OR (cost_center IS NULL AND NEW.cost_center IS NULL))
            AND period_start_date <= NEW.expense_date
            AND period_end_date >= NEW.expense_date;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budget_on_expense_paid_trigger
    AFTER UPDATE OF reimbursement_status ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_budget_on_expense_paid();
