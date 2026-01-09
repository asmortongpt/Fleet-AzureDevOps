-- ============================================================================
-- Migration: 011_asset_management_3d.sql
-- Description: Asset Management & 3D Model Integration
-- Author: Claude Code
-- Date: 2026-01-08
-- ============================================================================
-- Tables: 5
--   1. asset_tags - Physical asset tracking (barcode/RFID/NFC)
--   2. asset_transfers - Asset custody chain and movement history
--   3. turbosquid_models - TurboSquid 3D model library integration
--   4. triposr_3d_generations - TripoSR AI-generated 3D models from photos
--   5. meshy_ai_generations - Meshy.AI text-to-3D generation
-- ============================================================================

-- ============================================================================
-- Table: asset_tags
-- Purpose: Physical asset identification and tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Asset identification
    tag_number VARCHAR(100) NOT NULL UNIQUE,
    tag_type VARCHAR(20) NOT NULL CHECK (tag_type IN ('barcode', 'qr_code', 'rfid', 'nfc', 'ble_beacon')),
    tag_format VARCHAR(50),  -- 'Code128', 'QR', 'EPC_Gen2', 'NFC_Type2', etc.
    tag_data TEXT NOT NULL,  -- Actual barcode/RFID hex data

    -- Linked entity
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'vehicle', 'equipment', 'tool', 'part', 'container', 'facility', 'driver_badge'
    )),
    entity_id UUID NOT NULL,

    -- Physical tag details
    manufacturer VARCHAR(100),
    model_number VARCHAR(100),
    serial_number VARCHAR(100),

    -- Installation tracking
    installed_at TIMESTAMPTZ,
    installed_by UUID REFERENCES users(id),
    installation_location TEXT,  -- 'Dashboard', 'Windshield', 'Asset itself', etc.

    -- Tag status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'inactive', 'damaged', 'lost', 'replaced', 'decommissioned'
    )),
    last_scanned_at TIMESTAMPTZ,
    last_scanned_by UUID REFERENCES users(id),
    last_scan_location JSONB,  -- {latitude, longitude, address}
    scan_count INTEGER DEFAULT 0,

    -- RFID/NFC specific
    read_range_meters DECIMAL(5, 2),  -- Max read range
    frequency_mhz DECIMAL(8, 2),  -- Operating frequency
    memory_bytes INTEGER,
    is_read_only BOOLEAN DEFAULT FALSE,
    encryption_enabled BOOLEAN DEFAULT FALSE,

    -- Maintenance
    battery_level_percent INTEGER CHECK (battery_level_percent >= 0 AND battery_level_percent <= 100),
    battery_last_checked TIMESTAMPTZ,
    battery_expected_life_days INTEGER,
    replacement_due_date DATE,

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_tag_number_per_tenant UNIQUE (tenant_id, tag_number)
);

-- Indexes
CREATE INDEX idx_asset_tags_tenant ON asset_tags(tenant_id);
CREATE INDEX idx_asset_tags_entity ON asset_tags(entity_type, entity_id);
CREATE INDEX idx_asset_tags_status ON asset_tags(status) WHERE status = 'active';
CREATE INDEX idx_asset_tags_last_scanned ON asset_tags(last_scanned_at DESC);
CREATE INDEX idx_asset_tags_tag_data ON asset_tags USING hash(tag_data);

-- Trigger: Update timestamp
CREATE TRIGGER update_asset_tags_timestamp
    BEFORE UPDATE ON asset_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE asset_tags IS 'Physical asset tracking using barcodes, QR codes, RFID, NFC, and BLE beacons';
COMMENT ON COLUMN asset_tags.tag_data IS 'Raw tag data - barcode string, RFID hex, NFC UID, etc.';
COMMENT ON COLUMN asset_tags.scan_count IS 'Total number of times this tag has been scanned';

-- ============================================================================
-- Table: asset_transfers
-- Purpose: Asset movement and custody chain tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Transfer identification
    transfer_number VARCHAR(50) NOT NULL,
    transfer_type VARCHAR(30) NOT NULL CHECK (transfer_type IN (
        'assignment', 'reassignment', 'loan', 'return', 'relocation',
        'disposal', 'donation', 'sale', 'repair', 'maintenance'
    )),

    -- Asset being transferred
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN (
        'vehicle', 'equipment', 'tool', 'part', 'container'
    )),
    asset_id UUID NOT NULL,

    -- Transfer parties
    from_type VARCHAR(30) CHECK (from_type IN (
        'driver', 'department', 'location', 'vendor', 'warehouse', 'shop'
    )),
    from_id UUID,
    from_name TEXT,
    from_signature TEXT,  -- Base64 encoded signature image
    from_signed_at TIMESTAMPTZ,

    to_type VARCHAR(30) CHECK (to_type IN (
        'driver', 'department', 'location', 'vendor', 'warehouse', 'shop'
    )),
    to_id UUID,
    to_name TEXT,
    to_signature TEXT,  -- Base64 encoded signature image
    to_signed_at TIMESTAMPTZ,

    -- Transfer details
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_return_date DATE,
    actual_return_date DATE,
    is_permanent BOOLEAN DEFAULT TRUE,

    -- Condition tracking
    condition_at_transfer VARCHAR(20) CHECK (condition_at_transfer IN (
        'excellent', 'good', 'fair', 'poor', 'damaged'
    )),
    condition_notes TEXT,
    condition_photos JSONB DEFAULT '[]'::jsonb,  -- Array of {url, thumbnail_url, caption}

    -- Odometer/hours at transfer (for vehicles/equipment)
    odometer_reading INTEGER,
    engine_hours DECIMAL(10, 2),

    -- Inspection checklist
    pre_transfer_inspection JSONB,  -- {checklist_id, items: [{item, status, notes}]}
    post_transfer_inspection JSONB,

    -- Financial
    transfer_cost DECIMAL(10, 2),
    deposit_amount DECIMAL(10, 2),
    deposit_returned BOOLEAN DEFAULT FALSE,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_transit', 'completed', 'cancelled', 'disputed'
    )),

    -- Approvals
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,

    -- Linked work orders or requests
    work_order_id UUID,  -- Link to work order if transfer is for repair/maintenance
    purchase_order_id UUID,  -- Link to PO if transfer involves purchase

    -- Metadata
    reason TEXT,
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_transfer_number_per_tenant UNIQUE (tenant_id, transfer_number)
);

-- Indexes
CREATE INDEX idx_asset_transfers_tenant ON asset_transfers(tenant_id);
CREATE INDEX idx_asset_transfers_asset ON asset_transfers(asset_type, asset_id);
CREATE INDEX idx_asset_transfers_from ON asset_transfers(from_type, from_id);
CREATE INDEX idx_asset_transfers_to ON asset_transfers(to_type, to_id);
CREATE INDEX idx_asset_transfers_date ON asset_transfers(transfer_date DESC);
CREATE INDEX idx_asset_transfers_status ON asset_transfers(status) WHERE status IN ('pending', 'in_transit');
CREATE INDEX idx_asset_transfers_expected_return ON asset_transfers(expected_return_date)
    WHERE expected_return_date IS NOT NULL AND actual_return_date IS NULL;

-- Trigger: Update timestamp
CREATE TRIGGER update_asset_transfers_timestamp
    BEFORE UPDATE ON asset_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-generate transfer number
CREATE OR REPLACE FUNCTION generate_transfer_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transfer_number IS NULL OR NEW.transfer_number = '' THEN
        NEW.transfer_number := 'TRF-' || TO_CHAR(NEW.transfer_date, 'YYYYMMDD') || '-' ||
                               LPAD(NEXTVAL('transfer_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS transfer_number_seq START 1;

CREATE TRIGGER auto_generate_transfer_number
    BEFORE INSERT ON asset_transfers
    FOR EACH ROW
    EXECUTE FUNCTION generate_transfer_number();

-- Comments
COMMENT ON TABLE asset_transfers IS 'Asset custody chain and movement tracking with digital signatures';
COMMENT ON COLUMN asset_transfers.from_signature IS 'Base64 encoded signature image from transferring party';
COMMENT ON COLUMN asset_transfers.to_signature IS 'Base64 encoded signature image from receiving party';

-- ============================================================================
-- Table: turbosquid_models
-- Purpose: TurboSquid 3D model library integration
-- ============================================================================

CREATE TABLE IF NOT EXISTS turbosquid_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- TurboSquid identification
    turbosquid_id VARCHAR(50) UNIQUE,
    turbosquid_url TEXT,
    product_title TEXT NOT NULL,
    artist_name VARCHAR(200),
    artist_profile_url TEXT,

    -- Model details
    model_category VARCHAR(100),  -- 'Vehicles', 'Equipment', 'Parts', etc.
    model_subcategory VARCHAR(100),
    file_formats TEXT[] DEFAULT '{}',  -- ['fbx', 'obj', 'max', 'blend', 'gltf']
    polygon_count INTEGER,
    vertex_count INTEGER,

    -- Quality and features
    quality_rating VARCHAR(20) CHECK (quality_rating IN ('basic', 'standard', 'premium', 'professional')),
    has_textures BOOLEAN DEFAULT FALSE,
    has_materials BOOLEAN DEFAULT FALSE,
    has_rigging BOOLEAN DEFAULT FALSE,
    has_animation BOOLEAN DEFAULT FALSE,
    is_pbr BOOLEAN DEFAULT FALSE,  -- Physically Based Rendering
    is_low_poly BOOLEAN DEFAULT FALSE,

    -- Dimensions
    real_world_scale BOOLEAN DEFAULT FALSE,
    dimensions_meters JSONB,  -- {length, width, height}

    -- Licensing
    license_type VARCHAR(50) CHECK (license_type IN (
        'royalty_free', 'editorial', 'extended', 'exclusive'
    )),
    commercial_use_allowed BOOLEAN DEFAULT TRUE,
    redistribution_allowed BOOLEAN DEFAULT FALSE,

    -- Purchase info
    price_usd DECIMAL(10, 2),
    purchased_at TIMESTAMPTZ,
    purchased_by UUID REFERENCES users(id),
    license_agreement_url TEXT,

    -- File storage
    downloaded BOOLEAN DEFAULT FALSE,
    download_url TEXT,
    local_storage_path TEXT,
    file_size_mb DECIMAL(10, 2),

    -- Usage tracking
    linked_vehicles UUID[],  -- Array of vehicle IDs using this model
    linked_equipment UUID[],
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    -- Preview
    thumbnail_url TEXT,
    preview_images TEXT[] DEFAULT '{}',
    preview_video_url TEXT,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_turbosquid_models_tenant ON turbosquid_models(tenant_id);
CREATE INDEX idx_turbosquid_models_category ON turbosquid_models(model_category, model_subcategory);
CREATE INDEX idx_turbosquid_models_purchased ON turbosquid_models(purchased_at DESC) WHERE purchased_at IS NOT NULL;
CREATE INDEX idx_turbosquid_models_tags ON turbosquid_models USING GIN(tags);
CREATE INDEX idx_turbosquid_models_linked_vehicles ON turbosquid_models USING GIN(linked_vehicles);

-- Trigger: Update timestamp
CREATE TRIGGER update_turbosquid_models_timestamp
    BEFORE UPDATE ON turbosquid_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE turbosquid_models IS 'TurboSquid 3D model library integration for professional vehicle and equipment models';
COMMENT ON COLUMN turbosquid_models.is_pbr IS 'Physically Based Rendering - realistic material properties';
COMMENT ON COLUMN turbosquid_models.linked_vehicles IS 'Array of vehicle UUIDs that use this 3D model';

-- ============================================================================
-- Table: triposr_3d_generations
-- Purpose: TripoSR AI-generated 3D models from photos
-- ============================================================================

CREATE TABLE IF NOT EXISTS triposr_3d_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Generation identification
    generation_number VARCHAR(50) NOT NULL,
    generation_status VARCHAR(30) DEFAULT 'pending' CHECK (generation_status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled'
    )),

    -- Source context
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN (
        'damage_report', 'inspection', 'vehicle_photo', 'part_photo', 'accident_scene'
    )),
    source_id UUID NOT NULL,  -- ID of damage report, inspection, etc.

    -- Input images
    input_images JSONB NOT NULL,  -- [{url, angle, quality_score, is_primary}]
    image_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(input_images)) STORED,
    primary_image_url TEXT,

    -- TripoSR API details
    triposr_job_id VARCHAR(100),
    triposr_model_version VARCHAR(50) DEFAULT 'v1.0',
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_duration_seconds INTEGER,

    -- Generation parameters
    quality_preset VARCHAR(20) DEFAULT 'balanced' CHECK (quality_preset IN ('fast', 'balanced', 'high_quality')),
    target_polygon_count INTEGER DEFAULT 50000,
    texture_resolution VARCHAR(20) DEFAULT '2048x2048',
    reconstruction_method VARCHAR(30) DEFAULT 'photogrammetry',

    -- Output model
    output_format VARCHAR(20) DEFAULT 'glb' CHECK (output_format IN ('glb', 'gltf', 'obj', 'fbx', 'usdz')),
    model_url TEXT,
    model_size_mb DECIMAL(10, 2),
    actual_polygon_count INTEGER,
    actual_vertex_count INTEGER,
    has_texture BOOLEAN DEFAULT TRUE,

    -- Quality metrics
    reconstruction_quality_score DECIMAL(3, 2) CHECK (reconstruction_quality_score >= 0 AND reconstruction_quality_score <= 1),
    coverage_percent INTEGER,  -- Percentage of object successfully reconstructed
    point_cloud_density INTEGER,
    texture_quality_score DECIMAL(3, 2),

    -- Model characteristics
    dimensions_meters JSONB,  -- {length, width, height, volume}
    bounding_box JSONB,  -- {min: {x, y, z}, max: {x, y, z}}
    center_point JSONB,  -- {x, y, z}
    orientation JSONB,  -- {roll, pitch, yaw}

    -- Usage and linking
    linked_vehicle_id UUID,
    linked_damage_report_id UUID,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,

    -- AI analysis (from model)
    detected_damage_severity VARCHAR(20) CHECK (detected_damage_severity IN (
        'none', 'minor', 'moderate', 'severe', 'total_loss'
    )),
    detected_damage_areas TEXT[],  -- ['front_bumper', 'hood', 'left_fender']
    estimated_repair_cost DECIMAL(10, 2),
    confidence_scores JSONB,  -- {damage_detection: 0.95, cost_estimate: 0.82}

    -- Preview
    thumbnail_url TEXT,
    preview_video_url TEXT,  -- 360° preview video

    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_generation_number_per_tenant UNIQUE (tenant_id, generation_number)
);

-- Indexes
CREATE INDEX idx_triposr_tenant ON triposr_3d_generations(tenant_id);
CREATE INDEX idx_triposr_source ON triposr_3d_generations(source_type, source_id);
CREATE INDEX idx_triposr_status ON triposr_3d_generations(generation_status)
    WHERE generation_status IN ('pending', 'processing');
CREATE INDEX idx_triposr_completed ON triposr_3d_generations(processing_completed_at DESC)
    WHERE generation_status = 'completed';
CREATE INDEX idx_triposr_vehicle ON triposr_3d_generations(linked_vehicle_id)
    WHERE linked_vehicle_id IS NOT NULL;
CREATE INDEX idx_triposr_damage_report ON triposr_3d_generations(linked_damage_report_id)
    WHERE linked_damage_report_id IS NOT NULL;

-- Trigger: Update timestamp
CREATE TRIGGER update_triposr_timestamp
    BEFORE UPDATE ON triposr_3d_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-generate generation number
CREATE OR REPLACE FUNCTION generate_triposr_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.generation_number IS NULL OR NEW.generation_number = '' THEN
        NEW.generation_number := 'TRIPOSR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                                LPAD(NEXTVAL('triposr_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS triposr_number_seq START 1;

CREATE TRIGGER auto_generate_triposr_number
    BEFORE INSERT ON triposr_3d_generations
    FOR EACH ROW
    EXECUTE FUNCTION generate_triposr_number();

-- Trigger: Calculate processing duration
CREATE OR REPLACE FUNCTION calculate_triposr_duration() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.processing_completed_at IS NOT NULL AND NEW.processing_started_at IS NOT NULL THEN
        NEW.processing_duration_seconds := EXTRACT(EPOCH FROM (NEW.processing_completed_at - NEW.processing_started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_triposr_duration
    BEFORE INSERT OR UPDATE ON triposr_3d_generations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_triposr_duration();

-- Comments
COMMENT ON TABLE triposr_3d_generations IS 'TripoSR AI-generated 3D models from damage photos for insurance claims and repair estimation';
COMMENT ON COLUMN triposr_3d_generations.coverage_percent IS 'Percentage of object successfully reconstructed from photos';
COMMENT ON COLUMN triposr_3d_generations.estimated_repair_cost IS 'AI-estimated repair cost based on 3D damage analysis';

-- ============================================================================
-- Table: meshy_ai_generations
-- Purpose: Meshy.AI text-to-3D model generation
-- ============================================================================

CREATE TABLE IF NOT EXISTS meshy_ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Generation identification
    generation_number VARCHAR(50) NOT NULL,
    generation_status VARCHAR(30) DEFAULT 'pending' CHECK (generation_status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled'
    )),

    -- Generation type
    generation_type VARCHAR(30) NOT NULL CHECK (generation_type IN (
        'text_to_3d', 'image_to_3d', 'text_to_texture', 'enhancement'
    )),

    -- Input prompt (for text-to-3D)
    text_prompt TEXT,
    prompt_language VARCHAR(10) DEFAULT 'en',
    negative_prompt TEXT,  -- What NOT to include

    -- Input image (for image-to-3D)
    input_image_url TEXT,
    reference_images TEXT[] DEFAULT '{}',

    -- Meshy.AI API details
    meshy_task_id VARCHAR(100),
    meshy_model_version VARCHAR(50) DEFAULT 'v2.0',
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_duration_seconds INTEGER,

    -- Generation parameters
    art_style VARCHAR(30) CHECK (art_style IN (
        'realistic', 'cartoon', 'low_poly', 'isometric', 'sci_fi', 'fantasy'
    )),
    quality_preset VARCHAR(20) DEFAULT 'balanced' CHECK (quality_preset IN ('draft', 'balanced', 'high_quality', 'ultra')),
    target_polygon_count INTEGER DEFAULT 10000,
    enable_pbr BOOLEAN DEFAULT TRUE,
    seed INTEGER,  -- For reproducible generations

    -- Output model
    output_format VARCHAR(20) DEFAULT 'glb' CHECK (output_format IN ('glb', 'gltf', 'obj', 'fbx', 'usdz')),
    model_url TEXT,
    model_size_mb DECIMAL(10, 2),
    actual_polygon_count INTEGER,
    actual_vertex_count INTEGER,

    -- Model characteristics
    dimensions_meters JSONB,  -- {length, width, height}
    has_texture BOOLEAN DEFAULT TRUE,
    has_materials BOOLEAN DEFAULT TRUE,
    has_rigging BOOLEAN DEFAULT FALSE,

    -- Quality assessment
    generation_quality_score DECIMAL(3, 2) CHECK (generation_quality_score >= 0 AND generation_quality_score <= 1),
    prompt_adherence_score DECIMAL(3, 2),  -- How well it matches the prompt
    aesthetic_score DECIMAL(3, 2),

    -- Use case and context
    use_case VARCHAR(50) CHECK (use_case IN (
        'vehicle_concept', 'part_visualization', 'training_simulation',
        'marketing_material', 'damage_mockup', 'facility_planning'
    )),
    linked_entity_type VARCHAR(50),
    linked_entity_id UUID,

    -- Usage tracking
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    download_count INTEGER DEFAULT 0,

    -- Variations
    parent_generation_id UUID REFERENCES meshy_ai_generations(id),  -- If this is a variation
    variation_count INTEGER DEFAULT 0,  -- How many variations were created from this

    -- Preview
    thumbnail_url TEXT,
    preview_images TEXT[] DEFAULT '{}',  -- Multiple angle previews
    preview_video_url TEXT,  -- 360° turntable

    -- Cost tracking
    credits_used INTEGER,
    cost_usd DECIMAL(10, 2),

    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_generation_number_per_tenant UNIQUE (tenant_id, generation_number)
);

-- Indexes
CREATE INDEX idx_meshy_tenant ON meshy_ai_generations(tenant_id);
CREATE INDEX idx_meshy_type ON meshy_ai_generations(generation_type, use_case);
CREATE INDEX idx_meshy_status ON meshy_ai_generations(generation_status)
    WHERE generation_status IN ('pending', 'processing');
CREATE INDEX idx_meshy_completed ON meshy_ai_generations(processing_completed_at DESC)
    WHERE generation_status = 'completed';
CREATE INDEX idx_meshy_linked_entity ON meshy_ai_generations(linked_entity_type, linked_entity_id);
CREATE INDEX idx_meshy_parent ON meshy_ai_generations(parent_generation_id)
    WHERE parent_generation_id IS NOT NULL;
CREATE INDEX idx_meshy_tags ON meshy_ai_generations USING GIN(tags);
CREATE INDEX idx_meshy_prompt_search ON meshy_ai_generations USING GIN(to_tsvector('english', text_prompt));

-- Trigger: Update timestamp
CREATE TRIGGER update_meshy_timestamp
    BEFORE UPDATE ON meshy_ai_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-generate generation number
CREATE OR REPLACE FUNCTION generate_meshy_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.generation_number IS NULL OR NEW.generation_number = '' THEN
        NEW.generation_number := 'MESHY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                                LPAD(NEXTVAL('meshy_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS meshy_number_seq START 1;

CREATE TRIGGER auto_generate_meshy_number
    BEFORE INSERT ON meshy_ai_generations
    FOR EACH ROW
    EXECUTE FUNCTION generate_meshy_number();

-- Trigger: Calculate processing duration
CREATE OR REPLACE FUNCTION calculate_meshy_duration() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.processing_completed_at IS NOT NULL AND NEW.processing_started_at IS NOT NULL THEN
        NEW.processing_duration_seconds := EXTRACT(EPOCH FROM (NEW.processing_completed_at - NEW.processing_started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_meshy_duration
    BEFORE INSERT OR UPDATE ON meshy_ai_generations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_meshy_duration();

-- Trigger: Update parent variation count
CREATE OR REPLACE FUNCTION update_parent_variation_count() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_generation_id IS NOT NULL THEN
        UPDATE meshy_ai_generations
        SET variation_count = variation_count + 1
        WHERE id = NEW.parent_generation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_parent_variations
    AFTER INSERT ON meshy_ai_generations
    FOR EACH ROW
    WHEN (NEW.parent_generation_id IS NOT NULL)
    EXECUTE FUNCTION update_parent_variation_count();

-- Comments
COMMENT ON TABLE meshy_ai_generations IS 'Meshy.AI text-to-3D and image-to-3D model generation for rapid prototyping and visualization';
COMMENT ON COLUMN meshy_ai_generations.negative_prompt IS 'Specify elements to exclude from generation (e.g., "no text, no watermarks")';
COMMENT ON COLUMN meshy_ai_generations.seed IS 'Random seed for reproducible generations - use same seed to get similar results';
COMMENT ON COLUMN meshy_ai_generations.prompt_adherence_score IS 'How accurately the generated model matches the text prompt';

-- ============================================================================
-- Helper function: Get asset current location/assignment
-- ============================================================================

CREATE OR REPLACE FUNCTION get_asset_current_assignment(
    p_asset_type VARCHAR(50),
    p_asset_id UUID
) RETURNS TABLE (
    assignment_type VARCHAR(30),
    assignment_id UUID,
    assignment_name TEXT,
    assigned_since TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        at.to_type,
        at.to_id,
        at.to_name,
        at.to_signed_at
    FROM asset_transfers at
    WHERE at.asset_type = p_asset_type
      AND at.asset_id = p_asset_id
      AND at.status = 'completed'
      AND (at.actual_return_date IS NULL OR at.actual_return_date > CURRENT_DATE)
    ORDER BY at.to_signed_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_asset_current_assignment IS 'Returns current assignment/location for any asset';

-- ============================================================================
-- Helper function: Get 3D model for vehicle
-- ============================================================================

CREATE OR REPLACE FUNCTION get_vehicle_3d_model(
    p_vehicle_id UUID,
    p_prefer_ai_generated BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
    model_source VARCHAR(20),  -- 'turbosquid', 'triposr', 'meshy'
    model_id UUID,
    model_url TEXT,
    thumbnail_url TEXT,
    quality_score DECIMAL(3, 2)
) AS $$
BEGIN
    -- Try AI-generated models first if preferred
    IF p_prefer_ai_generated THEN
        -- Check TripoSR first
        RETURN QUERY
        SELECT
            'triposr'::VARCHAR(20),
            t.id,
            t.model_url,
            t.thumbnail_url,
            t.reconstruction_quality_score
        FROM triposr_3d_generations t
        WHERE t.linked_vehicle_id = p_vehicle_id
          AND t.generation_status = 'completed'
          AND t.is_approved = TRUE
        ORDER BY t.reconstruction_quality_score DESC, t.created_at DESC
        LIMIT 1;

        IF FOUND THEN RETURN; END IF;

        -- Check Meshy.AI
        RETURN QUERY
        SELECT
            'meshy'::VARCHAR(20),
            m.id,
            m.model_url,
            m.thumbnail_url,
            m.generation_quality_score
        FROM meshy_ai_generations m
        WHERE m.linked_entity_type = 'vehicle'
          AND m.linked_entity_id = p_vehicle_id
          AND m.generation_status = 'completed'
          AND m.is_approved = TRUE
        ORDER BY m.generation_quality_score DESC, m.created_at DESC
        LIMIT 1;

        IF FOUND THEN RETURN; END IF;
    END IF;

    -- Fall back to TurboSquid library models
    RETURN QUERY
    SELECT
        'turbosquid'::VARCHAR(20),
        ts.id,
        COALESCE(ts.local_storage_path, ts.download_url),
        ts.thumbnail_url,
        CASE ts.quality_rating
            WHEN 'professional' THEN 1.0
            WHEN 'premium' THEN 0.85
            WHEN 'standard' THEN 0.7
            ELSE 0.5
        END::DECIMAL(3, 2)
    FROM turbosquid_models ts
    WHERE p_vehicle_id = ANY(ts.linked_vehicles)
      AND ts.downloaded = TRUE
    ORDER BY ts.quality_rating DESC, ts.last_used_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_vehicle_3d_model IS 'Returns best available 3D model for a vehicle, preferring AI-generated if requested';

-- ============================================================================
-- END OF MIGRATION 011
-- ============================================================================
