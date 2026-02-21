import { Routes, Route, Navigate } from 'react-router-dom'

import ErrorBoundary from '@/components/common/ErrorBoundary'
import { CreateDamageReport } from '@/components/DamageReports/CreateDamageReport'
import { DamageReportDetails } from '@/components/DamageReports/DamageReportDetails'
import { DamageReportList } from '@/components/DamageReports/DamageReportList'

export function DamageReportsPage() {
  return (
    <ErrorBoundary>
    <div className="container mx-auto p-3 max-w-7xl">
      <Routes>
        {/* List view - default route */}
        <Route index element={<DamageReportList />} />

        {/* Create new damage report */}
        <Route path="create" element={<CreateDamageReport />} />

        {/* View damage report details */}
        <Route path=":id" element={<DamageReportDetails />} />

        {/* Edit damage report - reuses create form with existing report context */}
        <Route path=":id/edit" element={<CreateDamageReport />} />

        {/* Catch all - redirect to list */}
        <Route path="*" element={<Navigate to="/damage-reports" replace />} />
      </Routes>
    </div>
    </ErrorBoundary>
  )
}
