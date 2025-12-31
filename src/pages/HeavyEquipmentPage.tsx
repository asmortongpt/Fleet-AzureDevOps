import { lazy, Suspense } from "react"

// Re-export EquipmentDashboard as the Heavy Equipment page
const EquipmentDashboard = lazy(() =>
    import("@/components/modules/assets/EquipmentDashboard").then(m => ({ default: m.EquipmentDashboard }))
)

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading heavy equipment...</p>
        </div>
    </div>
)

export default function HeavyEquipmentPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <EquipmentDashboard />
        </Suspense>
    )
}
