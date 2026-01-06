#!/bin/bash
# Automated script to create remaining 27 dashboard JSON files

BASE_DIR="/Users/andrewmorton/Documents/GitHub/Fleet/src/reporting_library/dashboards"

# Driver Measures Dashboard (9 reports)
cat > "$BASE_DIR/cot-driver-01-equipment-types.json" <<'EOF'
{
  "id": "cot-driver-01",
  "title": "Equipment Types",
  "domain": "assets",
  "category": "city_tallahassee_driver",
  "description": "Count of equipment by type",
  "datasource": {"type": "sqlView", "view": "vw_equipment_types", "parameters": {}},
  "filters": [],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "Equipment Summary", "measures": [{"id": "total_count", "label": "Total Equipment", "format": "integer", "aggregation": "count", "field": "equipment_id"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}},
    {"id": "type_breakdown", "type": "bar", "title": "Equipment by Type", "encoding": {"x": {"field": "equipment_type", "type": "nominal"}, "y": {"field": "count", "type": "quantitative"}}, "layout": {"x": 0, "y": 2, "w": 12, "h": 4}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "Admin", "rule": "TRUE"}]}
}
EOF

cat > "$BASE_DIR/cot-driver-02-equipment-usage.json" <<'EOF'
{
  "id": "cot-driver-02",
  "title": "Equipment Usage",
  "domain": "assets",
  "category": "city_tallahassee_driver",
  "description": "Miles/hours by organization and month",
  "datasource": {"type": "sqlView", "view": "vw_equipment_usage", "parameters": {"date_start": "{{dateRange.start}}", "date_end": "{{dateRange.end}}", "organization": "{{organization}}"}},
  "filters": [{"name": "dateRange", "type": "dateRange", "default": "current_month", "required": true}, {"name": "organization", "type": "multiSelect", "values": "dynamic", "default": "All"}],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "Usage Summary", "measures": [{"id": "total_miles", "label": "Total Miles", "format": "integer", "aggregation": "sum", "field": "miles"}, {"id": "total_hours", "label": "Total Hours", "format": "decimal", "aggregation": "sum", "field": "hours"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}},
    {"id": "usage_trend", "type": "line", "title": "Usage Trend", "encoding": {"x": {"field": "month", "type": "temporal"}, "y": {"field": "miles", "type": "quantitative", "aggregate": "sum"}, "color": {"field": "organization", "type": "nominal"}}, "layout": {"x": 0, "y": 2, "w": 12, "h": 4}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "Admin", "rule": "TRUE"}]}
}
EOF

cat > "$BASE_DIR/cot-driver-03-mechanic-hours.json" <<'EOF'
{
  "id": "cot-driver-03",
  "title": "Mechanic Hours",
  "domain": "shop",
  "category": "city_tallahassee_driver",
  "description": "Labor hours worked vs available over time",
  "datasource": {"type": "sqlView", "view": "vw_mechanic_hours", "parameters": {"date_start": "{{dateRange.start}}", "date_end": "{{dateRange.end}}"}},
  "filters": [{"name": "dateRange", "type": "dateRange", "default": "current_month", "required": true}],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "Labor Summary", "measures": [{"id": "hours_worked", "label": "Hours Worked", "format": "decimal", "aggregation": "sum", "field": "hours_worked"}, {"id": "hours_available", "label": "Hours Available", "format": "decimal", "aggregation": "sum", "field": "hours_available"}, {"id": "utilization_pct", "label": "Utilization %", "format": "percent", "expression": "hours_worked/hours_available"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}},
    {"id": "hours_trend", "type": "line", "title": "Labor Hours Trend", "encoding": {"x": {"field": "date", "type": "temporal"}, "y": {"field": "hours", "type": "quantitative"}, "color": {"field": "type", "type": "nominal"}}, "layout": {"x": 0, "y": 2, "w": 12, "h": 4}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "Admin", "rule": "TRUE"}]}
}
EOF

cat > "$BASE_DIR/cot-driver-04-work-orders.json" <<'EOF'
{
  "id": "cot-driver-04",
  "title": "Work Orders",
  "domain": "workorders",
  "category": "city_tallahassee_driver",
  "description": "Count per month and shop",
  "datasource": {"type": "sqlView", "view": "vw_work_orders_count", "parameters": {"date_start": "{{dateRange.start}}", "date_end": "{{dateRange.end}}", "shop": "{{shop}}"}},
  "filters": [{"name": "dateRange", "type": "dateRange", "default": "last_12_months", "required": true}, {"name": "shop", "type": "multiSelect", "values": "dynamic", "default": "All"}],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "Work Order Summary", "measures": [{"id": "total_wo", "label": "Total Work Orders", "format": "integer", "aggregation": "count", "field": "work_order_number"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}},
    {"id": "wo_trend", "type": "line", "title": "Work Orders per Month", "encoding": {"x": {"field": "month", "type": "temporal"}, "y": {"field": "count", "type": "quantitative"}, "color": {"field": "shop_name", "type": "nominal"}}, "layout": {"x": 0, "y": 2, "w": 12, "h": 4}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "ShopManager", "rule": "shop_name IN user.shops"}, {"role": "Admin", "rule": "TRUE"}]}
}
EOF

cat > "$BASE_DIR/cot-driver-05-wo-equipment-count.json" <<'EOF'
{
  "id": "cot-driver-05",
  "title": "Work Order Equipment Count",
  "domain": "workorders",
  "category": "city_tallahassee_driver",
  "description": "Unique equipment serviced",
  "datasource": {"type": "sqlView", "view": "vw_wo_equipment_count", "parameters": {"date_start": "{{dateRange.start}}", "date_end": "{{dateRange.end}}"}},
  "filters": [{"name": "dateRange", "type": "dateRange", "default": "current_month", "required": true}],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "Equipment Serviced", "measures": [{"id": "unique_equipment", "label": "Unique Equipment", "format": "integer", "aggregation": "distinctCount", "field": "equipment_id"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "Admin", "rule": "TRUE"}]}
}
EOF

cat > "$BASE_DIR/cot-driver-06-pm-count.json" <<'EOF'
{
  "id": "cot-driver-06",
  "title": "PM Count",
  "domain": "pm",
  "category": "city_tallahassee_driver",
  "description": "Completed vs due PMs",
  "datasource": {"type": "sqlView", "view": "vw_pm_count", "parameters": {"month": "{{month}}"}},
  "filters": [{"name": "month", "type": "month", "default": "current_month", "required": true}],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "PM Summary", "measures": [{"id": "pm_due", "label": "Due", "format": "integer", "aggregation": "sum", "field": "pm_due_count"}, {"id": "pm_completed", "label": "Completed", "format": "integer", "aggregation": "sum", "field": "pm_completed_count"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "Admin", "rule": "TRUE"}]}
}
EOF

cat > "$BASE_DIR/cot-driver-07-fuel-usage.json" <<'EOF'
{
  "id": "cot-driver-07",
  "title": "Fuel Usage",
  "domain": "fuel",
  "category": "city_tallahassee_driver",
  "description": "Gallons by organization and vehicle type",
  "datasource": {"type": "sqlView", "view": "vw_fuel_usage", "parameters": {"date_start": "{{dateRange.start}}", "date_end": "{{dateRange.end}}", "organization": "{{organization}}"}},
  "filters": [{"name": "dateRange", "type": "dateRange", "default": "current_month", "required": true}, {"name": "organization", "type": "multiSelect", "values": "dynamic", "default": "All"}],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "Fuel Summary", "measures": [{"id": "total_gallons", "label": "Total Gallons", "format": "decimal", "aggregation": "sum", "field": "gallons"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}},
    {"id": "fuel_by_org", "type": "bar", "title": "Fuel by Organization", "encoding": {"x": {"field": "organization", "type": "nominal"}, "y": {"field": "gallons", "type": "quantitative", "aggregate": "sum"}}, "layout": {"x": 0, "y": 2, "w": 12, "h": 4}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "Admin", "rule": "TRUE"}]}
}
EOF

cat > "$BASE_DIR/cot-driver-08-fuel-emissions.json" <<'EOF'
{
  "id": "cot-driver-08",
  "title": "Fuel Emissions",
  "domain": "fuel",
  "category": "city_tallahassee_driver",
  "description": "CO2-equivalent emissions",
  "datasource": {"type": "sqlView", "view": "vw_fuel_emissions", "parameters": {"date_start": "{{dateRange.start}}", "date_end": "{{dateRange.end}}"}},
  "filters": [{"name": "dateRange", "type": "dateRange", "default": "current_month", "required": true}],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "Emissions Summary", "measures": [{"id": "total_co2", "label": "CO2 Equivalent (lbs)", "format": "decimal", "aggregation": "sum", "field": "co2_lbs"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "Admin", "rule": "TRUE"}]}
}
EOF

cat > "$BASE_DIR/cot-driver-09-pm-compliance-detailed.json" <<'EOF'
{
  "id": "cot-driver-09",
  "title": "PM Compliance (Detailed)",
  "domain": "pm",
  "category": "city_tallahassee_driver",
  "description": "Detailed PM compliance breakdown",
  "datasource": {"type": "sqlView", "view": "vw_pm_compliance_detailed", "parameters": {"month": "{{month}}", "shop": "{{shop}}"}},
  "filters": [{"name": "month", "type": "month", "default": "current_month", "required": true}, {"name": "shop", "type": "multiSelect", "values": "dynamic", "default": "All"}],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "PM Detailed Summary", "measures": [{"id": "compliance_rate", "label": "Compliance Rate", "format": "percent", "expression": "pm_completed_count/pm_due_count"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}},
    {"id": "pm_detail_table", "type": "table", "title": "PM Detail", "columns": [{"field": "equipment_key", "label": "Equipment"}, {"field": "pm_task", "label": "PM Task"}, {"field": "due_date", "label": "Due Date"}, {"field": "completed_date", "label": "Completed"}, {"field": "status", "label": "Status"}], "pagination": {"pageSize": 50}, "layout": {"x": 0, "y": 2, "w": 12, "h": 6}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "ShopManager", "rule": "shop_name IN user.shops"}, {"role": "Admin", "rule": "TRUE"}]}
}
EOF

echo "Created 9 Driver Measures dashboard reports"

# Safety Dashboard (7 reports)
for i in {1..7}; do
  case $i in
    1) TITLE="Equipment Safety Score Totals"; DESC="Distance, speeding, crash/harsh events"; DOMAIN="safety" ;;
    2) TITLE="Equipment Safety Minutes"; DESC="Driving, speeding, idle categories"; DOMAIN="safety" ;;
    3) TITLE="Equipment Safety Measures"; DESC="Harsh acceleration/braking/turning counts"; DOMAIN="safety" ;;
    4) TITLE="Equipment Idle Time Measures"; DESC="Idle minutes and fuel consumption"; DOMAIN="fuel" ;;
    5) TITLE="Driver Safety Score Totals"; DESC="Aggregate driver safety scores"; DOMAIN="safety" ;;
    6) TITLE="Driver Safety Minutes"; DESC="Driving vs speeding time"; DOMAIN="safety" ;;
    7) TITLE="Driver Safety Measures"; DESC="Harsh event counts per driver"; DOMAIN="safety" ;;
  esac

  cat > "$BASE_DIR/cot-safety-0${i}.json" <<EOF
{
  "id": "cot-safety-0${i}",
  "title": "$TITLE",
  "domain": "$DOMAIN",
  "category": "city_tallahassee_safety",
  "description": "$DESC",
  "datasource": {"type": "sqlView", "view": "vw_safety_0${i}", "parameters": {"date_start": "{{dateRange.start}}", "date_end": "{{dateRange.end}}"}},
  "filters": [{"name": "dateRange", "type": "dateRange", "default": "current_month", "required": true}],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "Safety Metrics", "measures": [{"id": "safety_score", "label": "Safety Score", "format": "decimal", "aggregation": "avg", "field": "safety_score"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "Admin", "rule": "TRUE"}]}
}
EOF
done

echo "Created 7 Safety dashboard reports"

# Electric Initiative Dashboard (8 reports)
for i in {1..8}; do
  case $i in
    1) TITLE="Number of Electric Vehicles"; DESC="EV count"; DOMAIN="ev" ;;
    2) TITLE="Miles Driven on Electricity"; DESC="Cumulative electric miles"; DOMAIN="ev" ;;
    3) TITLE="Pounds CO2 Saved"; DESC="EPA equivalencies"; DOMAIN="ev" ;;
    4) TITLE="Trees Saved"; DESC="Equivalent number of trees"; DOMAIN="ev" ;;
    5) TITLE="Oil Changes Saved"; DESC="Maintenance savings estimate"; DOMAIN="ev" ;;
    6) TITLE="Transmission Service Saved"; DESC="Maintenance savings estimate"; DOMAIN="ev" ;;
    7) TITLE="Electric Buses"; DESC="State-of-charge, charge times, telematics"; DOMAIN="ev" ;;
    8) TITLE="Hybrid Vehicles"; DESC="Performance metrics and telematics"; DOMAIN="ev" ;;
  esac

  cat > "$BASE_DIR/cot-ev-0${i}.json" <<EOF
{
  "id": "cot-ev-0${i}",
  "title": "$TITLE",
  "domain": "$DOMAIN",
  "category": "city_tallahassee_ev",
  "description": "$DESC",
  "datasource": {"type": "sqlView", "view": "vw_ev_0${i}", "parameters": {"date_start": "{{dateRange.start}}", "date_end": "{{dateRange.end}}"}},
  "filters": [{"name": "dateRange", "type": "dateRange", "default": "current_month", "required": true}],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "EV Metrics", "measures": [{"id": "metric_value", "label": "$TITLE", "format": "integer", "aggregation": "sum", "field": "value"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "Admin", "rule": "TRUE"}]}
}
EOF
done

echo "Created 8 EV Initiative dashboard reports"

# Biodiesel Dashboard (3 reports)
cat > "$BASE_DIR/cot-bio-01-production-history.json" <<'EOF'
{
  "id": "cot-bio-01",
  "title": "Biodiesel Production History",
  "domain": "bio",
  "category": "city_tallahassee_bio",
  "description": "Date, product type, and gallons produced",
  "datasource": {"type": "sqlView", "view": "vw_biodiesel_production", "parameters": {"date_start": "{{dateRange.start}}", "date_end": "{{dateRange.end}}"}},
  "filters": [{"name": "dateRange", "type": "dateRange", "default": "last_12_months", "required": true}],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "Production Summary", "measures": [{"id": "total_gallons", "label": "Total Gallons", "format": "decimal", "aggregation": "sum", "field": "gallons"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}},
    {"id": "production_trend", "type": "line", "title": "Production Over Time", "encoding": {"x": {"field": "date", "type": "temporal"}, "y": {"field": "gallons", "type": "quantitative", "aggregate": "sum"}, "color": {"field": "product_type", "type": "nominal"}}, "layout": {"x": 0, "y": 2, "w": 12, "h": 4}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "Admin", "rule": "TRUE"}]}
}
EOF

cat > "$BASE_DIR/cot-bio-02-partner-pickup.json" <<'EOF'
{
  "id": "cot-bio-02",
  "title": "Biodiesel Partner Pickup History",
  "domain": "bio",
  "category": "city_tallahassee_bio",
  "description": "Date, partner, and gallons picked up",
  "datasource": {"type": "sqlView", "view": "vw_biodiesel_pickup", "parameters": {"date_start": "{{dateRange.start}}", "date_end": "{{dateRange.end}}"}},
  "filters": [{"name": "dateRange", "type": "dateRange", "default": "last_12_months", "required": true}],
  "visuals": [
    {"id": "kpis", "type": "kpiTiles", "title": "Pickup Summary", "measures": [{"id": "total_gallons", "label": "Total Gallons", "format": "decimal", "aggregation": "sum", "field": "gallons"}], "layout": {"x": 0, "y": 0, "w": 12, "h": 2}},
    {"id": "partner_breakdown", "type": "bar", "title": "Pickups by Partner", "encoding": {"x": {"field": "partner_name", "type": "nominal"}, "y": {"field": "gallons", "type": "quantitative", "aggregate": "sum"}}, "layout": {"x": 0, "y": 2, "w": 12, "h": 4}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "Admin", "rule": "TRUE"}]}
}
EOF

cat > "$BASE_DIR/cot-bio-03-partner-requests.json" <<'EOF'
{
  "id": "cot-bio-03",
  "title": "Partner Request Forms",
  "domain": "bio",
  "category": "city_tallahassee_bio",
  "description": "Contact info and waste-oil estimates",
  "datasource": {"type": "sqlView", "view": "vw_biodiesel_requests", "parameters": {}},
  "filters": [],
  "visuals": [
    {"id": "request_table", "type": "table", "title": "Partner Requests", "columns": [{"field": "partner_name", "label": "Partner"}, {"field": "contact_name", "label": "Contact"}, {"field": "contact_email", "label": "Email"}, {"field": "contact_phone", "label": "Phone"}, {"field": "estimated_gallons", "label": "Est. Gallons", "format": "decimal"}], "pagination": {"pageSize": 50}, "layout": {"x": 0, "y": 0, "w": 12, "h": 8}}
  ],
  "exports": [{"format": "csv"}, {"format": "xlsx"}, {"format": "pdf"}],
  "security": {"rowLevel": [{"role": "Admin", "rule": "TRUE"}]}
}
EOF

echo "Created 3 Biodiesel dashboard reports"
echo "All 35 City of Tallahassee dashboard reports created successfully!"
