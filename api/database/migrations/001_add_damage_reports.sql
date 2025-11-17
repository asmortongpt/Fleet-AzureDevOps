-- Migration: Add damage_reports table for 3D damage visualization
-- Date: 2025-11-09
-- Description: Adds support for damage reports with TripoSR 3D model generation

-- Check if table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'damage_reports') THEN

        -- Create damage_reports table
        CREATE TABLE damage_reports (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
            vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
            reported_by UUID REFERENCES drivers(id) ON DELETE SET NULL,
            damage_description TEXT NOT NULL,
            damage_severity VARCHAR(20) NOT NULL CHECK (damage_severity IN ('minor', 'moderate', 'severe')),
            damage_location VARCHAR(255),
            photos TEXT[], -- Array of photo URLs
            triposr_task_id VARCHAR(255), -- TripoSR background task ID
            triposr_status VARCHAR(20) DEFAULT 'pending' CHECK (triposr_status IN ('pending', 'processing', 'completed', 'failed')),
            triposr_model_url TEXT, -- URL to generated GLB 3D model
            linked_work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
            inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX idx_damage_reports_tenant ON damage_reports(tenant_id);
        CREATE INDEX idx_damage_reports_vehicle ON damage_reports(vehicle_id);
        CREATE INDEX idx_damage_reports_inspection ON damage_reports(inspection_id);
        CREATE INDEX idx_damage_reports_work_order ON damage_reports(linked_work_order_id);
        CREATE INDEX idx_damage_reports_triposr_status ON damage_reports(triposr_status);
        CREATE INDEX idx_damage_reports_created ON damage_reports(created_at DESC);

        RAISE NOTICE 'damage_reports table created successfully';
    ELSE
        RAISE NOTICE 'damage_reports table already exists, skipping creation';
    END IF;
END $$;

-- Grant permissions (adjust based on your database roles)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON damage_reports TO fleet_app_role;
