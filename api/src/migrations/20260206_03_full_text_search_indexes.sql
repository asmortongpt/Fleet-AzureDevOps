-- ============================================================================
-- Migration: Full-Text Search Infrastructure
-- Created: 2026-02-06
-- Purpose: Enable fast, accurate search across all text fields
-- Performance: Sub-second search across millions of records
-- ============================================================================

-- Enable pg_trgm for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- PART 1: Drivers Full-Text Search
-- ============================================================================

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION drivers_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.first_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.last_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.phone, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.employee_number, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.license_number, '')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drivers_search_vector_trigger
    BEFORE INSERT OR UPDATE OF first_name, last_name, email, phone, employee_number, license_number ON drivers
    FOR EACH ROW EXECUTE FUNCTION drivers_search_vector_update();

CREATE INDEX idx_drivers_search_vector ON drivers USING GIN(search_vector);
CREATE INDEX idx_drivers_name_trgm ON drivers USING GIN((first_name || ' ' || last_name) gin_trgm_ops);

-- Update existing records
UPDATE drivers SET search_vector =
    setweight(to_tsvector('english', COALESCE(first_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(last_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(email, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(phone, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(employee_number, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(license_number, '')), 'A');

-- ============================================================================
-- PART 2: Vehicles Full-Text Search
-- ============================================================================

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION vehicles_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.number, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.vin, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.license_plate, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.make, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicles_search_vector_trigger
    BEFORE INSERT OR UPDATE OF name, number, vin, license_plate, make, model ON vehicles
    FOR EACH ROW EXECUTE FUNCTION vehicles_search_vector_update();

CREATE INDEX idx_vehicles_search_vector ON vehicles USING GIN(search_vector);
CREATE INDEX idx_vehicles_vin_trgm ON vehicles USING GIN(vin gin_trgm_ops);

UPDATE vehicles SET search_vector =
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(number, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(vin, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(license_plate, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(make, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(model, '')), 'B');

-- ============================================================================
-- PART 3: Work Orders Full-Text Search
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION work_orders_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.number, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_orders_search_vector_trigger
    BEFORE INSERT OR UPDATE OF number, title, description, notes ON work_orders
    FOR EACH ROW EXECUTE FUNCTION work_orders_search_vector_update();

CREATE INDEX idx_work_orders_search_vector ON work_orders USING GIN(search_vector);

UPDATE work_orders SET search_vector =
    setweight(to_tsvector('english', COALESCE(number, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(notes, '')), 'C');

-- ============================================================================
-- PART 4: Vendors Full-Text Search
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION vendors_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.code, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.contact_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.contact_email, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendors_search_vector_trigger
    BEFORE INSERT OR UPDATE OF name, code, contact_name, contact_email ON vendors
    FOR EACH ROW EXECUTE FUNCTION vendors_search_vector_update();

CREATE INDEX idx_vendors_search_vector ON vendors USING GIN(search_vector);

UPDATE vendors SET search_vector =
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(code, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(contact_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(contact_email, '')), 'B');

-- ============================================================================
-- PART 5: Global Search Function
-- ============================================================================

CREATE OR REPLACE FUNCTION global_search(
    p_tenant_id UUID,
    p_query TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    entity_type VARCHAR,
    entity_id UUID,
    entity_name TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (
        -- Drivers
        SELECT
            'driver'::VARCHAR,
            d.id,
            (d.first_name || ' ' || d.last_name)::TEXT,
            ts_rank(d.search_vector, to_tsquery('english', p_query))
        FROM drivers d
        WHERE d.tenant_id = p_tenant_id
          AND d.search_vector @@ to_tsquery('english', p_query)

        UNION ALL

        -- Vehicles
        SELECT
            'vehicle'::VARCHAR,
            v.id,
            v.name::TEXT,
            ts_rank(v.search_vector, to_tsquery('english', p_query))
        FROM vehicles v
        WHERE v.tenant_id = p_tenant_id
          AND v.search_vector @@ to_tsquery('english', p_query)

        UNION ALL

        -- Work Orders
        SELECT
            'work_order'::VARCHAR,
            wo.id,
            wo.title::TEXT,
            ts_rank(wo.search_vector, to_tsquery('english', p_query))
        FROM work_orders wo
        WHERE wo.tenant_id = p_tenant_id
          AND wo.search_vector @@ to_tsquery('english', p_query)

        UNION ALL

        -- Documents
        SELECT
            'document'::VARCHAR,
            doc.id,
            doc.name::TEXT,
            ts_rank(doc.extracted_text_tsv, to_tsquery('english', p_query))
        FROM documents doc
        WHERE doc.tenant_id = p_tenant_id
          AND doc.extracted_text_tsv @@ to_tsquery('english', p_query)
    ) results
    ORDER BY rank DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
