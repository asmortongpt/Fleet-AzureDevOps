# Damage Reports Feature

Comprehensive React UI components for managing vehicle damage reports with photo/video uploads, 3D model generation, and linked work orders.

## Components

### 1. DamageReportList.tsx
**Purpose:** List view of all damage reports with advanced filtering and pagination.

**Features:**
- Display all damage reports in card format
- Filter by severity (minor, moderate, severe)
- Filter by status (open, in_progress, resolved)
- Filter by 3D model status (pending, processing, completed, failed)
- Search by description or location
- Pagination support
- Responsive design with Tailwind CSS
- Keyboard navigation and ARIA labels

**Usage:**
```tsx
import { DamageReportList } from '@/components/DamageReports'

// Show all damage reports
<DamageReportList />

// Filter by vehicle
<DamageReportList vehicleId="uuid-here" />
```

### 2. DamageReportDetails.tsx
**Purpose:** Detailed view of a single damage report with full information and media.

**Features:**
- Four-tab interface: Overview, Media, 3D Model, Linked Records
- Photo gallery with thumbnail navigation
- Video playback support
- 3D model viewer integration
- Display linked work orders and inspections
- Edit button with navigation
- Generate 3D model button (if photos exist)
- Loading and error states

**Usage:**
```tsx
import { DamageReportDetails } from '@/components/DamageReports'

// Use within React Router
<Route path="/damage-reports/:id" element={<DamageReportDetails />} />
```

### 3. CreateDamageReport.tsx
**Purpose:** Form component for creating new damage reports.

**Features:**
- Vehicle selection
- Damage description textarea
- Severity level dropdown (minor/moderate/severe)
- Damage location input
- Multi-file upload (photos and videos)
- File preview with thumbnails
- File size validation (max 50MB)
- File type validation (images and videos only)
- Link to work orders (optional)
- Link to inspections (optional)
- Form validation with Zod schema
- Upload progress indicator
- Error handling and display

**Usage:**
```tsx
import { CreateDamageReport } from '@/components/DamageReports'

// Standalone form
<CreateDamageReport />

// Pre-filled vehicle ID
<CreateDamageReport vehicleId="uuid-here" />

// With success callback
<CreateDamageReport
  onSuccess={(reportId) => console.log('Created:', reportId)}
/>
```

### 4. DamageReport3DViewer.tsx
**Purpose:** Interactive 3D model viewer using Three.js.

**Features:**
- Three.js WebGL rendering
- OrbitControls for rotation, pan, and zoom
- GLTF/GLB model loading
- Lighting and grid helper
- Zoom in/out controls
- Reset view button
- Download model button
- Touch support for mobile devices
- Loading and error states
- Responsive design

**Usage:**
```tsx
import { DamageReport3DViewer } from '@/components/DamageReports'

<DamageReport3DViewer modelUrl="https://example.com/model.glb" />
```

## API Service

### damageReportsApi.ts
**Purpose:** TypeScript API client for all damage report endpoints.

**Features:**
- Full TypeScript type definitions
- Axios-based HTTP client
- Error handling with user-friendly messages
- Upload progress tracking
- CRUD operations
- Media upload support
- 3D model generation trigger
- Pagination support

**Types:**
```typescript
interface DamageReport {
  id: string
  tenant_id: string
  vehicle_id: string
  damage_description: string
  damage_severity: 'minor' | 'moderate' | 'severe'
  damage_location?: string
  photos?: string[]
  videos?: string[]
  triposr_status?: 'pending' | 'processing' | 'completed' | 'failed'
  triposr_model_url?: string
  linked_work_order_id?: string
  inspection_id?: string
  status?: 'open' | 'in_progress' | 'resolved'
  created_at?: string
  updated_at?: string
}
```

**Methods:**
```typescript
// Get all reports
await damageReportsApi.getAll({ page: 1, limit: 20, vehicle_id: 'uuid' })

// Get single report
await damageReportsApi.getById('report-uuid')

// Create report
await damageReportsApi.create({
  vehicle_id: 'uuid',
  damage_description: 'Front bumper damage',
  damage_severity: 'moderate',
  photos: ['url1', 'url2']
})

// Update report
await damageReportsApi.update('report-uuid', { status: 'resolved' })

// Delete report
await damageReportsApi.delete('report-uuid')

// Upload media
const formData = new FormData()
formData.append('media', file1)
formData.append('media', file2)
await damageReportsApi.uploadMedia(formData)

// Generate 3D model
await damageReportsApi.generateModel('report-uuid')
```

## Main Page

### DamageReportsPage.tsx
**Purpose:** Main page component with React Router integration.

**Routes:**
- `/damage-reports` - List view (default)
- `/damage-reports/create` - Create new report
- `/damage-reports/:id` - View report details
- `/damage-reports/:id/edit` - Edit report (placeholder)

**Usage:**
```tsx
import { DamageReportsPage } from '@/pages/DamageReportsPage'

// In your app router
<Route path="/damage-reports/*" element={<DamageReportsPage />} />
```

## Styling

All components use:
- **Tailwind CSS** for styling
- **shadcn/ui** components (Button, Card, Input, Select, etc.)
- **Lucide React** for icons
- Responsive design (mobile-first)
- Dark mode support (via Tailwind)

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly
- Focus management
- Error announcements
- Semantic HTML

## Dependencies

Required packages (already in package.json):
- react ^19.2.3
- react-router-dom ^6.28.0
- axios ^1.13.2
- zod ^3.25.76
- three ^0.181.2
- lucide-react ^0.554.0
- @radix-ui components (via shadcn/ui)

## Backend Integration

Components expect these API endpoints (already implemented in `/api/src/routes/damage-reports.ts`):
- `GET /api/damage-reports` - List all reports
- `GET /api/damage-reports/:id` - Get single report
- `POST /api/damage-reports` - Create report
- `PUT /api/damage-reports/:id` - Update report
- `DELETE /api/damage-reports/:id` - Delete report
- `POST /api/damage-reports/upload-media` - Upload media files
- `PATCH /api/damage-reports/:id/triposr-status` - Update 3D model status

## Future Enhancements

- [ ] Edit functionality for existing reports
- [ ] Bulk actions (delete multiple, export)
- [ ] Advanced search with date ranges
- [ ] Export to PDF
- [ ] Email notifications
- [ ] Real-time 3D model generation status updates via WebSocket
- [ ] AR view for 3D models (iOS/Android)
- [ ] Damage cost estimation using AI
- [ ] Integration with insurance systems

## Testing

Example test scenarios:
1. List loading and pagination
2. Filter functionality
3. Form validation
4. File upload with progress
5. Error handling
6. 3D model viewer controls
7. Navigation between routes

## Code Quality

- TypeScript strict mode
- ESLint compliant
- No console warnings
- Proper error boundaries
- Loading states
- Empty states
- Responsive design
