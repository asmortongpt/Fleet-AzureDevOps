import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * VehicleFormSkeleton - Loading state for vehicle creation/edit forms
 *
 * Purpose: Prevents layout shift during form initialization
 * Fixed Height: ~1200px (47 fields organized in sections)
 *
 * Matches VehicleForm component structure exactly
 */
export function VehicleFormSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Form Header */}
      <div className="h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Section 1: Basic Information - 12 fields */}
      <Card className="min-h-[480px]">
        <CardHeader className="h-16">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Row 1: VIN, Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormFieldSkeleton label="VIN" required />
            <FormFieldSkeleton label="Year" required />
          </div>

          {/* Row 2: Make, Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormFieldSkeleton label="Make" required />
            <FormFieldSkeleton label="Model" required />
          </div>

          {/* Row 3: Color, License Plate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormFieldSkeleton label="Color" />
            <FormFieldSkeleton label="License Plate" required />
          </div>

          {/* Row 4: Vehicle Type, Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormFieldSkeleton label="Vehicle Type" />
            <FormFieldSkeleton label="Department" />
          </div>

          {/* Row 5: Status, Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormFieldSkeleton label="Status" />
            <FormFieldSkeleton label="Location" />
          </div>

          {/* Row 6: Purchase Date, Purchase Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormFieldSkeleton label="Purchase Date" />
            <FormFieldSkeleton label="Purchase Price" />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Specifications - 15 fields */}
      <Card className="min-h-[600px]">
        <CardHeader className="h-16">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Engine, Transmission, Fuel Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormFieldSkeleton label="Engine" />
            <FormFieldSkeleton label="Transmission" />
            <FormFieldSkeleton label="Fuel Type" />
          </div>

          {/* Mileage, Tank Capacity, MPG */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormFieldSkeleton label="Mileage" />
            <FormFieldSkeleton label="Tank Capacity" />
            <FormFieldSkeleton label="MPG" />
          </div>

          {/* Weight, Capacity, Towing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormFieldSkeleton label="Weight" />
            <FormFieldSkeleton label="Capacity" />
            <FormFieldSkeleton label="Towing Capacity" />
          </div>

          {/* Additional specs... */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section 3: Maintenance & Insurance - 10 fields */}
      <Card className="min-h-[400px]">
        <CardHeader className="h-16">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
          ))}
          <FormFieldSkeleton label="Notes" type="textarea" />
        </CardContent>
      </Card>

      {/* Section 4: Telematics & GPS - 10 fields */}
      <Card className="min-h-[320px]">
        <CardHeader className="h-16">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormFieldSkeleton label="GPS Device ID" />
            <FormFieldSkeleton label="Telematics Provider" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormFieldSkeleton label="Last GPS Update" />
            <FormFieldSkeleton label="OBD2 Device ID" />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions - Fixed Height: 80px */}
      <div className="h-20 flex items-center justify-end gap-3 border-t pt-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

/**
 * DriverFormSkeleton - Loading state for driver forms
 * Fixed Height: ~800px (33 fields)
 */
export function DriverFormSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Personal Information - 15 fields */}
      <Card className="min-h-[600px]">
        <CardHeader className="h-16">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* License & Certifications - 10 fields */}
      <Card className="min-h-[400px]">
        <CardHeader className="h-16">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Employment Details - 8 fields */}
      <Card className="min-h-[320px]">
        <CardHeader className="h-16">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="h-20 flex items-center justify-end gap-3 border-t pt-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

/**
 * WorkOrderFormSkeleton - Loading state for work order forms
 * Fixed Height: ~700px (28 fields)
 */
export function WorkOrderFormSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Work Order Details */}
      <Card className="min-h-[480px]">
        <CardHeader className="h-16">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
          ))}
          <FormFieldSkeleton label="Description" type="textarea" />
        </CardContent>
      </Card>

      {/* Parts & Labor */}
      <Card className="min-h-[400px]">
        <CardHeader className="h-16">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="h-20 flex items-center justify-end gap-3 border-t pt-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

/**
 * UserManagementFormSkeleton - Loading state for user forms
 * Fixed Height: ~400px (15 fields)
 */
export function UserManagementFormSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>

      <Card className="min-h-[480px]">
        <CardHeader className="h-16">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Details */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
          ))}

          {/* Permissions */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="h-20 flex items-center justify-end gap-3 border-t pt-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

/**
 * FormFieldSkeleton - Reusable form field skeleton
 * Fixed Height: 76px (label + input + error space)
 */
function FormFieldSkeleton({
  label,
  required = false,
  type = 'input'
}: {
  label?: string
  required?: boolean
  type?: 'input' | 'select' | 'textarea'
}) {
  return (
    <div className="space-y-2 h-[76px]">
      <div className="flex items-center gap-1">
        <Skeleton className="h-4 w-24" />
        {required && <Skeleton className="h-3 w-3 rounded-full" />}
      </div>
      {type === 'textarea' ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <Skeleton className="h-10 w-full" />
      )}
      {/* Space for error message */}
      <div className="h-4" />
    </div>
  )
}
