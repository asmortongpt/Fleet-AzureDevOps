CREATE TYPE "public"."certification_status" AS ENUM('active', 'expired', 'pending', 'suspended', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('policy', 'manual', 'form', 'report', 'contract', 'invoice', 'receipt', 'certification', 'training', 'safety', 'compliance');--> statement-breakpoint
CREATE TYPE "public"."driver_status" AS ENUM('active', 'inactive', 'suspended', 'terminated', 'on_leave', 'training');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('gasoline', 'diesel', 'electric', 'hybrid', 'propane', 'cng', 'hydrogen');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('minor', 'moderate', 'major', 'critical', 'fatal');--> statement-breakpoint
CREATE TYPE "public"."inspection_type" AS ENUM('pre_trip', 'post_trip', 'annual', 'dot', 'safety', 'emissions', 'special');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('preventive', 'corrective', 'inspection', 'recall', 'upgrade');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'warning', 'error', 'success', 'reminder', 'alert');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'critical', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled', 'on_hold', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SuperAdmin', 'Admin', 'Manager', 'Supervisor', 'Driver', 'Dispatcher', 'Mechanic', 'Viewer');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('active', 'idle', 'charging', 'service', 'emergency', 'offline', 'maintenance', 'retired');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('sedan', 'suv', 'truck', 'van', 'bus', 'emergency', 'construction', 'specialty');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" "notification_type" DEFAULT 'info' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"target_roles" jsonb DEFAULT '[]',
	"published_at" timestamp,
	"expires_at" timestamp,
	"created_by_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_number" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(100) NOT NULL,
	"category" varchar(100),
	"manufacturer" varchar(255),
	"model" varchar(100),
	"serial_number" varchar(100),
	"purchase_date" timestamp,
	"purchase_price" numeric(12, 2),
	"current_value" numeric(12, 2),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"assigned_to_id" uuid,
	"assigned_facility_id" uuid,
	"condition" varchar(50),
	"warranty_expiry_date" timestamp,
	"maintenance_schedule" jsonb,
	"last_maintenance_date" timestamp,
	"next_maintenance_date" timestamp,
	"notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid,
	"entity_snapshot" jsonb,
	"changes" jsonb,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"number" varchar(100),
	"issuing_authority" varchar(255),
	"issued_date" timestamp NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"status" "certification_status" DEFAULT 'active' NOT NULL,
	"document_url" varchar(500),
	"verified_by_id" uuid,
	"verified_at" timestamp,
	"notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charging_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid,
	"station_id" uuid NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration_minutes" integer,
	"energy_delivered_kwh" numeric(10, 3),
	"start_soc_percent" numeric(5, 2),
	"end_soc_percent" numeric(5, 2),
	"cost" numeric(10, 2),
	"payment_method" varchar(50),
	"status" varchar(50) DEFAULT 'in_progress' NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charging_stations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"station_id" varchar(100),
	"type" varchar(50) NOT NULL,
	"facility_id" uuid,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"address" varchar(500),
	"number_of_ports" integer DEFAULT 1 NOT NULL,
	"available_ports" integer DEFAULT 1 NOT NULL,
	"max_power_kw" numeric(8, 2),
	"cost_per_kwh" numeric(8, 4),
	"is_public" boolean DEFAULT false,
	"operating_hours" jsonb,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispatches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"route_id" uuid,
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"dispatcher_id" uuid,
	"type" varchar(50) NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"origin" varchar(255),
	"destination" varchar(255),
	"origin_lat" numeric(10, 7),
	"origin_lng" numeric(10, 7),
	"destination_lat" numeric(10, 7),
	"destination_lng" numeric(10, 7),
	"dispatched_at" timestamp NOT NULL,
	"acknowledged_at" timestamp,
	"arrived_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "document_type" NOT NULL,
	"category" varchar(100),
	"file_url" varchar(500) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"version" varchar(20) DEFAULT '1.0',
	"related_entity_type" varchar(50),
	"related_entity_id" uuid,
	"uploaded_by_id" uuid,
	"expiry_date" timestamp,
	"is_public" boolean DEFAULT false,
	"tags" jsonb DEFAULT '[]',
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"employee_number" varchar(50),
	"license_number" varchar(50) NOT NULL,
	"license_state" varchar(2),
	"license_expiry_date" timestamp NOT NULL,
	"cdl" boolean DEFAULT false NOT NULL,
	"cdl_class" varchar(5),
	"status" "driver_status" DEFAULT 'active' NOT NULL,
	"hire_date" timestamp,
	"termination_date" timestamp,
	"date_of_birth" timestamp,
	"emergency_contact_name" varchar(255),
	"emergency_contact_phone" varchar(20),
	"performance_score" numeric(5, 2) DEFAULT '100.00',
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" varchar(50) NOT NULL,
	"address" varchar(500) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"zip_code" varchar(10) NOT NULL,
	"country" varchar(2) DEFAULT 'US' NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"capacity" integer,
	"current_occupancy" integer DEFAULT 0,
	"contact_name" varchar(255),
	"contact_phone" varchar(20),
	"contact_email" varchar(255),
	"operating_hours" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fuel_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid,
	"transaction_date" timestamp NOT NULL,
	"fuel_type" "fuel_type" NOT NULL,
	"gallons" numeric(10, 3) NOT NULL,
	"cost_per_gallon" numeric(8, 3) NOT NULL,
	"total_cost" numeric(12, 2) NOT NULL,
	"odometer" integer NOT NULL,
	"location" varchar(255),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"vendor_name" varchar(255),
	"receipt_number" varchar(100),
	"receipt_url" varchar(500),
	"payment_method" varchar(50),
	"card_last4" varchar(4),
	"notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geofences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"facility_id" uuid,
	"center_lat" numeric(10, 7),
	"center_lng" numeric(10, 7),
	"radius" numeric(10, 2),
	"polygon" jsonb,
	"color" varchar(7) DEFAULT '#3b82f6',
	"is_active" boolean DEFAULT true NOT NULL,
	"notify_on_entry" boolean DEFAULT false,
	"notify_on_exit" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gps_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"timestamp" timestamp NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"altitude" numeric(10, 2),
	"speed" numeric(6, 2),
	"heading" numeric(5, 2),
	"accuracy" numeric(8, 2),
	"odometer" integer,
	"fuel_level" numeric(5, 2),
	"engine_status" varchar(20),
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"vehicle_id" uuid,
	"driver_id" uuid,
	"type" varchar(50) NOT NULL,
	"severity" "incident_severity" NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"incident_date" timestamp NOT NULL,
	"location" varchar(500),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"description" text NOT NULL,
	"injuries_reported" boolean DEFAULT false,
	"fatalities_reported" boolean DEFAULT false,
	"police_report_number" varchar(100),
	"insurance_claim_number" varchar(100),
	"estimated_cost" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"reported_by_id" uuid,
	"reported_at" timestamp DEFAULT now(),
	"investigated_by_id" uuid,
	"investigation_notes" text,
	"root_cause" text,
	"corrective_actions" text,
	"witness_statements" jsonb,
	"attachments" jsonb,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid,
	"inspector_id" uuid,
	"type" "inspection_type" NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"inspector_name" varchar(255),
	"location" varchar(255),
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"defects_found" integer DEFAULT 0,
	"passed_inspection" boolean DEFAULT true,
	"notes" text,
	"checklist_data" jsonb,
	"signature_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"type" varchar(50) NOT NULL,
	"vendor_id" uuid,
	"purchase_order_id" uuid,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"invoice_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0.00',
	"discount_amount" numeric(12, 2) DEFAULT '0.00',
	"total_amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0.00',
	"balance_due" numeric(12, 2) NOT NULL,
	"payment_method" varchar(50),
	"payment_reference" varchar(100),
	"notes" text,
	"line_items" jsonb,
	"document_url" varchar(500),
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "maintenance_type" NOT NULL,
	"interval_miles" integer,
	"interval_days" integer,
	"last_service_date" timestamp,
	"last_service_mileage" integer,
	"next_service_date" timestamp,
	"next_service_mileage" integer,
	"estimated_cost" numeric(12, 2),
	"estimated_duration" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" "notification_type" DEFAULT 'info' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"related_entity_type" varchar(50),
	"related_entity_id" uuid,
	"action_url" varchar(500),
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"sent_at" timestamp DEFAULT now(),
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parts_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"part_number" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"manufacturer" varchar(255),
	"unit_cost" numeric(10, 2),
	"unit_of_measure" varchar(20) DEFAULT 'each',
	"quantity_on_hand" integer DEFAULT 0 NOT NULL,
	"reorder_point" integer DEFAULT 0,
	"reorder_quantity" integer DEFAULT 0,
	"location_in_warehouse" varchar(100),
	"facility_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"order_date" timestamp NOT NULL,
	"expected_delivery_date" timestamp,
	"actual_delivery_date" timestamp,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0.00',
	"shipping_cost" numeric(12, 2) DEFAULT '0.00',
	"total_amount" numeric(12, 2) NOT NULL,
	"payment_status" varchar(50) DEFAULT 'unpaid',
	"paid_amount" numeric(12, 2) DEFAULT '0.00',
	"requested_by_id" uuid,
	"approved_by_id" uuid,
	"approved_at" timestamp,
	"shipping_address" varchar(500),
	"notes" text,
	"line_items" jsonb,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"number" varchar(50),
	"description" text,
	"type" varchar(50),
	"status" "status" DEFAULT 'pending' NOT NULL,
	"assigned_vehicle_id" uuid,
	"assigned_driver_id" uuid,
	"start_facility_id" uuid,
	"end_facility_id" uuid,
	"scheduled_start_time" timestamp,
	"scheduled_end_time" timestamp,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"estimated_distance" numeric(10, 2),
	"actual_distance" numeric(10, 2),
	"estimated_duration" integer,
	"actual_duration" integer,
	"waypoints" jsonb,
	"optimized_route" jsonb,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50),
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"assigned_to_id" uuid,
	"created_by_id" uuid,
	"related_entity_type" varchar(50),
	"related_entity_id" uuid,
	"due_date" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetry_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"timestamp" timestamp NOT NULL,
	"engine_rpm" integer,
	"engine_temperature" numeric(5, 2),
	"battery_voltage" numeric(4, 2),
	"fuel_consumption_rate" numeric(6, 2),
	"tire_pressure_front_left" numeric(4, 2),
	"tire_pressure_front_right" numeric(4, 2),
	"tire_pressure_rear_left" numeric(4, 2),
	"tire_pressure_rear_right" numeric(4, 2),
	"oil_pressure" numeric(5, 2),
	"transmission_temperature" numeric(5, 2),
	"diagnostic_codes" jsonb,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"domain" varchar(255),
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"billing_email" varchar(255),
	"subscription_tier" varchar(50) DEFAULT 'standard',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "training_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"training_name" varchar(255) NOT NULL,
	"training_type" varchar(100) NOT NULL,
	"provider" varchar(255),
	"instructor_name" varchar(255),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"completion_date" timestamp,
	"status" "status" DEFAULT 'in_progress' NOT NULL,
	"passed" boolean,
	"score" numeric(5, 2),
	"certificate_number" varchar(100),
	"certificate_url" varchar(500),
	"expiry_date" timestamp,
	"hours_completed" numeric(6, 2),
	"cost" numeric(10, 2),
	"notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"role" "user_role" DEFAULT 'Viewer' NOT NULL,
	"azure_ad_object_id" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vin" varchar(17) NOT NULL,
	"name" varchar(255) NOT NULL,
	"number" varchar(50) NOT NULL,
	"type" "vehicle_type" NOT NULL,
	"make" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"year" integer NOT NULL,
	"license_plate" varchar(20) NOT NULL,
	"status" "vehicle_status" DEFAULT 'active' NOT NULL,
	"fuel_type" "fuel_type" NOT NULL,
	"fuel_level" numeric(5, 2) DEFAULT '100.00',
	"odometer" integer DEFAULT 0 NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"location_address" varchar(500),
	"last_service_date" timestamp,
	"next_service_date" timestamp,
	"next_service_mileage" integer,
	"purchase_date" timestamp,
	"purchase_price" numeric(12, 2),
	"current_value" numeric(12, 2),
	"insurance_policy_number" varchar(100),
	"insurance_expiry_date" timestamp,
	"assigned_driver_id" uuid,
	"assigned_facility_id" uuid,
	"metadata" jsonb DEFAULT '{}',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"type" varchar(50) NOT NULL,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"address" varchar(500),
	"city" varchar(100),
	"state" varchar(2),
	"zip_code" varchar(10),
	"country" varchar(2) DEFAULT 'US',
	"website" varchar(255),
	"tax_id" varchar(50),
	"payment_terms" varchar(100),
	"preferred_vendor" boolean DEFAULT false,
	"rating" numeric(3, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" "maintenance_type" NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"assigned_to_id" uuid,
	"requested_by_id" uuid,
	"approved_by_id" uuid,
	"scheduled_start_date" timestamp,
	"scheduled_end_date" timestamp,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"estimated_cost" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"labor_hours" numeric(8, 2),
	"odometer_at_start" integer,
	"odometer_at_end" integer,
	"notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_assigned_facility_id_facilities_id_fk" FOREIGN KEY ("assigned_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charging_sessions" ADD CONSTRAINT "charging_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charging_sessions" ADD CONSTRAINT "charging_sessions_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charging_sessions" ADD CONSTRAINT "charging_sessions_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charging_sessions" ADD CONSTRAINT "charging_sessions_station_id_charging_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."charging_stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charging_stations" ADD CONSTRAINT "charging_stations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charging_stations" ADD CONSTRAINT "charging_stations_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_transactions" ADD CONSTRAINT "fuel_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_transactions" ADD CONSTRAINT "fuel_transactions_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_transactions" ADD CONSTRAINT "fuel_transactions_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gps_tracks" ADD CONSTRAINT "gps_tracks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gps_tracks" ADD CONSTRAINT "gps_tracks_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_inventory" ADD CONSTRAINT "parts_inventory_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_inventory" ADD CONSTRAINT "parts_inventory_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_assigned_vehicle_id_vehicles_id_fk" FOREIGN KEY ("assigned_vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_assigned_driver_id_drivers_id_fk" FOREIGN KEY ("assigned_driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_start_facility_id_facilities_id_fk" FOREIGN KEY ("start_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_end_facility_id_facilities_id_fk" FOREIGN KEY ("end_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetry_data" ADD CONSTRAINT "telemetry_data_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetry_data" ADD CONSTRAINT "telemetry_data_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "announcements_published_at_idx" ON "announcements" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "announcements_expires_at_idx" ON "announcements" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "assets_tenant_asset_number_idx" ON "assets" USING btree ("tenant_id","asset_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_type_idx" ON "assets" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_status_idx" ON "assets" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_facility_idx" ON "assets" USING btree ("assigned_facility_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_idx" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certifications_driver_idx" ON "certifications" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certifications_type_idx" ON "certifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certifications_expiry_idx" ON "certifications" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "charging_sessions_vehicle_idx" ON "charging_sessions" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "charging_sessions_station_idx" ON "charging_sessions" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "charging_sessions_start_time_idx" ON "charging_sessions" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "charging_stations_facility_idx" ON "charging_stations" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "charging_stations_location_idx" ON "charging_stations" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dispatches_route_idx" ON "dispatches" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dispatches_vehicle_idx" ON "dispatches" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dispatches_driver_idx" ON "dispatches" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dispatches_status_idx" ON "dispatches" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dispatches_dispatched_at_idx" ON "dispatches" USING btree ("dispatched_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_type_idx" ON "documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_related_entity_idx" ON "documents" USING btree ("related_entity_type","related_entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_uploaded_by_idx" ON "documents" USING btree ("uploaded_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "drivers_tenant_license_idx" ON "drivers" USING btree ("tenant_id","license_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drivers_tenant_employee_numberx" ON "drivers" USING btree ("tenant_id","employee_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drivers_status_idx" ON "drivers" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "facilities_tenant_code_idx" ON "facilities" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "facilities_location_idx" ON "facilities" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fuel_transactions_vehicle_idx" ON "fuel_transactions" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fuel_transactions_driver_idx" ON "fuel_transactions" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fuel_transactions_date_idx" ON "fuel_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geofences_facility_idx" ON "geofences" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geofences_location_idx" ON "geofences" USING btree ("center_lat","center_lng");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gps_tracks_vehicle_idx" ON "gps_tracks" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gps_tracks_timestamp_idx" ON "gps_tracks" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gps_tracks_location_idx" ON "gps_tracks" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "incidents_tenant_number_idx" ON "incidents" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "incidents_vehicle_idx" ON "incidents" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "incidents_driver_idx" ON "incidents" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "incidents_date_idx" ON "incidents" USING btree ("incident_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "incidents_severity_idx" ON "incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inspections_vehicle_idx" ON "inspections" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inspections_driver_idx" ON "inspections" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inspections_type_idx" ON "inspections" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inspections_started_at_idx" ON "inspections" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_tenant_number_idx" ON "invoices" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_vendor_idx" ON "invoices" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_invoice_date_idx" ON "invoices" USING btree ("invoice_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_schedules_vehicle_idx" ON "maintenance_schedules" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_schedules_next_service_idx" ON "maintenance_schedules" USING btree ("next_service_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_sent_at_idx" ON "notifications" USING btree ("sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "parts_inventory_tenant_part_number_idx" ON "parts_inventory" USING btree ("tenant_id","part_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parts_inventory_category_idx" ON "parts_inventory" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parts_inventory_facility_idx" ON "parts_inventory" USING btree ("facility_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "purchase_orders_tenant_number_idx" ON "purchase_orders" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchase_orders_vendor_idx" ON "purchase_orders" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchase_orders_status_idx" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchase_orders_order_date_idx" ON "purchase_orders" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_tenant_number_idx" ON "routes" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_vehicle_idx" ON "routes" USING btree ("assigned_vehicle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_driver_idx" ON "routes" USING btree ("assigned_driver_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_status_idx" ON "routes" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_assigned_to_idx" ON "tasks" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_due_date_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telemetry_data_vehicle_idx" ON "telemetry_data" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telemetry_data_timestamp_idx" ON "telemetry_data" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenants_domain_idx" ON "tenants" USING btree ("domain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_records_driver_idx" ON "training_records" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_records_type_idx" ON "training_records" USING btree ("training_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_records_date_idx" ON "training_records" USING btree ("start_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_tenant_email_idx" ON "users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_azure_ad_idx" ON "users" USING btree ("azure_ad_object_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vehicles_tenant_vin_idx" ON "vehicles" USING btree ("tenant_id","vin");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vehicles_tenant_number_idx" ON "vehicles" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicles_status_idx" ON "vehicles" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicles_location_idx" ON "vehicles" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vendors_tenant_code_idx" ON "vendors" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vendors_type_idx" ON "vendors" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "work_orders_tenant_number_idx" ON "work_orders" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_orders_vehicle_idx" ON "work_orders" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_orders_status_idx" ON "work_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_orders_priority_idx" ON "work_orders" USING btree ("priority");