import { Routes, Route, Navigate } from 'react-router-dom'

import { CreateDamageReport } from '@/components/DamageReports/CreateDamageReport'
import { DamageReportDetails } from '@/components/DamageReports/DamageReportDetails'
import { DamageReportList } from '@/components/DamageReports/DamageReportList'

export function DamageReportsPage() {
  return (
    <div className="container mx-auto p-3 max-w-7xl">
      <Routes>
        {/* List view - default route */}
        <Route index element={<DamageReportList />} />

        {/* Create new damage report */}
        <Route path="create" element={<CreateDamageReport />} />

        {/* View damage report details */}
        <Route path=":id" element={<DamageReportDetails />} />

        {/* Edit damage report - reuses create form with id */}
        <Route
          path=":id/edit"
          element={
            <div className="space-y-2">
              <h2 className="text-base font-bold tracking-tight">Edit Damage Report</h2>
              <p className="text-muted-foreground">
                Editing functionality coming soon. For now, please create a new report.
              </p>
            </div>
          }
        />

        {/* Catch all - redirect to list */}
        <Route path="*" element={<Navigate to="/damage-reports" replace />} />
      </Routes>
    </div>
  )
}
