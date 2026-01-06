# Fleet Report Library (100 reports)

This package provides 100 build-ready report definition files for the asmortongpt/Fleet application.

## Contents
- `index.json`: registry of all reports
- `reports/*.json`: individual report definitions

## Report Definition Schema (high level)
Each report includes:
- datasource (SQL view name + parameters)
- filters (dateRange, businessArea, division, department, shop)
- visuals (kpi tiles, monthly trend chart, detail table)
- drilldowns (category -> department -> equipment -> transaction)
- drillthrough link(s)
- exports (csv/xlsx/pdf)
- security (row-level rules stubs)
- validation checks

## Wiring into the Fleet repo
1. Copy the `reporting_library/` folder into the repo (e.g., `src/reporting_library/`).
2. Add a loader that reads `reporting_library/index.json`.
3. Render report pages dynamically based on `visuals[]`.
4. Map `datasource.view` to real SQL views or API endpoints.

If you want, I can also:
- generate the SQL view scripts for each `vw_*`
- generate React components that auto-render these configs
- generate sample mock datasets per report
