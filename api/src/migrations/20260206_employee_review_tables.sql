-- ============================================================================
-- Employee + Performance Review Tables (CTA demo readiness)
-- Ensures people/HR dashboards have DB-backed data (no mocks).
-- ============================================================================

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,

    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
    employee_type VARCHAR(20) DEFAULT 'full_time' CHECK (employee_type IN ('full_time', 'part_time', 'contractor')),

    hire_date DATE,
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    performance_rating INTEGER DEFAULT 80 CHECK (performance_rating >= 0 AND performance_rating <= 100),
    certifications TEXT[] DEFAULT '{}',
    last_review_date DATE,
    next_review_date DATE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,

    rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 100),
    review_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('scheduled', 'completed', 'overdue')),
    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_tenant ON performance_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON performance_reviews(status);
