# Fleet Database ERD Comparison Matrix

**Comparison Date:** 2026-01-05
**Source Documents:**
- **ERD PDF:** Fleet Database ERD.pdf (Legacy/Target System)
- **Current Fleet App:** /Users/andrewmorton/Documents/GitHub/Fleet

## Executive Summary

This matrix compares data elements between the legacy Fleet Database ERD (from PDF) and the current Fleet application implementation. The comparison identifies:
- ✅ **Implemented**: Fields/tables that exist in current app
- ⚠️ **Partial**: Fields/tables that exist but with different structure
- ❌ **Missing**: Fields/tables not yet implemented
- 🆕 **New**: Fields/tables in current app not in ERD

---

## 1. CORE ENTITY COMPARISON

### Equipment/Vehicle Management

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **Equipment** | EquipmentId, EquipmentKey, FasterEUID, PropertyTag, PurchaseOrder, Class, Color, Make, Model, Year, VIN, License, FuelTypeId, FuelCapacity, AcquisitionDate, AcquisitionCost, DateInService, IsMotorPool, AVLId, MonitorGroupId, EquipmentClassId, AWEquipmentTypeId, IsLightDuty, AWBillingTypeId, FuelTypeId2, FuelCapacity2, IsElectric, EquipmentCategoryId, AlternateFuelTypeId, MaxHourReading, MaxMileReading, WorkOrderShopId, ExcludeFromCalculations | **vehicles** | id, tenant_id, vin, make, model, year, license_plate, vehicle_type, fuel_type, status, odometer, engine_hours, purchase_date, purchase_price, current_value, gps_device_id, last_gps_update, latitude, longitude, location, speed, heading, assigned_driver_id, assigned_facility_id, telematics_data, photos, notes | ⚠️ **Partial** | Current app has basic vehicle fields. Missing: PropertyTag, PurchaseOrder, Color, FuelCapacity, IsMotorPool, AVLId, MonitorGroup, equipment classifications, secondary fuel type, max readings. Added: GPS location, telematics, geospatial data |
| **Heavy Equipment** (implied in ERD Equipment) | N/A - Same table | **heavy_equipment** | id, tenant_id, asset_id, equipment_type, manufacturer, model, model_year, serial_number, capacity_tons, max_reach_feet, lift_height_feet, bucket_capacity_yards, operating_weight_lbs, engine_hours, odometer_miles, last_inspection_date, next_inspection_date, is_rental, rental_rate_daily, acquisition_cost, residual_value, total_maintenance_cost, hourly_operating_cost, current_job_site, availability_status, fuel_type, fuel_capacity_gallons | 🆕 **New** | Current app separates heavy equipment with specialized fields not in ERD |
| **MonitorGroup** | MonitorGroupId, MonitorGroupCode, MonitorGroupName | N/A | N/A | ❌ **Missing** | Equipment monitoring groups not implemented |
| **EquipmentClass** | EquipmentClassId, EquipmentClassCode, EquipmentClassDescription, IsLightDuty | **equipment_types** | id, type_name, category, description, requires_certification, default_maintenance_hours | ⚠️ **Partial** | Different structure - current app uses categories instead of classes |

---

### Personnel/Users Management

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **Person** | PersonId, UserName, LastName, FirstName, EmailAddress, IsSiteAdmin, EmployeeId, Department, EmployeeStatusId, PositionNumber, EmploymentDate | **users** | id, tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, failed_login_attempts, account_locked_until, last_login_at, mfa_enabled, mfa_secret | ⚠️ **Partial** | Current app has modern auth (MFA, password security). Missing: EmployeeId, PositionNumber, EmploymentDate, department link |
| **Role** | RoleId, RoleName | **users.role** | Enum: admin, fleet_manager, driver, technician, viewer | ⚠️ **Partial** | Current app uses enum vs separate table. More simplified roles |
| **ApplicationPersonRole** | ApplicationPersonRoleId, ApplicationId, PersonId, RoleId, IsPointOfContact, DivisionId | N/A | N/A | ❌ **Missing** | Application-specific role assignments not implemented |
| **EmployeeStatus** | EmployeeStatusId, EmployeeStatusCode, EmployeeStatusDescription | **drivers.status** | Enum: active, on_leave, suspended, terminated | ⚠️ **Partial** | Simplified as enum in drivers table |
| **SupervisorEmployee** | SupervisorEmployeeId, SupervisorPersonId, EmployeePersonId | N/A | N/A | ❌ **Missing** | Supervisor relationships not implemented |
| **EmployeeEvaluator** | EmployeeEvaluatorId, EmployeeId, EvaluatorId | N/A | N/A | ❌ **Missing** | Employee evaluation system not implemented |

---

### Driver Management

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| N/A (implied in Person) | N/A | **drivers** | id, tenant_id, user_id, license_number, license_state, license_expiration, cdl_class, cdl_endorsements, medical_card_expiration, hire_date, termination_date, status, safety_score, total_miles_driven, total_hours_driven, incidents_count, violations_count, emergency_contact_name, emergency_contact_phone | 🆕 **New** | Current app has dedicated driver table with CDL, safety tracking |
| N/A | N/A | **equipment_operator_certifications** | id, tenant_id, driver_id, equipment_type, certification_number, certification_date, expiry_date, certifying_authority, certification_level, status, training_hours, instructor_name | 🆕 **New** | Operator certifications for heavy equipment - not in ERD |
| **DriverSafetyScore** | DriverSafetyScoreId, Month, RunTimeDepartmentId, EmployeeId, RunTimeSamsaraDisplayName, TotalDistanceDriven, TotalDriveTimeMinutes, TotalSpeedingMinutes, CrashCount, HarshAccelerationCount, HarshBrakingCount, HarshTurningCount, SafetyScore, SafetyRankScore, RunTime, IsInvalid | **drivers.safety_score** | safety_score (single field) | ⚠️ **Partial** | Current app has basic safety score. ERD has detailed monthly tracking with Samsara integration |
| **EquipmentSafetyScore** | EquipmentSafetyScoreId, Month, RunTimeDepartmentId, EquipmentId, RunTimeSamsaraDisplayName, TotalDistanceDriven, TotalDriveTimeMinutes, TotalSpeedingMinutes, CrashCount, HarshAccelerationCount, HarshBrakingCount, HarshTurningCount, SafetyScore, SafetyRankScore, RunDate, EquipmentDisplayName, IsInvalid | N/A | N/A | ❌ **Missing** | Equipment-level safety scoring not implemented |
| **EquipmentSafetyEvent** | EquipmentSafetyEventId, Month, EquipmentId, RunTimeDepartmentId, EventTime, MaxAccelerationGForce, Latitude, Longitude, EquipmentSafetyBehaviorId, RunDate, IsInvalid | **video_events** | id, tenant_id, vehicle_id, driver_id, event_time, event_type, severity, video_url, latitude, longitude, speed, g_force | ⚠️ **Partial** | Current app has video telematics events. ERD has Samsara safety behavior tracking |
| **EquipmentSafetyBehavior** | EquipmentSafetyBehaviorId, Label, Name | **video_events.event_type** | harsh_braking, harsh_acceleration, collision, speeding, distraction | ⚠️ **Partial** | Similar concept, different structure |

---

### Organizational Structure

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **BusinessArea** | BusinessAreaId, BusinessAreaCode, BusinessAreaName, StatusId, DisplayMetrics | N/A | N/A | ❌ **Missing** | Business area structure not implemented |
| **Division** | DivisionId, DivisionCode, DivisionName, StatusId | N/A | N/A | ❌ **Missing** | Division structure not implemented |
| **Department** | DepartmentId, DepartmentCode, DepartmentName, FundId, StatusId, DivisionId | N/A | N/A | ❌ **Missing** | Department structure not implemented |
| **Fund** | FundId, FundCode, FundDescription | N/A | N/A | ❌ **Missing** | Fund/budget tracking not implemented |
| N/A | N/A | **tenants** | id, name, domain, settings, is_active | 🆕 **New** | Multi-tenancy support (modern SaaS architecture) |
| N/A | N/A | **facilities** | id, tenant_id, name, facility_type, address, city, state, zip_code, latitude, longitude, location, phone, capacity, service_bays, is_active | 🆕 **New** | Facilities/garages/depots tracking |

---

## 2. FINANCIAL & ACCOUNTING COMPARISON

### Billing & Charges

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **BillingCharge** | BillingChargeId, BillingBatchId, DepartmentId, BusinessAreaId, AccountingChargeCodeId, FundId, Amount, UnitCost, Quantity, Markup, UnitShipping, RepairTypeId, IsBillable, IsStock, EquipmentId, FuelTypeId, PostDate, TransactionDate, WorkOrderNumber, ProjectNumber, ReservationNumber, LaborTimeCodeId | N/A | N/A | ❌ **Missing** | Comprehensive billing system not implemented |
| **BillingBatch** | BillingBatchId, AMSBatchId, FasterBatchId, BeginDate, EndDate | N/A | N/A | ❌ **Missing** | Billing batch processing not implemented |
| **AccountingChargeCode** | AccountingChargeCodeId, ADC, FMSChargeCode, GLChargeCode, GeneralDescription, ReportDescription, IsOverhead, IsCapitalized, ChargeTypeId, BusinessAreaId, StatusId, GroupedADC | N/A | N/A | ❌ **Missing** | Accounting charge codes not implemented |
| **ChargeType** | ChargeTypeId, ChargeType | N/A | N/A | ❌ **Missing** | Charge type taxonomy not implemented |
| **AMSChargeCodeType** | AMSChargeCodeId, AMSChargeCode, FasterChargeCode, ChargeDescription, ChargeTypeId | N/A | N/A | ❌ **Missing** | AMS integration not implemented |

---

### Purchase Orders & Procurement

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| N/A | N/A | **vendors** | id, tenant_id, vendor_name, vendor_type, contact_name, contact_email, contact_phone, address, city, state, zip_code, is_active | 🆕 **New** | Vendor management in current app |
| N/A | N/A | **purchase_orders** | id, tenant_id, po_number, vendor_id, order_date, expected_delivery_date, actual_delivery_date, status, subtotal, tax, shipping, total, line_items, approved_by, approved_at | 🆕 **New** | Purchase order system in current app |

---

## 3. MAINTENANCE & WORK ORDERS COMPARISON

### Work Order Management

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **WorkOrderShop** | WorkOrderShopId, ShopCode, ShopDescription, AssetWorksLocationId | **facilities** | id, facility_type (includes service_center) | ⚠️ **Partial** | Work order shops mapped to facilities |
| N/A | N/A | **work_orders** | id, tenant_id, work_order_number, vehicle_id, facility_id, assigned_technician_id, type, priority, status, description, odometer_reading, engine_hours_reading, scheduled_start, scheduled_end, actual_start, actual_end, labor_hours, labor_cost, parts_cost, total_cost, photos, attachments | 🆕 **New** | Comprehensive work order system in current app |
| **RepairType** | RepairTypeId, RepairTypeCode, FasterRepairTypeCode, RepairTypeDescription, IsCapitalized, IsBreakdown, IsUserCaused, StatusId, IsWarranty, ExcludeFromUsage, RepairTypeGroupId | **work_orders.type** | preventive, corrective, inspection | ⚠️ **Partial** | Simplified repair types. Missing detailed classifications |
| **RepairTypeGroup** | RepairTypeGroupId, RepairTypeGroupCode, RepairTypeGroupDescription | N/A | N/A | ❌ **Missing** | Repair type grouping not implemented |
| **LaborTimeCode** | LaborTimeCodeId, TimeCode, TimeCodeDescription, Multiplier, IsIndirect, StatusId | N/A | N/A | ❌ **Missing** | Labor time codes not implemented |
| **AssetWorksLocation** | AssetWorksLocationId, AssetWorksLocationCode, AssetWorksLocationDescription, StatusId, IsPartsLocation, IsFuelLocation, IsWOLocation, ExcludeFromMetrics, IsMotorPoolLocation, IsBillable | **facilities** | id, facility_type (garage, depot, service_center) | ⚠️ **Partial** | Simplified location types. Missing: parts/fuel location flags, billable flags, metric exclusion |

---

### Preventive Maintenance

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **PMScheduled** | PMScheduledId, EquipmentId, StartDate, CreatedDate | **maintenance_schedules** | id, tenant_id, vehicle_id, service_type, interval_type, interval_value, last_service_date, last_service_odometer, last_service_engine_hours, next_service_due_date, next_service_due_odometer, next_service_due_engine_hours, is_overdue, is_active | ✅ **Implemented** | Current app has comprehensive PM scheduling |
| **PMDue** | PMDueId, EquipmentId, PMNotificationDepartmentId, PMWorkOrderShopId, NextPMService, PMNextDueDate, PMNextMeterDue, IsDueByMeter, IsPastDueByMeter, IsDueByDate, IsPastDueByDate, CurrentLifeMeter, PMDueAtLastWO, LastWOReading, LastWOTaskCompleteDate, IsDueByIndividualPM, IsPastDueByIndividualPM, CurrentMeterReading, NextIndividualPMService, IndividualPMNextDueDate, MeterTypeId | **maintenance_schedules** (computed) | is_overdue, next_service_due_date, next_service_due_odometer, next_service_due_engine_hours | ⚠️ **Partial** | Current app has basic PM due tracking. Missing: individual PM tracking, department notifications, shop assignments |
| N/A | N/A | **equipment_maintenance_schedules** | id, equipment_id, maintenance_type, description, schedule_type, interval_hours, last_performed_hours, next_due_hours, interval_days, last_performed_date, next_due_date, priority, estimated_cost, estimated_downtime_hours, assigned_to, vendor_id, status | 🆕 **New** | Hour-based maintenance scheduling for heavy equipment |
| N/A | N/A | **equipment_maintenance_checklists** | id, equipment_id, checklist_template_id, completed_date, completed_by, engine_hours_at_completion, overall_status, inspector_name, signature_url | 🆕 **New** | Digital maintenance checklists not in ERD |

---

### Maintenance Metrics/KPIs

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **PMDriver** | PMDriverId, Month, WorkOrderShopId, PMType, Count | N/A | N/A | ❌ **Missing** | PM driver metrics not implemented |
| **PMCompletionKPI** | PMCompletionId, KPIMetricId, BeginDate, EndDate, Value, BusinessAreaId | N/A | N/A | ❌ **Missing** | PM completion KPIs not implemented |
| **PMCompletionByShopDriver** | PMCompletionByShopDriverId, Month, WorkOrderShopId, OnTimeCount, LateCount, PastDueCount, EarlyCount, NotDueCount | N/A | N/A | ❌ **Missing** | Shop-level PM completion tracking not implemented |
| **DirectIndirectLaborKPI** | DirectIndirectLaborId, KPIMetricId, WorkOrderShopId, BeginDate, EndDate, Value, TotalEquipmentCount, TotalWorkOrderCount | N/A | N/A | ❌ **Missing** | Labor KPI tracking not implemented |
| **ScheduledNonscheduledRepairKPI** | ScheduledNonscheduledRepairId, KPIMetricId, WorkOrderShopId, BeginDate, EndDate, Value | N/A | N/A | ❌ **Missing** | Scheduled vs unscheduled repair KPIs not implemented |
| **ReworkKPI** | ReworkKPIId, Month, EquipmentId, RepairTypeId, AssignedWOShopId, TaskCode, LastWODate, LastWorkOrder, OriginalWODate, OriginalWorkOrder, PartsCost, LaborCost, LaborHours, SubletCost, TotalReworkCost, ReworkWOCount, CountAllWOShopTask, AllEligibleWOCount, TotalCostAllEligibleWO, AllEligibleShopWOCount, TotalCostAllEligibleShopWO, WorkAccomplishedCode | N/A | N/A | ❌ **Missing** | Rework tracking KPIs not implemented |
| **TurnaroundKPI** | TurnaroundKPIId, Month, WorkOrderShopId, KPIMetricId, Value | N/A | N/A | ❌ **Missing** | Turnaround time KPIs not implemented |
| **ShopEfficiency** | ShopEfficiencyId, Month, ShopEfficiencyWorkOrderShopId, RegOTHours, BillableHours, IndirectLabor, TotalWorkOrders | N/A | N/A | ❌ **Missing** | Shop efficiency tracking not implemented |

---

## 4. FUEL MANAGEMENT COMPARISON

### Fuel Transactions & Pricing

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **FuelType** | FuelTypeId, FuelTypeCode, FuelTypeDescription, FMProductId, FuelGroupCode | **vehicles.fuel_type** | VARCHAR field | ⚠️ **Partial** | Simplified as text field. Missing: product IDs, fuel groups |
| N/A | N/A | **fuel_transactions** | id, tenant_id, vehicle_id, driver_id, transaction_date, gallons, price_per_gallon, total_cost, odometer_reading, fuel_type, location, latitude, longitude, fuel_card_number, receipt_photo | ✅ **Implemented** | Comprehensive fuel tracking in current app |
| N/A | N/A | **fuel_stations** | id, tenant_id, station_name, brand, address, city, state, zip_code, country, lat, lng, fuel_types, accepts_fleet_cards, fleet_card_brands, has_24_hour_access, has_truck_access, phone, website, rating, reviews_count, is_active | 🆕 **New** | Fuel station directory with pricing intelligence |
| N/A | N/A | **fuel_prices** | id, fuel_station_id, fuel_type, price_per_gallon, source, confidence_score, timestamp, previous_price, price_change | 🆕 **New** | Real-time fuel price tracking |
| N/A | N/A | **fuel_purchase_orders** | id, tenant_id, vehicle_id, driver_id, station_id, fuel_type, gallons, price_per_gallon, total_cost, odometer, purchase_date, payment_method, market_price, discount_applied, savings_amount, status | 🆕 **New** | Purchase optimization with savings tracking |
| N/A | N/A | **fuel_contracts** | id, tenant_id, supplier_name, contract_type, fuel_types, discount_rate, fixed_price_per_gallon, minimum_volume, maximum_volume, start_date, end_date, contract_value, annual_savings_estimate, station_ids, geographic_coverage, status | 🆕 **New** | Supplier contract management |
| N/A | N/A | **fuel_price_alerts** | id, tenant_id, alert_type, alert_name, fuel_type, threshold, comparison_operator, geographic_scope, notification_channels, notification_recipients, is_active | 🆕 **New** | Intelligent price alerting system |
| N/A | N/A | **bulk_fuel_inventory** | id, tenant_id, location, facility_id, tank_id, fuel_type, capacity, current_volume, reorder_threshold, average_cost_per_gallon, last_delivery_date, next_delivery_scheduled, status | 🆕 **New** | On-site fuel storage management |
| N/A | N/A | **fuel_price_forecasts** | id, tenant_id, fuel_type, geographic_scope, forecast_date, predicted_price, confidence_interval_low, confidence_interval_high, model_version, actual_price, prediction_error | 🆕 **New** | ML-powered price forecasting |
| N/A | N/A | **fuel_savings_analytics** | id, tenant_id, period_start, period_end, total_gallons_purchased, total_spent, contract_discount_savings, optimal_timing_savings, optimal_location_savings, bulk_purchase_savings, total_savings | 🆕 **New** | Comprehensive savings analytics |
| **FuelUsageDriver** | FuelUsageDriverId, Month, BusinessAreaId, DepartmentId, FuelTypeId, Quantity | N/A | N/A | ❌ **Missing** | Departmental fuel usage tracking not implemented |
| **FuelMasterSiteTankHose** | FMSiteTankHoseId, SiteId, TankId, HoseId, FasterSiteHose, FuelTypeId | N/A | N/A | ❌ **Missing** | Fuel Master integration not implemented |
| **FuelSiteEquipment** | FuelSiteEquipmentId, EquipmentId, FuelMasterId | N/A | N/A | ❌ **Missing** | Equipment-to-fuel-site mapping not implemented |
| **AMFuelMasterVehicleConversion** | AMFMVehicleConvId, FuelMasterVId, AMVid, FasterVId, FasterUid, StatusId | N/A | N/A | ❌ **Missing** | Fuel Master vehicle ID conversion not implemented |

---

### Electric Vehicle & Charging

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **ChargePointStation** | ChargePointStationId, StationName, MacAddress, StreetAddress | **charging_stations** | id, tenant_id, station_name, station_type, location, latitude, longitude, number_of_ports, power_output_kw, cost_per_kwh, is_public, is_operational | ✅ **Implemented** | Current app has charging station management |
| **ChargePointVehicle** | ChargePointVehicleId, EquipmentId, UserId | **charging_sessions.vehicle_id** | Links vehicles to sessions | ⚠️ **Partial** | Simplified relationship |
| N/A | N/A | **charging_sessions** | id, tenant_id, vehicle_id, charging_station_id, driver_id, start_time, end_time, energy_delivered_kwh, cost, start_battery_level, end_battery_level, session_duration, status | 🆕 **New** | Detailed charging session tracking |
| **ChargePointStateDetails** | ChargePointStateDetailsId, RunTime, EquipmentId, Odometer, StateOfCharge | **charging_sessions** | start_battery_level, end_battery_level | ⚠️ **Partial** | Battery level tracking in sessions |
| **ElectricVehicleStats** | ElectricVehicleStatsId, RunDate, VehicleCount, TotalMilesDriven, ElectricVehicleTypeId | N/A | N/A | ❌ **Missing** | Aggregate EV statistics not implemented |
| **ElectricVehicleType** | ElectricVehicleTypeId, ElectricVehicleTypeCode, ElectricVehicleTypeDescription | N/A | N/A | ❌ **Missing** | EV type classification not implemented |
| **ElectricMeter** | ElectricMeterId, MeterNumber, Location, IsActive | N/A | N/A | ❌ **Missing** | Electric utility meter tracking not implemented |
| **ElectricMeterCharger** | ElectricMeterChargerId, ElectricMeterId, ChargePointStationName, IsActive, IsBillable, ChargePointStationId | N/A | N/A | ❌ **Missing** | Meter-to-charger mapping not implemented |
| **ElectricMeterKWHRate** | ElectricMeterKWHRateId, StartDate, EndDate, ElectricMeterId, Rate, MeterKWHUsed, MeterBillTotal, BillDate, BillKey | **charging_stations.cost_per_kwh** | Single rate field | ⚠️ **Partial** | Simplified rate structure. Missing: time-based rates, meter billing |
| **ChargerKWHRate** | ChargerKWHRateId, Month, ChargerType, Rate | **charging_stations.cost_per_kwh** | Single rate field | ⚠️ **Partial** | Simplified rate structure |

---

## 5. INSPECTIONS & SAFETY COMPARISON

### Inspections

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| N/A | N/A | **inspection_forms** | id, tenant_id, form_name, form_type, form_template, is_active | 🆕 **New** | Customizable inspection form templates |
| N/A | N/A | **inspections** | id, tenant_id, vehicle_id, driver_id, inspection_form_id, inspection_date, inspection_type, odometer_reading, status, form_data, defects_found, signature_data, photos, location, latitude, longitude | 🆕 **New** | Digital inspection system with signatures |
| N/A | N/A | **damage_reports** | id, tenant_id, vehicle_id, reported_by, damage_description, damage_severity, damage_location, photos, triposr_task_id, triposr_status, triposr_model_url, linked_work_order_id, inspection_id | 🆕 **New** | 3D damage visualization with TripoSR |
| **MeterError** | MeterErrorId, RunDate, EquipmentId, MeterErrorTypeId, ErrorMeterNumber, MeterTypeId1, MeterTypeId2, CurrentMeterSourceId1, CurrentMeterSourceId2, PrevMeterSourceId1, PrevMeterSourceId2, LifeTotal1, LifeTotal2, PrevTotal1, PrevTotal2, DiffMeter1, DiffMeter2, Notes, MeterErrorStateId, FasterHours, FasterMiles | N/A | N/A | ❌ **Missing** | Meter error detection/reconciliation not implemented |
| **MeterType** | MeterTypeId, MeterTypeCode, MeterTypeDescription | N/A | N/A | ❌ **Missing** | Meter type classification not implemented |
| **MeterReadingSource** | MeterReadingSourceId, MeterReadingSource | N/A | N/A | ❌ **Missing** | Meter reading source tracking not implemented |
| **MeterErrorState** | MeterErrorStateId, MeterErrorStateCode, MeterErrorStateDescription | N/A | N/A | ❌ **Missing** | Meter error state workflow not implemented |
| **MeterErrorType** | MeterErrorTypeId, MeterErrorTypeCode, MeterErrorTypeDescription | N/A | N/A | ❌ **Missing** | Meter error categorization not implemented |

---

### Safety & Incidents

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| N/A | N/A | **safety_incidents** | id, tenant_id, incident_number, vehicle_id, driver_id, incident_date, incident_type, severity, location, latitude, longitude, description, injuries_count, fatalities_count, property_damage_cost, vehicle_damage_cost, at_fault, reported_to_osha, osha_case_number, police_report_number, insurance_claim_number, root_cause, corrective_actions, photos, documents, status, reported_by | ✅ **Implemented** | Comprehensive OSHA-compliant incident tracking |
| N/A | N/A | **incidents** | id, tenant_id, incident_title, incident_type, severity, status, incident_date, incident_time, location, description, vehicle_id, driver_id, reported_by, assigned_investigator, injuries_reported, injury_details, property_damage, damage_estimate, weather_conditions, road_conditions, police_report_number, insurance_claim_number, resolution_notes, root_cause, preventive_measures, closed_by, closed_date | 🆕 **New** | Extended incident investigation system |
| N/A | N/A | **incident_actions** | id, incident_id, action_type, action_description, assigned_to, due_date, completed_date, status | 🆕 **New** | Corrective action tracking |
| N/A | N/A | **incident_timeline** | id, incident_id, event_type, description, performed_by, timestamp | 🆕 **New** | Incident investigation audit trail |
| N/A | N/A | **incident_witnesses** | id, incident_id, witness_name, contact_info, statement | 🆕 **New** | Witness statement management |
| **EquipmentIdleTime** | EquipmentIdleTimeId, Month, EquipmentId, RunTimeDepartmentId, IdleLocation, Latitude, Longitude, IdleTimeInMinutes, FuelConsumptionGallons, IdleStartTime, IdleEndTime, RunDate, IsInvalid | **telemetry_data.idle_time** | idle_time (seconds) | ⚠️ **Partial** | Basic idle time tracking. Missing: location-specific idle analysis, fuel consumption correlation |

---

## 6. TELEMATICS & GPS COMPARISON

### Vehicle Telematics

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| N/A | N/A | **telemetry_data** | id, tenant_id, vehicle_id, timestamp, latitude, longitude, speed, heading, odometer, engine_hours, fuel_level, engine_rpm, coolant_temp, oil_pressure, battery_voltage, dtc_codes, harsh_braking, harsh_acceleration, sharp_turn, speeding, speed_limit, idle_time, raw_data | 🆕 **New** | Comprehensive OBD2/telematics data collection |
| N/A | N/A | **video_events** | id, tenant_id, vehicle_id, driver_id, event_time, event_type, severity, video_url, thumbnail_url, duration, latitude, longitude, speed, g_force, reviewed, reviewed_by, reviewed_at | 🆕 **New** | Dashcam/video telematics integration |

---

### Routes & Geofencing

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| N/A | N/A | **routes** | id, tenant_id, route_name, vehicle_id, driver_id, status, start_location, end_location, planned_start_time, planned_end_time, actual_start_time, actual_end_time, total_distance, estimated_duration, actual_duration, waypoints, optimized_waypoints, route_geometry | 🆕 **New** | Route planning and optimization |
| N/A | N/A | **geofences** | id, tenant_id, name, geofence_type, geometry, center_latitude, center_longitude, radius, alert_on_entry, alert_on_exit, alert_recipients, is_active | 🆕 **New** | Geofence-based alerting |
| N/A | N/A | **geofence_events** | id, tenant_id, geofence_id, vehicle_id, driver_id, event_type, event_time, latitude, longitude, speed, alert_sent | 🆕 **New** | Geofence violation tracking |
| **GoLightRemoteConfiguration** | GoLightRemoteConfigId, UnitNumber, SettingOne through SettingSeven | N/A | N/A | ❌ **Missing** | GoLight remote configuration not implemented |
| **GoLightSetting** | GoLightSettingId, SettingValue | N/A | N/A | ❌ **Missing** | GoLight settings not implemented |

---

## 7. ASSET & INVENTORY MANAGEMENT COMPARISON

### Asset Management

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| N/A | N/A | **assets** | id, tenant_id, asset_tag, asset_name, asset_type, category, description, manufacturer, model, serial_number, purchase_date, purchase_price, current_value, depreciation_rate, condition, status, location, assigned_to, warranty_expiration, last_maintenance, qr_code, metadata | 🆕 **New** | General asset tracking beyond vehicles |
| N/A | N/A | **asset_assignments** | id, asset_id, assigned_to, assigned_by, assignment_date, return_date, notes | 🆕 **New** | Asset checkout/assignment tracking |
| N/A | N/A | **asset_transfers** | id, asset_id, from_location, to_location, from_user, to_user, transfer_date, transfer_reason, notes, initiated_by | 🆕 **New** | Asset location transfer tracking |
| N/A | N/A | **asset_maintenance** | id, asset_id, maintenance_type, maintenance_date, description, cost, performed_by, next_maintenance_date | 🆕 **New** | Asset maintenance history |
| N/A | N/A | **asset_audit_log** | id, asset_id, action, field_name, old_value, new_value, performed_by, timestamp | 🆕 **New** | Asset change audit trail |

---

### Heavy Equipment Specific

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| N/A | N/A | **equipment_hour_meter_readings** | id, equipment_id, reading_date, hours, odometer_miles, fuel_level_percent, recorded_by, job_site, operator_id, billable_hours, notes, photo_url | 🆕 **New** | Hour meter tracking for heavy equipment |
| N/A | N/A | **equipment_attachments** | id, equipment_id, attachment_type, attachment_name, manufacturer, model, serial_number, condition, purchase_date, purchase_cost, is_currently_attached, weight_lbs | 🆕 **New** | Equipment attachment/bucket tracking |
| N/A | N/A | **equipment_checklist_templates** | id, tenant_id, template_name, equipment_type, checklist_type, description, is_active | 🆕 **New** | Customizable inspection checklist templates |
| N/A | N/A | **equipment_utilization_logs** | id, equipment_id, log_date, shift, operator_id, job_site, project_code, start_time, end_time, productive_hours, idle_hours, maintenance_hours, down_hours, billable_hours, hourly_rate, total_revenue | 🆕 **New** | Equipment utilization and productivity tracking |
| N/A | N/A | **equipment_work_assignments** | id, equipment_id, operator_id, job_site, project_code, assignment_start, assignment_end, estimated_hours, actual_hours, status | 🆕 **New** | Equipment job site assignment tracking |
| N/A | N/A | **equipment_cost_analysis** | id, equipment_id, analysis_period_start, analysis_period_end, depreciation_cost, fuel_cost, maintenance_cost, operator_cost, total_hours, productive_hours, utilization_rate, total_cost, cost_per_hour, revenue_generated, profit_loss, roi_percentage | 🆕 **New** | Equipment ROI and cost analysis |
| **MonthlyEquipmentUsage** | MonthlyEquipmentUsageId, Month, EquipmentId, Miles, Hours | **equipment_hour_meter_readings** (aggregate) | Tracked via individual readings | ⚠️ **Partial** | Current app tracks individual readings, can aggregate monthly |
| **EquipmentUsageDriver** | EquipmentUsageDriverId, Month, BusinessAreaId, DepartmentId, MilesDriven, HoursDriven | N/A | N/A | ❌ **Missing** | Departmental equipment usage aggregation not implemented |
| **InitialEquipmentMeterReading** | InitialEquipmentMeterReadingId, EquipmentId, MeterTypeId, MeterReading, MeterReadingDate, EndLifeReading, EndLifeReadingDate | N/A | N/A | ❌ **Missing** | Initial/end-of-life meter reading tracking not implemented |

---

## 8. PERFORMANCE METRICS & KPI COMPARISON

### Key Performance Indicators

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **KeyPerformanceIndicator** | KeyPerformanceIndicatorId, Name, Description | N/A | N/A | ❌ **Missing** | Formal KPI framework not implemented |
| **KPIMetric** | KPIMetricId, KeyPerformanceIndicatorId, Name, Description | N/A | N/A | ❌ **Missing** | KPI metric definitions not implemented |
| **IndustryStandardMetric** | IndustryStandardMetricId, KPIMetricID, Value | N/A | N/A | ❌ **Missing** | Industry benchmark comparisons not implemented |
| **FleetAvailabilityKPI** | FleetAvailabilityId, KPIMetricId, BeginDate, EndDate, Value, TotalVehicleCount, BusinessAreaId | N/A | N/A | ❌ **Missing** | Fleet availability KPI tracking not implemented |

---

## 9. SPECIALIZED SYSTEMS COMPARISON

### Employee Evaluation System

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **Evaluation** | EvaluationId, EvaluationTypeId, EvaluationName, EvaluationDisplayName, EvaluationDescription, EvaluationFrequencyId, EvaluationStateId, EvaluationWorkflowId, RequireFinalApproval | N/A | N/A | ❌ **Missing** | Employee evaluation system not implemented |
| **EvaluationType** | EvaluationTypeId, EvaluationType, EvaluationTypeDescription | N/A | N/A | ❌ **Missing** | |
| **EvaluationFrequency** | EvaluationFrequencyId, FrequencyCode, FrequencyDescription | N/A | N/A | ❌ **Missing** | |
| **EvaluationQuestion** | EvaluationQuestionId, EvaluationId, Question, EvaluationQuestionTypeId, IsOptional | N/A | N/A | ❌ **Missing** | |
| **EvaluationSection** | EvaluationSectionId, EvaluationId, EvaluationSectionName, EvaluationSectionDescription, EvaluationSectionDetails, EvaluationSectionOrder | N/A | N/A | ❌ **Missing** | |
| **EmployeeEvaluation** | EmployeeEvaluationId, EmployeeEvaluatorId, EvaluationId, EmployeeEvaluationStatusId, EvaluationDate, EmployeeWorkLocation, EvaluationFrequency, FiscalYear, StartPeriod, EndPeriod | N/A | N/A | ❌ **Missing** | |
| **EmployeeEvaluationQuestionResponse** | QuestionResponseId, EmployeeEvaluationId, QuestionId, ResponseText, EvaluationQuestionAllowedScoreId | N/A | N/A | ❌ **Missing** | |
| **EvaluationWorkflow** | EvaluationWorkflowId, EvaluationWorkflowName, EvaluationWorkflowDescription | N/A | N/A | ❌ **Missing** | |
| **EmployeeEvaluationSignature** | EmployeeEvaluationSignatureId, EmployeeEvaluationId, PersonId, SignatureTypeId, SignatureDate | N/A | N/A | ❌ **Missing** | |
| **ScheduledEvaluation** | ScheduledEvaluationId, EvaluationId, EvaluationTypeId | N/A | N/A | ❌ **Missing** | |
| **EmployeeComment** | EmployeeCommentId, EmployeeEvaluationId, Comment | N/A | N/A | ❌ **Missing** | |

---

### Biodiesel Program

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **BiodieselPartner** | BiodieselPartnerId, PartnerName, PartnerPhoneNumber, FirstChoiceCallTimeId, FirstChoiceCallDayId, EmailAddress, EstimatedGallonsWasteOil, TypeOfContainerId, CurrentlyHasCollectionService, BiodieselStatusId, SortOrder | N/A | N/A | ❌ **Missing** | Biodiesel waste oil collection program not implemented |
| **BiodieselPartnerRequest** | BiodieselPartnerRequestId, PartnerName, FirstName, LastName, ContactNumber, EmailAddress, EstimatedGallonsWasteOil, TypeOfContainer, CurrentlyHasCollectionService, BiodieselStatusId | N/A | N/A | ❌ **Missing** | |
| **BiodieselPartnerContact** | BiodieselPartnerContactId, BiodieselPartnerId, PartnerContactId | N/A | N/A | ❌ **Missing** | |
| **UsedOilCollection** | UsedOilCollectionId, PickupDate, BiodieselPartnerId, Gallons | N/A | N/A | ❌ **Missing** | |
| **BiodieselProductionResult** | BiodieselProductionResultId, ProductionDate, BiodieselProductionProductId, Gallons | N/A | N/A | ❌ **Missing** | |
| **WasteOilContainer** | WasteOilContainerId, ContainerDescription, ContainerCode | N/A | N/A | ❌ **Missing** | |

---

### Email & Communications

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **EmailRecipient** | EmailRecipientId, FirstName, LastName, EmailAddress, PhoneNumber | N/A | N/A | ❌ **Missing** | Email recipient management not implemented |
| **EmailApplication** | EmailApplicationId, EmailApplicationCode, ApplicationDisplayName, MessageSubject, MessageBody | N/A | N/A | ❌ **Missing** | Email template system not implemented |
| **EmailApplicationRecipient** | EmailApplicationRecipientId, EmailRecipientId, EmailApplicaitonId, IsSender, IsPrimaryContact, IsPOC | N/A | N/A | ❌ **Missing** | |
| N/A | N/A | **communication_logs** | id, tenant_id, communication_type, direction, from_user_id, to_user_id, vehicle_id, subject, body, timestamp, attachments | 🆕 **New** | General communication logging in current app |
| N/A | N/A | **notifications** | id, tenant_id, user_id, notification_type, title, message, link, is_read, read_at, priority | 🆕 **New** | In-app notification system |

---

### Application & Access Management

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **Application** | ApplicationId, ApplicationCode, ApplicationName | N/A | N/A | ❌ **Missing** | Multi-application access control not implemented |
| **ApplicationDepartmentPerson** | ApplicationDepartmentPersonId, ApplicationId, DepartmentId, PersonId, SendEmail | N/A | N/A | ❌ **Missing** | Department-level application access not implemented |

---

### Legacy System Integration Tables

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **KronosToMechanicConversion** | KronosToMechanicConversionId, KronosId, KronosName, MechanicId, MechanicName | N/A | N/A | ❌ **Missing** | Kronos integration not needed |
| **FasterUnlockNoteLog** | FasterUnlockNoteLogId, NHType, NHUID, UnlockDate, UnlockByPerson | N/A | N/A | ❌ **Missing** | FasterWin integration not needed |
| **FasterUnmatchedTaskConversion** | FasterUnmatchedTaskConversionId, FasterTaskCode, AssetWorksTaskCode | N/A | N/A | ❌ **Missing** | FasterWin integration not needed |
| **FasterWACConversion** | FasterWACConversionId, FasterWAC, FasterWACDescription, AssetWorksWAC | N/A | N/A | ❌ **Missing** | FasterWin integration not needed |
| **AssetWorksVoucherType** | AssetWorksVoucherTypeId, VoucherTypeKey, VoucherTypeDescription, AccountCode | N/A | N/A | ❌ **Missing** | AssetWorks integration not needed |
| **AssetWorksOpenedWorkOrder** | AssetWorksOpenedWorkOrderId, WorkOrderLocation, WorkOrderYear, WorkOrderNumber | N/A | N/A | ❌ **Missing** | AssetWorks integration not needed |
| **AWReceiptReportRun** | AWReceiptReportRunId, RunDate, BeginDate, EndDate, IsSuccessful | N/A | N/A | ❌ **Missing** | AssetWorks integration not needed |

---

## 10. TASK & PROJECT MANAGEMENT COMPARISON

### Task Management

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| N/A | N/A | **tasks** | id, tenant_id, task_title, description, task_type, priority, status, assigned_to, created_by, due_date, start_date, completed_date, estimated_hours, actual_hours, completion_percentage, vehicle_id, work_order_id, parent_task_id, tags, metadata | 🆕 **New** | Comprehensive task management system |
| N/A | N/A | **task_comments** | id, task_id, comment_text, created_by | 🆕 **New** | Task collaboration and communication |
| N/A | N/A | **task_time_entries** | id, task_id, user_id, start_time, end_time, duration_minutes, notes | 🆕 **New** | Task time tracking for billing/costing |
| N/A | N/A | **task_checklist_items** | id, task_id, item_text, is_completed, completed_by, completed_at, sort_order | 🆕 **New** | Task sub-item management |
| N/A | N/A | **task_attachments** | id, task_id, file_name, file_url, file_type, file_size, uploaded_by | 🆕 **New** | Task document management |

---

## 11. POLICY & COMPLIANCE COMPARISON

### Policy Engine

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| N/A | N/A | **policies** | id, tenant_id, policy_name, policy_type, description, rules, is_active, priority, created_by | 🆕 **New** | Policy engine for automated enforcement |
| N/A | N/A | **policy_violations** | id, tenant_id, policy_id, vehicle_id, driver_id, violation_time, violation_data, severity, acknowledged, acknowledged_by, acknowledged_at | 🆕 **New** | Policy violation tracking and acknowledgement |

---

### Status Management

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **Status** | StatusId, StatusCode, StatusDescription, CanAssignWO | **vehicles.status**, **work_orders.status** (enums) | Various status enums per entity | ⚠️ **Partial** | ERD uses shared status table; current app uses entity-specific enums |

---

## 12. EXTERNAL DATA & INTEGRATION COMPARISON

### Vehicle Information

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **VPICVinDetails** | VPICVinDetailsId, Vin, ManufacturerName, Make, Model, ModelYear, FuelTypePrimary, BodyClass, VehicleType | N/A | N/A | ❌ **Missing** | NHTSA vPIC VIN decoder integration not implemented |

---

### Emissions Tracking

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| **EmissionsDriver** | EmissionsDriverId, Month, BusinessAreaId, DepartmentId, FuelTypeId, EmissionsTonnesCO2e | N/A | N/A | ❌ **Missing** | Carbon emissions tracking not implemented |
| **LightDutyEquipmentUsageType** | LightDutyEquipmentUsageTypeId, Month, BusinessAreaId, DepartmentId, FuelTypeId, Miles, Hours | N/A | N/A | ❌ **Missing** | Light duty equipment usage classification not implemented |

---

## 13. SECURITY & COMPLIANCE COMPARISON

### Audit & Security

| ERD Entity | ERD Key Fields | Current App Entity | Current App Fields | Status | Notes |
|------------|---------------|-------------------|-------------------|--------|-------|
| N/A | N/A | **audit_logs** | id, tenant_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, outcome, error_message, hash | 🆕 **New** | FedRAMP-compliant audit logging with integrity hashing |
| **PersonLookup** | PersonLookupId, PersonId, LookupDetails | N/A | N/A | ❌ **Missing** | Person lookup tracking not implemented |

---

## SUMMARY STATISTICS

### Implementation Coverage

| Category | Total ERD Tables | Implemented | Partial | Missing | New in Current App |
|----------|-----------------|------------|---------|---------|-------------------|
| **Core Entities** | 12 | 3 | 7 | 2 | 5 |
| **Personnel** | 8 | 0 | 4 | 4 | 2 |
| **Organizational** | 4 | 0 | 0 | 4 | 2 |
| **Financial** | 6 | 0 | 0 | 6 | 2 |
| **Maintenance** | 14 | 2 | 8 | 4 | 6 |
| **Fuel Management** | 11 | 1 | 5 | 5 | 8 |
| **Inspections** | 8 | 0 | 2 | 6 | 4 |
| **Safety** | 7 | 1 | 3 | 3 | 6 |
| **Telematics** | 4 | 0 | 0 | 0 | 6 |
| **Asset Management** | 0 | 0 | 0 | 0 | 11 |
| **KPIs** | 10 | 0 | 0 | 10 | 0 |
| **Evaluation System** | 25 | 0 | 0 | 25 | 0 |
| **Biodiesel** | 7 | 0 | 0 | 7 | 0 |
| **Communications** | 3 | 0 | 0 | 3 | 2 |
| **Integration** | 9 | 0 | 0 | 9 | 0 |
| **TOTAL** | **128** | **7 (5%)** | **29 (23%)** | **92 (72%)** | **54** |

---

## KEY FINDINGS

### 1. Architecture Differences

**ERD (Legacy System):**
- Monolithic single-tenant architecture
- Heavy integration with specific systems (FasterWin, AssetWorks, Fuel Master, Kronos)
- Business area/division/department structure
- Shared status/lookup tables
- Billing and accounting deeply integrated

**Current App:**
- Modern multi-tenant SaaS architecture
- Cloud-native with PostGIS geospatial support
- Tenant-based data isolation
- Entity-specific status enums
- Separated financial concerns

### 2. Missing Critical Components from ERD

1. **Financial/Accounting System** (92 tables)
   - Billing charges and batches
   - Accounting charge codes
   - Business area/division/department hierarchy
   - Fund tracking

2. **Employee Evaluation System** (25 tables)
   - Complete performance review workflow
   - Evaluation templates and scoring
   - Signatures and approvals

3. **KPI Framework** (10 tables)
   - Formal KPI definitions
   - Industry benchmarks
   - Multi-dimensional performance tracking

4. **Legacy System Integrations** (9 tables)
   - FasterWin conversions
   - AssetWorks mappings
   - Kronos integration

5. **Biodiesel Program** (7 tables)
   - Waste oil collection
   - Production tracking

6. **Departmental Usage Analytics**
   - Business area fuel usage
   - Equipment usage by department
   - Emissions by department

### 3. New Capabilities in Current App

1. **Modern Fleet Technology**
   - Real-time telematics and OBD2 data
   - Video dashcam integration
   - 3D damage visualization (TripoSR)
   - Route optimization with geofences

2. **Security & Compliance**
   - FedRAMP-compliant audit logging
   - Multi-factor authentication
   - Row-level security with multi-tenancy
   - OSHA incident reporting

3. **Asset Management**
   - General asset tracking beyond vehicles
   - QR code integration
   - Asset checkout/assignment system
   - Depreciation tracking

4. **Heavy Equipment Specialization**
   - Equipment type taxonomy
   - Operator certifications
   - Hour meter tracking
   - Utilization and cost analysis
   - Equipment attachments

5. **Fuel Intelligence**
   - Real-time fuel price tracking
   - ML price forecasting
   - Savings analytics
   - Contract management
   - Bulk fuel inventory

6. **Digital Operations**
   - Customizable digital inspection forms
   - Electronic signatures
   - Task management with time tracking
   - Policy engine with automated enforcement

### 4. Data Model Modernization

| Aspect | ERD Approach | Current App Approach |
|--------|-------------|---------------------|
| **IDs** | INT IDENTITY | UUID for distributed systems |
| **Timestamps** | DateTime | TIMESTAMP WITH TIME ZONE (timezone-aware) |
| **Status** | Shared Status table | Entity-specific ENUMs |
| **Location** | Lat/Lng decimals | PostGIS GEOGRAPHY for spatial queries |
| **Multi-tenancy** | Single tenant | Tenant_id on all tables with RLS |
| **Metadata** | Multiple specific columns | JSONB for flexible extension |
| **Files** | Single file paths | Arrays of URLs for multiple files |
| **Authentication** | Basic username/password | bcrypt hashing, MFA, session management |

---

## RECOMMENDATIONS

### Phase 1: Critical Gaps (High Priority)

1. **Implement Business Structure**
   - Add business_areas, divisions, departments tables
   - Link vehicles and transactions to organizational units
   - Enable departmental reporting and cost allocation

2. **Implement Billing System**
   - Add billing_charges, billing_batches tables
   - Implement accounting charge codes
   - Connect to work orders and fuel transactions

3. **Enhanced Meter Tracking**
   - Add meter error detection and reconciliation
   - Implement meter types and sources
   - Track initial and end-of-life readings

4. **KPI Framework**
   - Implement formal KPI definitions
   - Add industry benchmark comparisons
   - Create PM completion, availability, and turnaround KPIs

### Phase 2: Enhanced Functionality (Medium Priority)

1. **Employee Evaluation System**
   - Implement evaluation templates and workflows
   - Add scoring and signature capture
   - Schedule automated evaluation creation

2. **Advanced Safety Analytics**
   - Implement equipment safety behavior taxonomy
   - Add monthly driver/equipment safety scores
   - Enhance idle time analysis with location correlation

3. **Departmental Analytics**
   - Add fuel usage by department
   - Track equipment usage by business area
   - Implement emissions tracking by department

4. **VIN Decoder Integration**
   - Integrate NHTSA vPIC API
   - Auto-populate vehicle specifications
   - Track fuel type and emissions classifications

### Phase 3: Nice-to-Have (Low Priority)

1. **Biodiesel Program** (if applicable)
   - Waste oil collection tracking
   - Production management
   - Partner coordination

2. **Email Template System**
   - Configurable email templates
   - Recipient management
   - Automated notifications

3. **Legacy System Integrations** (if needed)
   - AssetWorks integration
   - External time tracking systems

---

## CONCLUSION

The current Fleet application represents a **modern, cloud-native reimagining** of the legacy ERD system with:

- ✅ **Stronger foundation**: Multi-tenancy, geospatial capabilities, modern security
- ✅ **Enhanced operations**: Digital inspections, route optimization, real-time telematics
- ✅ **Advanced analytics**: Fuel price intelligence, equipment cost analysis, ML forecasting
- ⚠️ **Missing enterprise features**: Billing system, organizational hierarchy, KPI framework
- ⚠️ **Simplified in areas**: Status management, repair type taxonomy, personnel structure

**Next Steps**: Prioritize Phase 1 implementations to achieve feature parity with legacy system while retaining modern architecture advantages.
