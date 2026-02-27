/**
 * VehicleShowroom3D - Immersive 3D Vehicle Dashboard
 *
 * EZ360/IMAGIN.studio-inspired full-viewport 3D experience:
 * - Full-screen 3D Canvas as background (75%+ viewport)
 * - Glassmorphism top bar with vehicle selector
 * - Left HUD overlay for health stats
 * - Bottom camera preset bar
 * - Right slide-out 9-tab data panel
 * - Damage mode with clickable damage markers
 * - Photo upload modal (interior/exterior categories)
 * - Timeline drawer for chronological events
 * - DamageStrip bottom collapsible damage silhouette
 */

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  Car,
  ChevronLeft,
  CircleDot,
  Clock,
  Columns,
  Eye,
  FileText,
  Fuel,
  History,
  LayoutGrid,
  Loader2,
  PanelRight,
  Shield,
  Sparkles,
  Upload,
  User,
  Users,
  Wrench,
  X,
  AlertTriangle,
  Image as ImageIcon,
  Crosshair,
  MoreHorizontal,
  MapPin,
  Cog,
  Video,
} from 'lucide-react';
import { lazy, Suspense, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import useSWR from 'swr';

import { AIModelGenerationPanel } from '@/components/garage/AIModelGenerationPanel';
import { ComparisonSplitView } from '@/components/garage/ComparisonSplitView';
import type { DamagePoint } from '@/components/garage/DamageOverlay';
import { DamageStrip, type DamagePin, type DamageZone } from '@/components/garage/DamageStrip';
import { FleetGalleryGrid } from '@/components/garage/FleetGalleryGrid';
import { ReferencePhotoCard } from '@/components/garage/ReferencePhotoCard';
import { TimelineDrawer, type TimelineEvent } from '@/components/garage/TimelineDrawer';
import { VehicleHUD, type VehicleStats } from '@/components/garage/VehicleHUD';
import { VehicleScanUpload } from '@/components/garage/VehicleScanUpload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrilldown } from '@/contexts/DrilldownContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTenant } from '@/contexts/TenantContext';
import { useVehicles } from '@/hooks/use-api';
import { apiFetcher } from '@/lib/api-fetcher';
import { cn } from '@/lib/utils';
import { formatEnum } from '@/utils/format-enum';
import { formatDate, formatCurrency, formatNumber } from '@/utils/format-helpers';
import { buildImaginUrl, hexToPaintId } from '@/utils/imagin-studio';
import { resolveLocalModelUrl } from '@/utils/model-resolution';
import { formatVehicleName } from '@/utils/vehicle-display';

const Asset3DViewer = lazy(() => import('@/components/garage/Asset3DViewer'));

/* ---------- Types ---------- */

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType: 'sedan' | 'suv' | 'truck' | 'van' | 'pickup' | 'bus';
  modelUrl: string;
  vin?: string;
  license_plate?: string;
  status?: string;
  unit_number?: string;
  current_odometer_miles?: number;
  fuel_level_percent?: number;
  assigned_driver_id?: string;
}

/* resolveLocalModelUrl imported from @/utils/model-resolution */

/* ---------- Helpers ---------- */

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'active': case 'available': case 'completed': return 'success' as const;
    case 'in_progress': case 'in_use': case 'in_service': return 'info' as const;
    case 'pending': case 'scheduled': return 'warning' as const;
    case 'inactive': case 'out_of_service': case 'cancelled': case 'failed': return 'destructive' as const;
    default: return 'outline' as const;
  }
}

function severityBadgeVariant(severity: string) {
  switch (severity) {
    case 'critical': case 'high': return 'destructive' as const;
    case 'medium': return 'warning' as const;
    default: return 'outline' as const;
  }
}

function healthBarColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-white/[0.03] rounded animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="w-10 h-10 text-white/20 mb-3" />
      <p className="text-sm text-white/40">{message}</p>
    </div>
  );
}

/* ---------- Camera Presets ---------- */

const CAMERA_PRESETS = [
  { id: 'hero', label: 'Hero', icon: Sparkles, key: '1' },
  { id: 'front', label: 'Front', icon: ArrowUp, key: '2' },
  { id: 'rear', label: 'Rear', icon: ArrowDown, key: '3' },
  { id: 'left', label: 'Left', icon: ArrowLeft, key: '4' },
  { id: 'right', label: 'Right', icon: ArrowRight, key: '5' },
  { id: 'topDown', label: 'Top', icon: Eye, key: '6' },
  { id: 'interior', label: 'Interior', icon: User, key: '7' },
  { id: 'wheelDetail', label: 'Wheel', icon: CircleDot, key: '8' },
  { id: 'engineBay', label: 'Engine', icon: Cog, key: '9' },
  { id: 'lowAngle', label: 'Low', icon: Camera, key: '0' },
] as const;

/* ---------- Photo Upload Modal ---------- */

function PhotoUploadModal({
  onClose,
  onUpload,
  onApplyWrap,
  onClearWrap,
  photos,
  hasActiveWrap,
}: {
  onClose: () => void;
  onUpload: (files: File[], category: string) => void;
  onApplyWrap: (photoUrl: string) => void;
  onClearWrap: () => void;
  photos: Array<{ id: string; url: string; name: string; category: string }>;
  hasActiveWrap: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<'exterior' | 'interior'>('exterior');

  const handleFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        onUpload(Array.from(e.target.files), activeCategory);
        e.target.value = '';
      }
    },
    [onUpload, activeCategory]
  );

  const handleVideoFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        // Create a video element and extract a frame as texture
        const video = document.createElement('video');
        video.src = url;
        video.muted = true;
        video.playsInline = true;
        video.onloadeddata = () => {
          video.currentTime = 0.5; // seek to 0.5s for a good frame
        };
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            const frameUrl = canvas.toDataURL('image/png');
            onApplyWrap(frameUrl);
            toast.success('Video frame applied as vehicle wrap');
          }
          URL.revokeObjectURL(url);
        };
      }
    },
    [onApplyWrap]
  );

  const filtered = photos.filter((p) => p.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0e0e0e] rounded-xl border border-white/[0.04]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
          <h3 className="text-sm font-semibold text-white">Vehicle Photos & Wraps</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close gallery">
            <X className="w-4 h-4 text-white/60" />
          </Button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-4 pt-3">
          {(['exterior', 'interior'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize',
                activeCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/[0.05]'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Upload zones */}
        <div className="p-4 space-y-3">
          {/* Image upload */}
          <label className="block border-2 border-dashed border-white/[0.04] rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500/40 transition-colors">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            <Upload className="mx-auto h-6 w-6 text-white/30 mb-1" />
            <p className="text-xs text-white/50">
              Drop {activeCategory} photos or click to upload
            </p>
          </label>

          {/* Video upload for wrap extraction */}
          <label className="block border-2 border-dashed border-white/[0.04] rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500/40 transition-colors">
            <input type="file" accept="video/*" className="hidden" onChange={handleVideoFile} />
            <Video className="mx-auto h-6 w-6 text-white/30 mb-1" />
            <p className="text-xs text-white/50">
              Upload video to extract frame as vehicle wrap
            </p>
          </label>

          {/* Active wrap indicator */}
          {hasActiveWrap && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs text-emerald-400 font-medium">Wrap texture active</span>
              <button
                onClick={onClearWrap}
                className="text-xs text-white/40 hover:text-white/60 underline"
              >
                Remove wrap
              </button>
            </div>
          )}
        </div>

        {/* Photo grid with "Apply as Wrap" */}
        {filtered.length > 0 && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-4 gap-2">
              {filtered.map((photo) => (
                <div key={photo.id} className="relative group aspect-square">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex flex-col items-center justify-center gap-1">
                    <span className="text-[9px] text-white font-medium truncate max-w-full px-1">{photo.name}</span>
                    {photo.category === 'exterior' && (
                      <button
                        onClick={() => {
                          onApplyWrap(photo.url);
                          toast.success('Photo applied as vehicle wrap');
                        }}
                        className="px-2 py-0.5 text-[9px] font-medium bg-emerald-500/80 text-white rounded-full hover:bg-emerald-500 transition-colors"
                      >
                        Apply Wrap
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="px-4 pb-4 text-center">
            <p className="text-xs text-white/30">No {activeCategory} photos yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================ */
/* ==================== MAIN COMPONENT ============================ */
/* ================================================================ */

export default function VehicleShowroom3D() {
  const { navigateTo } = useNavigation();
  const { push } = useDrilldown();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tenantId } = useTenant();

  const vehicleIdParam = searchParams.get('id');

  // Core state
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentCamera, setCurrentCamera] = useState<string>('hero');
  const [viewMode, setViewMode] = useState<'exterior' | 'interior'>('exterior');

  // Panel / overlay state
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false);
  const [dataPanelTab, setDataPanelTab] = useState('overview');
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isDamageMode, setIsDamageMode] = useState(false);
  const [isDamageStripExpanded, setIsDamageStripExpanded] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [wrapTextureUrl, setWrapTextureUrl] = useState<string | null>(null);

  // Auto-rotate speed (0.2 to 3.0)
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(0.8);

  // Reference image / model accuracy state
  const [isModelExact, setIsModelExact] = useState(true);
  const [matchedModelName, setMatchedModelName] = useState<string | null>(null);
  const [showReferenceCard, setShowReferenceCard] = useState(true);
  const [autoWrapApplied, setAutoWrapApplied] = useState(false);

  // Feature: Fleet Gallery (F4)
  const [showGallery, setShowGallery] = useState(false);

  // Feature: Color Sync (F1)
  const [vehicleColor, setVehicleColor] = useState<string | null>(null);
  const [vehicleColorName, setVehicleColorName] = useState<string | null>(null);

  // Feature: Comparison Split View (F2)
  const [isComparisonMode, setIsComparisonMode] = useState(false);

  // Feature: AI Model Generation (F3)
  const [showAIGenerationPanel, setShowAIGenerationPanel] = useState(false);

  // Feature: Vehicle Scanner
  const [showScanUpload, setShowScanUpload] = useState(false);

  // Vehicle crossfade animation
  const [viewerOpacity, setViewerOpacity] = useState(1);
  const prevVehicleId = useRef<string | null>(null);

  // Damage state
  const [damagePins, setDamagePins] = useState<DamagePin[]>([]);

  // Feature 3: Scan damage points from VehicleScanUpload → 3D viewer
  const [scanDamagePoints, setScanDamagePoints] = useState<DamagePoint[]>([]);

  // Feature 5: Condition timeline from scan history
  const [scanHistory, setScanHistory] = useState<
    Array<{ scan_id: string; timestamp: string; overall_score: number; damage_count: number }>
  >([]);

  // Photos state
  const [vehiclePhotos, setVehiclePhotos] = useState<
    Array<{ id: string; url: string; name: string; category: string }>
  >([]);

  // Fetch fleet vehicles
  const {
    data: vehiclesData,
    isLoading: vehiclesLoading,
    error: vehiclesError,
  } = useVehicles({ tenant_id: tenantId || '' });

  const typeMap: Record<string, Vehicle['vehicleType']> = {
    sedan: 'sedan', suv: 'suv', truck: 'truck', van: 'van', bus: 'bus', pickup: 'pickup',
  };

  const showroomVehicles: Vehicle[] = useMemo(() => {
    if (!vehiclesData) return [];
    return vehiclesData.map((v: any) => ({
      id: String(v.id),
      make: v.make,
      model: v.model,
      year: v.year,
      vehicleType: typeMap[v.type] || 'sedan',
      modelUrl: '',
      vin: v.vin,
      license_plate: v.license_plate,
      status: v.status,
      unit_number: v.unit_number,
      current_odometer_miles: v.current_odometer_miles,
      fuel_level_percent: v.fuel_level_percent,
      assigned_driver_id: v.assigned_driver_id,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiclesData]);

  // Vehicle-specific SWR hooks
  const vehicleId = selectedVehicle?.id;

  const { data: vehicleDetail } = useSWR(
    vehicleId ? `/api/vehicles/${vehicleId}` : null, apiFetcher,
    { shouldRetryOnError: false }
  );
  const { data: maintenanceHistory, isLoading: maintLoading } = useSWR(
    vehicleId ? `/api/vehicles/${vehicleId}/maintenance` : null, apiFetcher,
    { shouldRetryOnError: false }
  );
  const { data: incidents, isLoading: incidentsLoading } = useSWR(
    vehicleId ? `/api/vehicles/${vehicleId}/incidents` : null, apiFetcher,
    { shouldRetryOnError: false }
  );
  const { data: inspections, isLoading: inspectionsLoading } = useSWR(
    vehicleId ? `/api/vehicles/${vehicleId}/inspections` : null, apiFetcher,
    { shouldRetryOnError: false }
  );
  const { data: fuelRecords, isLoading: fuelLoading } = useSWR(
    vehicleId ? `/api/vehicles/${vehicleId}/fuel` : null, apiFetcher,
    { shouldRetryOnError: false }
  );
  const { data: tires, isLoading: tiresLoading } = useSWR(
    vehicleId ? `/api/tires?vehicle_id=${vehicleId}` : null, apiFetcher,
    { shouldRetryOnError: false }
  );
  const { data: costs, isLoading: costsLoading } = useSWR(
    vehicleId ? `/api/costs/vehicle/${vehicleId}` : null, apiFetcher,
    { shouldRetryOnError: false }
  );
  const { data: assignments, isLoading: assignmentsLoading } = useSWR(
    vehicleId ? `/api/vehicle-assignments?vehicle_id=${vehicleId}` : null, apiFetcher,
    { shouldRetryOnError: false }
  );
  const { data: insurance, isLoading: insuranceLoading } = useSWR(
    vehicleId ? `/api/insurance?vehicle_id=${vehicleId}` : null, apiFetcher,
    { shouldRetryOnError: false }
  );
  const { data: schedules } = useSWR(
    vehicleId ? `/api/maintenance-schedules?vehicle_id=${vehicleId}&status=active&limit=5` : null,
    apiFetcher, { shouldRetryOnError: false }
  );

  // Safe array helpers
  const maintArr = Array.isArray(maintenanceHistory) ? maintenanceHistory : [];
  const incidentsArr = Array.isArray(incidents) ? incidents : [];
  const inspectionsArr = Array.isArray(inspections) ? inspections : [];
  const fuelArr = Array.isArray(fuelRecords) ? fuelRecords : [];
  const schedulesArr = Array.isArray(schedules) ? schedules : [];
  const nextPm = schedulesArr.length > 0 ? schedulesArr[0] : null;

  // Build VehicleHUD stats
  const vehicleStats: VehicleStats = useMemo(() => {
    const v = selectedVehicle;
    const d = vehicleDetail;
    return {
      name: v ? formatVehicleName(v) : '',
      make: v?.make || '',
      model: v?.model || '',
      year: v?.year || 0,
      vin: d?.vin || v?.vin,
      licensePlate: d?.license_plate || v?.license_plate,
      mileage: v?.current_odometer_miles,
      fuelLevel: v?.fuel_level_percent,
      oilLife: d?.oil_life_percent ?? 78,
      brakeLife: d?.brake_life_percent ?? 65,
      tireHealth: d?.tire_health_percent ?? 82,
      batteryHealth: d?.battery_health_percent ?? 91,
    };
  }, [selectedVehicle, vehicleDetail]);

  // Build timeline events from maintenance + incidents
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = [];
    maintArr.forEach((m: any) => {
      events.push({
        id: `maint-${m.id}`,
        type: 'maintenance',
        title: m.description || m.title || 'Maintenance',
        description: m.notes || m.description,
        date: new Date(m.date || m.created_at || Date.now()),
        mileage: m.odometer,
        cost: m.cost,
        status: m.status || 'completed',
        technician: m.technician_name,
      });
    });
    incidentsArr.forEach((inc: any) => {
      events.push({
        id: `incident-${inc.id}`,
        type: 'damage',
        title: inc.title || (inc.type ? formatEnum(inc.type) : 'Incident'),
        description: inc.description,
        date: new Date(inc.date || inc.incident_date || Date.now()),
        cost: inc.cost || inc.estimated_cost,
        status: inc.status || 'completed',
        severity: inc.severity as any,
      });
    });
    inspectionsArr.forEach((insp: any) => {
      events.push({
        id: `insp-${insp.id}`,
        type: 'inspection',
        title: insp.type ? formatEnum(insp.type) + ' Inspection' : 'Inspection',
        description: insp.notes,
        date: new Date(insp.date || insp.completed_at || Date.now()),
        status: insp.result === 'passed' || insp.passed_inspection ? 'completed' : 'pending',
      });
    });
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [maintArr, incidentsArr, inspectionsArr]);

  // Build interactive 3D hotspots from vehicle telemetry (EZ360-style)
  const vehicleHotspots = useMemo(() => {
    if (!selectedVehicle) return [];
    const s = vehicleStats;
    const h: Array<{
      id: string; label: string; position: [number, number, number];
      value: string; unit?: string; status: 'good' | 'warning' | 'critical'; detail?: string;
    }> = [];

    if (s.oilLife !== undefined) {
      h.push({
        id: 'oil', label: 'Oil', position: [0, 1.0, 1.5],
        value: `${s.oilLife}`, unit: '%',
        status: s.oilLife >= 50 ? 'good' : s.oilLife >= 20 ? 'warning' : 'critical',
        detail: `Oil life ${s.oilLife}% remaining`,
      });
    }
    if (s.fuelLevel !== undefined) {
      h.push({
        id: 'fuel', label: 'Fuel', position: [-1.2, 0.5, -0.8],
        value: `${s.fuelLevel}`, unit: '%',
        status: s.fuelLevel >= 30 ? 'good' : s.fuelLevel >= 15 ? 'warning' : 'critical',
        detail: `Fuel tank ${s.fuelLevel}% full`,
      });
    }
    if (s.tireHealth !== undefined) {
      h.push({
        id: 'tire-fl', label: 'Tires', position: [-1.0, 0.3, 1.3],
        value: `${s.tireHealth}`, unit: '%',
        status: s.tireHealth >= 60 ? 'good' : s.tireHealth >= 30 ? 'warning' : 'critical',
        detail: `Overall tire health ${s.tireHealth}%`,
      });
    }
    if (s.brakeLife !== undefined) {
      h.push({
        id: 'brakes', label: 'Brakes', position: [1.0, 0.3, 1.3],
        value: `${s.brakeLife}`, unit: '%',
        status: s.brakeLife >= 50 ? 'good' : s.brakeLife >= 20 ? 'warning' : 'critical',
        detail: `Brake pad life ${s.brakeLife}% remaining`,
      });
    }
    if (s.batteryHealth !== undefined) {
      h.push({
        id: 'battery', label: 'Battery', position: [0.8, 0.8, 1.6],
        value: `${s.batteryHealth}`, unit: '%',
        status: s.batteryHealth >= 60 ? 'good' : s.batteryHealth >= 30 ? 'warning' : 'critical',
        detail: `Battery health ${s.batteryHealth}%`,
      });
    }
    if (s.mileage) {
      h.push({
        id: 'odo', label: 'Odo', position: [0, 1.3, 0.3],
        value: formatNumber(s.mileage), unit: ' mi', status: 'good',
        detail: `${formatNumber(s.mileage)} total miles`,
      });
    }

    // Enrich with schedule/maintenance context
    if (nextPm) {
      const pmDate = nextPm.next_service_date || nextPm.next_due_date;
      if (pmDate) {
        h.push({
          id: 'next-pm', label: 'Next PM', position: [0, 1.6, -0.5],
          value: formatDate(pmDate), status: 'warning',
          detail: `Scheduled: ${nextPm.description || nextPm.task_name || 'Preventive Maintenance'}`,
        });
      }
    }

    if (maintArr.length > 0) {
      const lastService = maintArr[0];
      const serviceDate = lastService.date || lastService.created_at;
      if (serviceDate) {
        h.push({
          id: 'last-service', label: 'Last Svc', position: [-0.8, 1.0, -1.2],
          value: formatDate(serviceDate), status: 'good',
          detail: `${lastService.description || lastService.title || 'Service'} — ${lastService.cost ? formatCurrency(lastService.cost) : 'No cost data'}`,
        });
      }
    }

    return h;
  }, [selectedVehicle, vehicleStats, nextPm, maintArr]);

  // Generate 3D damage points from incident data (instead of hardcoded [])
  const incidentDamagePoints: DamagePoint[] = useMemo(() => {
    if (incidentsArr.length === 0) return [];

    // Map incident types to approximate 3D positions on vehicle
    const incidentPositions: Record<string, [number, number, number]> = {
      collision: [0, 0.8, 2.0],
      property_damage: [-1.0, 0.6, 0.5],
      fender_bender: [1.2, 0.5, 1.8],
      rollover: [0, 1.5, 0],
      vandalism: [-0.8, 0.9, -0.5],
      theft: [0, 1.0, 0],
      weather: [0, 1.8, 0],
      mechanical: [0, 0.6, 1.8],
    };

    return incidentsArr.map((inc: any, idx: number) => {
      const type = (inc.type || 'other').toLowerCase().replace(/\s+/g, '_');
      const basePos = incidentPositions[type] || [
        Math.sin(idx * 1.8) * 1.2,
        0.6 + (idx * 0.2) % 1.0,
        Math.cos(idx * 1.8) * 1.5,
      ];
      // Add slight offset per incident to avoid stacking
      const pos: [number, number, number] = [
        basePos[0] + (idx * 0.15) % 0.5,
        basePos[1],
        basePos[2] + (idx * 0.1) % 0.3,
      ];

      const severity = inc.severity === 'critical' || inc.severity === 'high' ? 'critical'
        : inc.severity === 'medium' ? 'severe'
        : inc.severity === 'low' ? 'moderate'
        : 'minor';

      return {
        id: `inc-${inc.id}`,
        position: pos,
        normal: [0, 1, 0] as [number, number, number],
        severity: severity as any,
        description: inc.description || inc.title || formatEnum(inc.type || 'Incident'),
        estimatedCost: inc.cost || inc.estimated_cost || 0,
        photos: [],
        createdAt: inc.date || inc.incident_date || new Date().toISOString(),
        zone: inc.location || formatEnum(inc.type || 'general'),
      };
    });
  }, [incidentsArr]);

  // Feature 3: Merge incident damage + scan damage points
  const allDamagePoints: DamagePoint[] = useMemo(
    () => [...incidentDamagePoints, ...scanDamagePoints],
    [incidentDamagePoints, scanDamagePoints]
  );

  // Feature 5: Fetch scan history for condition timeline
  useEffect(() => {
    if (!vehicleId) {
      setScanHistory([]);
      return;
    }
    let active = true;
    fetch(`/api/vehicle-scanner/scan/history/${vehicleId}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch scan history');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const arr = Array.isArray(data) ? data : data?.history || [];
        setScanHistory(arr);
      })
      .catch(() => {
        if (active) setScanHistory([]);
      });
    return () => { active = false; };
  }, [vehicleId]);

  // Keyboard shortcuts for camera presets & toggles
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      const keyMap: Record<string, string> = {
        '1': 'hero', '2': 'front', '3': 'rear', '4': 'left', '5': 'right',
        '6': 'topDown', '7': 'interior', '8': 'wheelDetail', '9': 'engineBay', '0': 'lowAngle',
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        setCurrentCamera(keyMap[e.key]);
      } else if (e.key === 'r' || e.key === 'R') {
        setAutoRotate((p) => !p);
      } else if (e.key === 'h' || e.key === 'H') {
        setShowHotspots((p) => !p);
      } else if (e.key === 'd' || e.key === 'D') {
        setIsDamageMode((p) => !p);
      } else if (e.key === 'g' || e.key === 'G') {
        setShowGallery((p) => !p);
      } else if (e.key === 'c' || e.key === 'C') {
        setIsComparisonMode((p) => !p);
      } else if (e.key === 's' || e.key === 'S') {
        setShowScanUpload((p) => !p);
      } else if (e.key === 'Escape') {
        if (showScanUpload) setShowScanUpload(false);
        else if (showGallery) setShowGallery(false);
        else if (isComparisonMode) setIsComparisonMode(false);
        else if (showAIGenerationPanel) setShowAIGenerationPanel(false);
        else if (isDataPanelOpen) setIsDataPanelOpen(false);
        else if (isTimelineOpen) setIsTimelineOpen(false);
        else if (isDamageMode) setIsDamageMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDataPanelOpen, isTimelineOpen, isDamageMode, showGallery, isComparisonMode, showAIGenerationPanel, showScanUpload]);

  // Load vehicle on mount or when ID changes
  useEffect(() => {
    if (showroomVehicles.length === 0) return;
    if (vehicleIdParam) {
      const vehicle = showroomVehicles.find(
        (v) => v.id === vehicleIdParam || v.id === String(vehicleIdParam)
      );
      if (vehicle) setSelectedVehicle(vehicle);
    } else {
      setSelectedVehicle(showroomVehicles[0]);
    }
  }, [vehicleIdParam, showroomVehicles]);

  // Crossfade: when vehicle changes, fade out, load, fade in
  useEffect(() => {
    if (!selectedVehicle?.id) return;
    if (prevVehicleId.current && prevVehicleId.current !== selectedVehicle.id) {
      setViewerOpacity(0);
      const timer = setTimeout(() => setViewerOpacity(1), 450);
      return () => clearTimeout(timer);
    }
    prevVehicleId.current = selectedVehicle.id;
  }, [selectedVehicle?.id]);

  // Load 3D model when selected vehicle changes
  useEffect(() => {
    if (!selectedVehicle?.id) return;
    let active = true;

    const fetchModel = async () => {
      setModelLoading(true);
      setModelError(null);
      prevVehicleId.current = selectedVehicle.id;

      // Clear previous auto-wrap when switching vehicles
      if (autoWrapApplied) {
        setWrapTextureUrl(null);
        setAutoWrapApplied(false);
      }

      try {
        const response = await fetch(`/api/vehicle-3d/${selectedVehicle.id}/3d-model`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (!active) return;
          const glbUrl = data.glb_model_url || data.glbModelUrl || data.model_url || data.modelUrl;

          // Read color data (Feature 1: Color Sync)
          if (data.exterior_color_hex) {
            setVehicleColor(data.exterior_color_hex);
            setVehicleColorName(data.exterior_color_name || null);
          } else {
            setVehicleColor(null);
            setVehicleColorName(null);
          }

          if (glbUrl) {
            setModelUrl(glbUrl);
            setIsModelExact(true);
            setMatchedModelName(null);
            setModelLoading(false);
            return;
          }
        }
      } catch {
        // API failed -- fall through to local resolution
      }

      if (!active) return;
      const resolution = resolveLocalModelUrl(
        selectedVehicle.make,
        selectedVehicle.model,
        selectedVehicle.vehicleType
      );
      setModelUrl(resolution.url);
      setIsModelExact(resolution.isExactMatch);
      setMatchedModelName(resolution.matchedModelName);
      setShowReferenceCard(true);
      setModelError(null);
      setModelLoading(false);

      // Auto-wrap for approximate models: preload the side-view reference image
      if (!resolution.isExactMatch) {
        const pid = vehicleColor ? hexToPaintId(vehicleColor) : undefined;
        const wrapUrl = buildImaginUrl(selectedVehicle.make, selectedVehicle.model, selectedVehicle.year, '02', 1200, pid);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (!active) return;
          setWrapTextureUrl(wrapUrl);
          setAutoWrapApplied(true);
        };
        img.onerror = () => {
          // CDN image unavailable — skip auto-wrap
        };
        img.src = wrapUrl;
      }
    };

    fetchModel();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicle?.id, selectedVehicle?.make, selectedVehicle?.model, selectedVehicle?.vehicleType]);

  // When switching interior/exterior, update camera
  useEffect(() => {
    if (viewMode === 'interior') {
      setCurrentCamera('interior');
    } else if (currentCamera === 'interior') {
      setCurrentCamera('hero');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // Handlers
  const handleVehicleSelect = useCallback(
    (id: string) => {
      const vehicle = showroomVehicles.find((v) => v.id === id);
      if (vehicle) {
        setSelectedVehicle(vehicle);
        setSearchParams({ id: vehicle.id });
        setCurrentCamera('hero');
        setAutoRotate(true);
      }
    },
    [showroomVehicles, setSearchParams]
  );

  const handlePhotoUpload = useCallback((files: File[], category: string) => {
    const newPhotos = files.map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      name: file.name,
      category,
    }));
    setVehiclePhotos((prev) => [...prev, ...newPhotos]);
    toast.success(`${files.length} ${category} photo(s) added`);
  }, []);

  const handleViewWorkOrder = useCallback(
    (woId: string, woNumber: string) => {
      push({
        id: `work-order-${woId}`,
        type: 'work-order',
        label: `WO #${woNumber}`,
        data: { workOrderId: woId },
      });
    },
    [push]
  );

  const handleViewDriver = useCallback(
    (driverId: string, driverName: string) => {
      push({
        id: `driver-${driverId}`,
        type: 'driver',
        label: driverName,
        data: { driverId },
      });
    },
    [push]
  );

  const handleAddDamage = useCallback(
    (zone: DamageZone, position: { x: number; y: number }) => {
      const newPin: DamagePin = {
        id: crypto.randomUUID(),
        zone,
        position,
        severity: 'minor',
        description: 'New damage point',
        date: new Date(),
      };
      setDamagePins((prev) => [...prev, newPin]);
      toast.success('Damage marker added');
    },
    []
  );

  // Loading state
  if (vehiclesLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#111]">
        <div className="text-center space-y-2">
          <Loader2 className="w-16 h-16 text-white/30 mx-auto animate-spin" />
          <p className="text-white/50">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (vehiclesError) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4 bg-[#111]">
        <p className="text-rose-400 font-medium">Failed to load vehicle data</p>
        <p className="text-sm text-white/50">
          {vehiclesError instanceof Error ? vehiclesError.message : 'An unexpected error occurred'}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // No vehicle
  if (!selectedVehicle) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#111]">
        <div className="text-center space-y-2">
          <Car className="w-16 h-16 text-white/20 mx-auto" />
          <p className="text-white/50">No vehicles available</p>
          <Button variant="outline" onClick={() => navigateTo('virtual-garage')}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Garage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#111]">
      {/* ========================================== */}
      {/* Layer 0: Full-viewport 3D Viewer           */}
      {/* ========================================== */}
      <div className="absolute inset-0 z-0">
        {modelLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <Loader2 className="w-12 h-12 text-white/30 mx-auto animate-spin" />
              <p className="text-sm text-white/50">Loading 3D model...</p>
            </div>
          </div>
        )}
        {!modelLoading && modelUrl && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-10 h-10 text-white/20 animate-spin" />
              </div>
            }
          >
            <Asset3DViewer
              make={selectedVehicle.make}
              model={selectedVehicle.model}
              year={selectedVehicle.year}
              customModelUrl={modelUrl}
              currentCamera={currentCamera}
              autoRotate={autoRotate}
              autoRotateSpeed={autoRotateSpeed}
              showDamage={true}
              damagePoints={allDamagePoints}
              qualityLevel="high"
              showControls={false}
              hotspots={vehicleHotspots}
              showHotspots={showHotspots}
              wrapTextureUrl={wrapTextureUrl || undefined}
              color={vehicleColor || undefined}
              opacity={viewerOpacity}
              onCameraChange={(preset) => setCurrentCamera(preset)}
              onLoad={() => setModelLoading(false)}
              onError={() => setModelError('Failed to load 3D model')}
            />
          </Suspense>
        )}
        {!modelLoading && !modelUrl && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <Car className="w-12 h-12 text-white/20 mx-auto" />
              <p className="text-sm text-white/50">{modelError || '3D model unavailable'}</p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* Interior photos overlay (when in interior mode) */}
      {/* ========================================== */}
      {viewMode === 'interior' && vehiclePhotos.filter(p => p.category === 'interior').length > 0 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-2 p-2 bg-[#111]/70 backdrop-blur-sm rounded-xl border border-white/[0.04]">
          {vehiclePhotos
            .filter(p => p.category === 'interior')
            .slice(0, 6)
            .map((photo) => (
              <div key={photo.id} className="w-20 h-14 rounded-lg overflow-hidden border border-white/[0.04] cursor-pointer hover:border-emerald-500/50 transition-colors">
                <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
              </div>
            ))}
        </div>
      )}

      {/* ========================================== */}
      {/* Layer 1: Top bar (glassmorphism, h-12)      */}
      {/* ========================================== */}
      <div className="absolute top-0 left-0 right-0 z-20 h-12 bg-[#111]/80 backdrop-blur-md border-b border-white/[0.04] flex items-center px-4 gap-3">
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/60 hover:text-white"
          onClick={() => navigateTo('virtual-garage')}
          aria-label="Go back to virtual garage"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Vehicle dropdown selector */}
        <Select value={selectedVehicle.id} onValueChange={handleVehicleSelect}>
          <SelectTrigger className="w-52 h-8 text-xs bg-white/[0.05] border-white/[0.04] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {showroomVehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {formatVehicleName(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Vehicle name + status */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-semibold text-white">
            {formatVehicleName(selectedVehicle)}
          </span>
          {selectedVehicle.unit_number && (
            <span className="text-xs text-white/40">#{selectedVehicle.unit_number}</span>
          )}
          {selectedVehicle.status && (
            <Badge variant={statusBadgeVariant(selectedVehicle.status)} className="text-[10px]">
              {formatEnum(selectedVehicle.status)}
            </Badge>
          )}
          {/* Model accuracy badge */}
          {isModelExact ? (
            <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
              Exact 3D Model
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/20">
              Approximate{matchedModelName ? ` (${matchedModelName})` : ''}
            </Badge>
          )}
          {vehicleColorName && (
            <span className="text-[10px] text-white/40">{vehicleColorName}</span>
          )}
        </div>

        {/* Gallery toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', showGallery ? 'text-emerald-400' : 'text-white/40 hover:text-white/60')}
          onClick={() => setShowGallery(!showGallery)}
          title="Fleet Gallery (G)"
          aria-label="Toggle fleet gallery"
        >
          <LayoutGrid className="w-4 h-4" />
        </Button>

        {/* Scan button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', showScanUpload ? 'text-emerald-400' : 'text-white/40 hover:text-white/60')}
          onClick={() => setShowScanUpload(!showScanUpload)}
          title="Vehicle Scanner (S)"
          aria-label="Toggle vehicle scanner"
        >
          <Camera className="w-4 h-4" />
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Interior / Exterior segmented control */}
        <div className="flex h-8 rounded-lg border border-white/[0.04] overflow-hidden bg-white/[0.03]">
          <button
            onClick={() => setViewMode('exterior')}
            className={cn(
              'px-3 text-xs font-medium transition-colors',
              viewMode === 'exterior'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-white/50 hover:text-white/70'
            )}
          >
            Exterior
          </button>
          <button
            onClick={() => setViewMode('interior')}
            className={cn(
              'px-3 text-xs font-medium transition-colors',
              viewMode === 'interior'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-white/50 hover:text-white/70'
            )}
          >
            Interior
          </button>
        </div>

        {/* Auto-rotate toggle + speed */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              autoRotate ? 'text-emerald-400' : 'text-white/40'
            )}
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Stop rotation' : 'Auto rotate'}
            aria-label={autoRotate ? 'Stop auto-rotation' : 'Start auto-rotation'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
          </Button>
          {autoRotate && (
            <input
              type="range"
              min="0.2"
              max="3"
              step="0.1"
              value={autoRotateSpeed}
              onChange={(e) => setAutoRotateSpeed(Number(e.target.value))}
              className="w-16 h-1 appearance-none bg-white/[0.12] rounded-full accent-emerald-500 cursor-pointer"
              title={`Speed: ${autoRotateSpeed.toFixed(1)}x`}
            />
          )}
        </div>

        {/* More menu placeholder */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white/60" aria-label="More options">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* ========================================== */}
      {/* Layer 2: Left HUD (glassmorphism overlay)   */}
      {/* ========================================== */}
      <div className="absolute left-4 top-16 w-56 z-10 bg-[#111]/70 backdrop-blur-sm rounded-xl border border-white/[0.04] p-3 max-h-[calc(100vh-140px)] overflow-y-auto">
        <VehicleHUD stats={vehicleStats} compact />
      </div>

      {/* ========================================== */}
      {/* Layer 3: Bottom action bar (h-14)           */}
      {/* ========================================== */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-14 bg-[#111]/80 backdrop-blur-md border-t border-white/[0.04] flex items-center justify-center gap-1 px-4">
        {/* Camera preset buttons */}
        {CAMERA_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive = currentCamera === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => {
                setCurrentCamera(preset.id);
                if (viewMode === 'interior') setViewMode('exterior');
              }}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-[52px]',
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
              )}
              title={`${preset.label} (${preset.key})`}
            >
              <Icon className="w-4 h-4" />
              <span>{preset.label}</span>
            </button>
          );
        })}

        {/* Separator */}
        <div className="w-px h-8 bg-white/[0.04] mx-2" />

        {/* Action buttons */}
        <button
          onClick={() => {
            const nextMode = !isDamageMode;
            setIsDamageMode(nextMode);
            setIsDamageStripExpanded(nextMode);
          }}
          className={cn(
            'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-[52px]',
            isDamageMode
              ? 'bg-rose-500/20 text-rose-400'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
          )}
          title="Damage Mode"
        >
          <Crosshair className="w-4 h-4" />
          <span>Damage</span>
        </button>

        <button
          onClick={() => setIsComparisonMode(!isComparisonMode)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-[52px]',
            isComparisonMode
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
          )}
          title="Compare (C)"
        >
          <Columns className="w-4 h-4" />
          <span>Compare</span>
        </button>

        <button
          onClick={() => setShowHotspots(!showHotspots)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-[52px]',
            showHotspots
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
          )}
          title="Toggle Hotspots (H)"
        >
          <MapPin className="w-4 h-4" />
          <span>Hotspots</span>
        </button>

        <button
          onClick={() => setIsPhotoModalOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors min-w-[52px]"
          title="Photos"
        >
          <Camera className="w-4 h-4" />
          <span>Photos</span>
        </button>

        <button
          onClick={() => setShowReferenceCard(!showReferenceCard)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-[52px]',
            showReferenceCard
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
          )}
          title="Reference Photo"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Ref</span>
        </button>

        <button
          onClick={() => {
            const next = !isDataPanelOpen;
            setIsDataPanelOpen(next);
            if (next) setIsTimelineOpen(false);
          }}
          className={cn(
            'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-[52px]',
            isDataPanelOpen
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
          )}
          title="Data Panel"
        >
          <PanelRight className="w-4 h-4" />
          <span>Data</span>
        </button>

        <button
          onClick={() => {
            setIsTimelineOpen(!isTimelineOpen);
            if (!isTimelineOpen) setIsDataPanelOpen(false);
          }}
          className={cn(
            'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-[52px]',
            isTimelineOpen
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
          )}
          title="Timeline"
        >
          <Clock className="w-4 h-4" />
          <span>Timeline</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* Layer 4: DamageStrip (above bottom bar)     */}
      {/* ========================================== */}
      {(isDamageMode || damagePins.length > 0) && (
        <div className="absolute bottom-14 left-0 right-0 z-20">
          <DamageStrip
            damages={damagePins}
            isExpanded={isDamageStripExpanded}
            onToggleExpand={() => setIsDamageStripExpanded((prev) => !prev)}
            onDamageClick={(damage) => toast.info(`Damage: ${damage.description}`)}
            onAddDamage={isDamageMode ? handleAddDamage : undefined}
            showAddMode={isDamageMode}
            className="!relative !inset-auto !z-auto"
          />
        </div>
      )}

      {/* ========================================== */}
      {/* Layer 5: Right slide-out data panel          */}
      {/* ========================================== */}
      <div
        className={cn(
          'absolute right-0 top-12 bottom-14 w-96 z-30 bg-[#0e0e0e] border-l border-white/[0.04] transition-transform duration-300 overflow-hidden flex flex-col',
          isDataPanelOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04] shrink-0">
          <span className="text-xs font-semibold text-white/80">Vehicle Data</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/40"
            onClick={() => setIsDataPanelOpen(false)}
            aria-label="Close vehicle data panel"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Scrollable tab content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={dataPanelTab} onValueChange={setDataPanelTab} className="w-full">
            <TabsList className="sticky top-0 z-10 bg-[#0e0e0e] w-full flex flex-wrap h-auto gap-0.5 p-1 rounded-none border-b border-white/[0.04]">
              <TabsTrigger value="overview" className="text-[10px] h-7 flex-1 min-w-[60px]">Overview</TabsTrigger>
              <TabsTrigger value="maintenance" className="text-[10px] h-7 flex-1 min-w-[60px]">Maint.</TabsTrigger>
              <TabsTrigger value="driver" className="text-[10px] h-7 flex-1 min-w-[60px]">Driver</TabsTrigger>
              <TabsTrigger value="inspections" className="text-[10px] h-7 flex-1 min-w-[60px]">Inspect.</TabsTrigger>
              <TabsTrigger value="fuel" className="text-[10px] h-7 flex-1 min-w-[60px]">Fuel</TabsTrigger>
              <TabsTrigger value="incidents" className="text-[10px] h-7 flex-1 min-w-[60px]">Incidents</TabsTrigger>
              <TabsTrigger value="tires" className="text-[10px] h-7 flex-1 min-w-[60px]">Tires</TabsTrigger>
              <TabsTrigger value="costs" className="text-[10px] h-7 flex-1 min-w-[60px]">Costs</TabsTrigger>
              <TabsTrigger value="compliance" className="text-[10px] h-7 flex-1 min-w-[60px]">Comply</TabsTrigger>
              <TabsTrigger value="history" className="text-[10px] h-7 flex-1 min-w-[60px]">History</TabsTrigger>
            </TabsList>

            {/* ---- Tab: Overview ---- */}
            <TabsContent value="overview" className="p-3 space-y-3 mt-0">
              {/* 4 stat cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-[10px] text-white/50 mb-1">Health Score</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {vehicleDetail?.health_score || 85}%
                  </div>
                  <div className="h-1 mt-1.5 bg-white/[0.06] rounded-full">
                    <div
                      className={cn('h-full rounded-full', healthBarColor(vehicleDetail?.health_score || 85))}
                      style={{ width: `${vehicleDetail?.health_score || 85}%` }}
                    />
                  </div>
                </div>
                <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-[10px] text-white/50 mb-1">Fuel Level</div>
                  <div className="text-lg font-bold text-white">
                    {selectedVehicle.fuel_level_percent != null
                      ? `${selectedVehicle.fuel_level_percent}%`
                      : '\u2014'}
                  </div>
                </div>
                <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-[10px] text-white/50 mb-1">Odometer</div>
                  <div className="text-lg font-bold text-white">
                    {selectedVehicle.current_odometer_miles
                      ? formatNumber(selectedVehicle.current_odometer_miles)
                      : '\u2014'}
                  </div>
                  <div className="text-[9px] text-white/40">miles</div>
                </div>
                <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-[10px] text-white/50 mb-1">Status</div>
                  <div className="mt-1">
                    {selectedVehicle.status ? (
                      <Badge variant={statusBadgeVariant(selectedVehicle.status)} className="text-[10px]">
                        {formatEnum(selectedVehicle.status)}
                      </Badge>
                    ) : (
                      <span className="text-white/40">{'\u2014'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04]">
                <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-2">
                  Vehicle Info
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">VIN</span>
                    <span className="text-white/80 font-mono text-[10px]">
                      {vehicleDetail?.vin || selectedVehicle.vin || '\u2014'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">License Plate</span>
                    <span className="text-white/80">
                      {vehicleDetail?.license_plate || selectedVehicle.license_plate || '\u2014'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Unit #</span>
                    <span className="text-white/80">
                      {vehicleDetail?.unit_number || selectedVehicle.unit_number || '\u2014'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Type</span>
                    <span className="text-white/80 capitalize">{selectedVehicle.vehicleType}</span>
                  </div>
                </div>
              </div>

              {/* Upcoming */}
              <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04]">
                <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-2">
                  Upcoming
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">Next PM Due</span>
                    <span className="text-white/80">
                      {nextPm
                        ? formatDate(nextPm.next_service_date || nextPm.next_due_date)
                        : 'None scheduled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Active WOs</span>
                    <span className="text-white/80">
                      {maintArr.filter(
                        (m: any) => m.status === 'in_progress' || m.status === 'pending'
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Total Maint. Cost</span>
                    <span className="text-white/80">
                      {formatCurrency(
                        maintArr.reduce((s: number, m: any) => s + (m.cost || 0), 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Incidents</span>
                    <span className="text-white/80">{incidentsArr.length}</span>
                  </div>
                </div>
              </div>

              {/* Feature 5: Condition History chart */}
              {scanHistory.length > 1 && (
                <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wide">
                      Condition History
                    </h4>
                    {scanHistory.length >= 2 && (() => {
                      const latest = scanHistory[scanHistory.length - 1].overall_score;
                      const previous = scanHistory[scanHistory.length - 2].overall_score;
                      const diff = latest - previous;
                      const pctChange = previous > 0 ? ((diff / previous) * 100).toFixed(1) : '0.0';
                      return (
                        <span className={cn('text-[10px] font-medium', diff >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                          {diff >= 0 ? '\u2191' : '\u2193'} {Math.abs(Number(pctChange))}%
                        </span>
                      );
                    })()}
                  </div>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart
                      data={scanHistory.map((s) => ({
                        date: formatDate(s.timestamp),
                        score: s.overall_score,
                        damages: s.damage_count,
                      }))}
                      margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                    >
                      <defs>
                        <linearGradient id="conditionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.8)',
                        }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#conditionGradient)"
                        name="Score"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            {/* ---- Tab: Maintenance ---- */}
            <TabsContent value="maintenance" className="p-3 mt-0">
              {maintLoading ? (
                <TableSkeleton />
              ) : maintArr.length === 0 ? (
                <EmptyState icon={Wrench} message="No maintenance records" />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-white/50">
                    <span>
                      {maintArr.length} records &bull;{' '}
                      {formatCurrency(
                        maintArr.reduce((s: number, m: any) => s + (m.cost || 0), 0)
                      )}
                    </span>
                  </div>
                  <div className="bg-[#111111] rounded-lg border border-white/[0.04] overflow-hidden">
                    <div className="max-h-[500px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-[#111111] z-10">
                          <tr className="text-[10px] text-white/40 border-b border-white/[0.04]">
                            <th className="text-left px-2 py-1.5">Date</th>
                            <th className="text-left px-2 py-1.5">WO #</th>
                            <th className="text-left px-2 py-1.5">Type</th>
                            <th className="text-left px-2 py-1.5">Desc</th>
                            <th className="text-right px-2 py-1.5">Cost</th>
                            <th className="text-right px-2 py-1.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {maintArr.slice(0, 50).map((record: any) => (
                            <tr
                              key={record.id}
                              className="hover:bg-white/[0.03] cursor-pointer"
                              onClick={() =>
                                handleViewWorkOrder(
                                  String(record.id),
                                  record.work_order_number || record.number || ''
                                )
                              }
                            >
                              <td className="px-2 py-1.5 text-white/60">
                                {record.date ? formatDate(record.date) : '\u2014'}
                              </td>
                              <td className="px-2 py-1.5 text-white/70 font-mono text-[10px]">
                                {record.work_order_number || record.number || '\u2014'}
                              </td>
                              <td className="px-2 py-1.5">
                                <Badge variant="outline" className="text-[9px]">
                                  {formatEnum(record.type || 'general')}
                                </Badge>
                              </td>
                              <td className="px-2 py-1.5 text-white/50 max-w-[100px] truncate">
                                {record.description || '\u2014'}
                              </td>
                              <td className="px-2 py-1.5 text-right text-white/70">
                                {record.cost ? formatCurrency(record.cost) : '\u2014'}
                              </td>
                              <td className="px-2 py-1.5 text-right">
                                <Badge
                                  variant={statusBadgeVariant(record.status || 'pending')}
                                  className="text-[9px]"
                                >
                                  {formatEnum(record.status || 'pending')}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ---- Tab: Driver ---- */}
            <TabsContent value="driver" className="p-3 mt-0">
              {assignmentsLoading ? (
                <TableSkeleton rows={2} />
              ) : (
                <div className="space-y-3">
                  {/* Current assignment */}
                  {(() => {
                    const assignArr = Array.isArray(assignments) ? assignments : [];
                    const current = assignArr.find(
                      (a: any) => a.lifecycle_state === 'active' || a.status === 'active'
                    );
                    return current ? (
                      <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04]">
                        <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-2">
                          Current Driver
                        </h4>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Users className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <div
                              className="text-xs font-medium text-white/90 cursor-pointer hover:text-emerald-400"
                              onClick={() =>
                                current.driver_id &&
                                handleViewDriver(
                                  String(current.driver_id),
                                  current.driver_name || 'Driver'
                                )
                              }
                            >
                              {current.driver_name || current.driver_id || 'Unknown'}
                            </div>
                            <div className="text-[10px] text-white/50">
                              {current.assignment_type && (
                                <span className="capitalize">{current.assignment_type}</span>
                              )}
                              {current.start_date && (
                                <span> &bull; Since {formatDate(current.start_date)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04]">
                        <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-2">
                          Current Driver
                        </h4>
                        <p className="text-xs text-white/40">No active assignment</p>
                      </div>
                    );
                  })()}

                  {/* Assignment history */}
                  {(() => {
                    const assignArr = Array.isArray(assignments) ? assignments : [];
                    return assignArr.length > 0 ? (
                      <div className="bg-[#111111] rounded-lg border border-white/[0.04] overflow-hidden">
                        <div className="p-2 border-b border-white/[0.04]">
                          <span className="text-[10px] font-semibold text-white/60">
                            Assignment History ({assignArr.length})
                          </span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-[#111111]">
                              <tr className="text-[10px] text-white/40 border-b border-white/[0.04]">
                                <th className="text-left px-2 py-1.5">Driver</th>
                                <th className="text-left px-2 py-1.5">Type</th>
                                <th className="text-left px-2 py-1.5">Start</th>
                                <th className="text-left px-2 py-1.5">End</th>
                                <th className="text-right px-2 py-1.5">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                              {assignArr.map((a: any) => (
                                <tr key={a.id} className="hover:bg-white/[0.03]">
                                  <td className="px-2 py-1.5 text-white/70">
                                    {a.driver_name || a.driver_id || '\u2014'}
                                  </td>
                                  <td className="px-2 py-1.5 text-white/60 capitalize">
                                    {a.assignment_type || '\u2014'}
                                  </td>
                                  <td className="px-2 py-1.5 text-white/60">
                                    {a.start_date ? formatDate(a.start_date) : '\u2014'}
                                  </td>
                                  <td className="px-2 py-1.5 text-white/60">
                                    {a.end_date ? formatDate(a.end_date) : 'Present'}
                                  </td>
                                  <td className="px-2 py-1.5 text-right">
                                    <Badge
                                      variant={statusBadgeVariant(
                                        a.lifecycle_state || a.status || ''
                                      )}
                                      className="text-[9px]"
                                    >
                                      {formatEnum(a.lifecycle_state || a.status || 'unknown')}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <EmptyState icon={Users} message="No driver assignments found" />
                    );
                  })()}
                </div>
              )}
            </TabsContent>

            {/* ---- Tab: Inspections ---- */}
            <TabsContent value="inspections" className="p-3 mt-0">
              {inspectionsLoading ? (
                <TableSkeleton />
              ) : inspectionsArr.length === 0 ? (
                <EmptyState icon={FileText} message="No inspection records" />
              ) : (
                <div className="bg-[#111111] rounded-lg border border-white/[0.04] overflow-hidden">
                  <div className="p-2 border-b border-white/[0.04]">
                    <span className="text-[10px] font-semibold text-white/60">
                      {inspectionsArr.length} Inspections &bull;{' '}
                      {
                        inspectionsArr.filter(
                          (i: any) => i.result === 'passed' || i.passed_inspection
                        ).length
                      }{' '}
                      Passed
                    </span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[#111111]">
                        <tr className="text-[10px] text-white/40 border-b border-white/[0.04]">
                          <th className="text-left px-2 py-1.5">Date</th>
                          <th className="text-left px-2 py-1.5">Type</th>
                          <th className="text-left px-2 py-1.5">Result</th>
                          <th className="text-left px-2 py-1.5">Inspector</th>
                          <th className="text-left px-2 py-1.5">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {inspectionsArr.slice(0, 50).map((insp: any) => {
                          const result =
                            insp.result ||
                            (insp.passed_inspection
                              ? 'passed'
                              : insp.defects_found > 0
                                ? 'failed'
                                : 'passed');
                          return (
                            <tr key={insp.id} className="hover:bg-white/[0.03]">
                              <td className="px-2 py-1.5 text-white/60">
                                {insp.date || insp.completed_at
                                  ? formatDate(insp.date || insp.completed_at)
                                  : '\u2014'}
                              </td>
                              <td className="px-2 py-1.5">
                                <Badge variant="outline" className="text-[9px]">
                                  {formatEnum(insp.type || 'general')}
                                </Badge>
                              </td>
                              <td className="px-2 py-1.5">
                                <Badge
                                  variant={
                                    result === 'passed'
                                      ? 'success'
                                      : result === 'failed'
                                        ? 'destructive'
                                        : 'warning'
                                  }
                                  className="text-[9px]"
                                >
                                  {formatEnum(result)}
                                </Badge>
                              </td>
                              <td className="px-2 py-1.5 text-white/60">
                                {insp.inspector_name || '\u2014'}
                              </td>
                              <td className="px-2 py-1.5 text-white/50 max-w-[100px] truncate">
                                {insp.notes || '\u2014'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ---- Tab: Fuel ---- */}
            <TabsContent value="fuel" className="p-3 mt-0">
              {fuelLoading ? (
                <TableSkeleton />
              ) : fuelArr.length === 0 ? (
                <EmptyState icon={Fuel} message="No fuel records" />
              ) : (
                <div className="space-y-2">
                  {/* Fuel summary */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-[#111111] rounded-lg p-2 border border-white/[0.04]">
                      <div className="text-[9px] text-white/50 mb-0.5">Total Gal</div>
                      <div className="text-sm font-bold text-white">
                        {formatNumber(
                          fuelArr.reduce(
                            (s: number, f: any) => s + (f.gallons || f.quantity_gallons || 0),
                            0
                          ),
                          1
                        )}
                      </div>
                    </div>
                    <div className="bg-[#111111] rounded-lg p-2 border border-white/[0.04]">
                      <div className="text-[9px] text-white/50 mb-0.5">Total Cost</div>
                      <div className="text-sm font-bold text-white">
                        {formatCurrency(
                          fuelArr.reduce(
                            (s: number, f: any) => s + (f.cost || f.total_cost || 0),
                            0
                          )
                        )}
                      </div>
                    </div>
                    <div className="bg-[#111111] rounded-lg p-2 border border-white/[0.04]">
                      <div className="text-[9px] text-white/50 mb-0.5">Avg $/Gal</div>
                      <div className="text-sm font-bold text-white">
                        {(() => {
                          const totalGal = fuelArr.reduce(
                            (s: number, f: any) => s + (f.gallons || f.quantity_gallons || 0),
                            0
                          );
                          const totalCost = fuelArr.reduce(
                            (s: number, f: any) => s + (f.cost || f.total_cost || 0),
                            0
                          );
                          return totalGal > 0 ? `$${(totalCost / totalGal).toFixed(2)}` : '\u2014';
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Fuel table */}
                  <div className="bg-[#111111] rounded-lg border border-white/[0.04] overflow-hidden">
                    <div className="max-h-[350px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-[#111111]">
                          <tr className="text-[10px] text-white/40 border-b border-white/[0.04]">
                            <th className="text-left px-2 py-1.5">Date</th>
                            <th className="text-right px-2 py-1.5">Gal</th>
                            <th className="text-right px-2 py-1.5">Cost</th>
                            <th className="text-left px-2 py-1.5">Location</th>
                            <th className="text-right px-2 py-1.5">Odo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {fuelArr.slice(0, 50).map((f: any) => (
                            <tr key={f.id} className="hover:bg-white/[0.03]">
                              <td className="px-2 py-1.5 text-white/60">
                                {f.date || f.transaction_date
                                  ? formatDate(f.date || f.transaction_date)
                                  : '\u2014'}
                              </td>
                              <td className="px-2 py-1.5 text-right text-white/70">
                                {formatNumber(f.gallons || f.quantity_gallons || 0, 1)}
                              </td>
                              <td className="px-2 py-1.5 text-right text-white/70">
                                {formatCurrency(f.cost || f.total_cost || 0)}
                              </td>
                              <td className="px-2 py-1.5 text-white/50 max-w-[80px] truncate">
                                {f.location || f.location_name || '\u2014'}
                              </td>
                              <td className="px-2 py-1.5 text-right text-white/50">
                                {f.odometer ? formatNumber(f.odometer) : '\u2014'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ---- Tab: Incidents ---- */}
            <TabsContent value="incidents" className="p-3 mt-0">
              {incidentsLoading ? (
                <TableSkeleton />
              ) : incidentsArr.length === 0 ? (
                <EmptyState icon={AlertTriangle} message="No incidents reported" />
              ) : (
                <div className="space-y-2">
                  <div className="text-[10px] text-white/50">
                    {incidentsArr.length} incidents &bull; Cost:{' '}
                    {formatCurrency(
                      incidentsArr.reduce(
                        (s: number, i: any) => s + (i.cost || i.estimated_cost || 0),
                        0
                      )
                    )}
                  </div>
                  <div className="bg-[#111111] rounded-lg border border-white/[0.04] overflow-hidden">
                    <div className="max-h-[400px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-[#111111]">
                          <tr className="text-[10px] text-white/40 border-b border-white/[0.04]">
                            <th className="text-left px-2 py-1.5">Date</th>
                            <th className="text-left px-2 py-1.5">Type</th>
                            <th className="text-left px-2 py-1.5">Severity</th>
                            <th className="text-left px-2 py-1.5">Desc</th>
                            <th className="text-right px-2 py-1.5">Cost</th>
                            <th className="text-right px-2 py-1.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {incidentsArr.slice(0, 50).map((inc: any) => (
                            <tr key={inc.id} className="hover:bg-white/[0.03]">
                              <td className="px-2 py-1.5 text-white/60">
                                {inc.date || inc.incident_date
                                  ? formatDate(inc.date || inc.incident_date)
                                  : '\u2014'}
                              </td>
                              <td className="px-2 py-1.5">
                                <Badge variant="outline" className="text-[9px]">
                                  {formatEnum(inc.type || 'other')}
                                </Badge>
                              </td>
                              <td className="px-2 py-1.5">
                                <Badge
                                  variant={severityBadgeVariant(inc.severity || '')}
                                  className="text-[9px]"
                                >
                                  {formatEnum(inc.severity || 'unknown')}
                                </Badge>
                              </td>
                              <td className="px-2 py-1.5 text-white/50 max-w-[80px] truncate">
                                {inc.description || '\u2014'}
                              </td>
                              <td className="px-2 py-1.5 text-right text-white/70">
                                {inc.cost || inc.estimated_cost
                                  ? formatCurrency(inc.cost || inc.estimated_cost)
                                  : '\u2014'}
                              </td>
                              <td className="px-2 py-1.5 text-right">
                                <Badge
                                  variant={statusBadgeVariant(inc.status || '')}
                                  className="text-[9px]"
                                >
                                  {formatEnum(inc.status || 'unknown')}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ---- Tab: Tires ---- */}
            <TabsContent value="tires" className="p-3 mt-0">
              {tiresLoading ? (
                <TableSkeleton rows={4} />
              ) : (() => {
                const tiresArr = Array.isArray(tires) ? tires : [];
                return tiresArr.length === 0 ? (
                  <EmptyState icon={CircleDot} message="No tire records" />
                ) : (
                  <div className="space-y-3">
                    {/* Tire position diagram */}
                    <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04]">
                      <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-2">
                        Tire Positions
                      </h4>
                      <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                        {['FL', 'FR', 'RL', 'RR'].map((pos) => {
                          const tire = tiresArr.find(
                            (t: any) =>
                              (t.mounted_position || '').toUpperCase() === pos ||
                              (t.position || '').toUpperCase() === pos
                          );
                          return (
                            <div
                              key={pos}
                              className={cn(
                                'rounded-lg p-2.5 border',
                                tire
                                  ? 'bg-white/[0.03] border-white/[0.04]'
                                  : 'bg-white/[0.01] border-white/[0.04] border-dashed'
                              )}
                            >
                              <div className="text-[10px] font-bold text-white/60 mb-0.5">
                                {pos}
                              </div>
                              {tire ? (
                                <div className="text-[10px] space-y-0.5">
                                  <div className="text-white/80">
                                    {tire.manufacturer} {tire.model}
                                  </div>
                                  <div className="text-white/50">
                                    Tread: {tire.tread_depth_32nds || '\u2014'}/32&quot;
                                  </div>
                                  <div className="text-white/50 capitalize">
                                    {tire.condition || '\u2014'}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[10px] text-white/30">Empty</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Full tire list */}
                    <div className="bg-[#111111] rounded-lg border border-white/[0.04] overflow-hidden">
                      <div className="max-h-[200px] overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-[#111111]">
                            <tr className="text-[10px] text-white/40 border-b border-white/[0.04]">
                              <th className="text-left px-2 py-1.5">Pos</th>
                              <th className="text-left px-2 py-1.5">Tire</th>
                              <th className="text-left px-2 py-1.5">Size</th>
                              <th className="text-right px-2 py-1.5">Tread</th>
                              <th className="text-left px-2 py-1.5">Cond</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {tiresArr.map((t: any) => (
                              <tr key={t.id} className="hover:bg-white/[0.03]">
                                <td className="px-2 py-1.5 text-white/70 font-mono">
                                  {t.mounted_position || t.position || '\u2014'}
                                </td>
                                <td className="px-2 py-1.5 text-white/70">
                                  {t.manufacturer} {t.model}
                                </td>
                                <td className="px-2 py-1.5 text-white/50">{t.size || '\u2014'}</td>
                                <td className="px-2 py-1.5 text-right text-white/70">
                                  {t.tread_depth_32nds || '\u2014'}
                                </td>
                                <td className="px-2 py-1.5 capitalize text-white/60">
                                  {t.condition || '\u2014'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            {/* ---- Tab: Costs ---- */}
            <TabsContent value="costs" className="p-3 mt-0">
              {costsLoading ? (
                <TableSkeleton rows={3} />
              ) : (() => {
                const costsArr = Array.isArray(costs) ? costs : [];
                const totalCost = costsArr.reduce(
                  (s: number, c: any) => s + (c.amount || c.cost || 0),
                  0
                );
                const maintCost = maintArr.reduce(
                  (s: number, m: any) => s + (m.cost || 0),
                  0
                );
                const fuelCost = fuelArr.reduce(
                  (s: number, f: any) => s + (f.cost || f.total_cost || 0),
                  0
                );
                const incidentCost = incidentsArr.reduce(
                  (s: number, i: any) => s + (i.cost || i.estimated_cost || 0),
                  0
                );
                return (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="bg-[#111111] rounded-lg p-2 border border-white/[0.04]">
                        <div className="text-[9px] text-white/50 mb-0.5">Total Costs</div>
                        <div className="text-sm font-bold text-white">
                          {formatCurrency(totalCost || maintCost + fuelCost + incidentCost)}
                        </div>
                      </div>
                      <div className="bg-[#111111] rounded-lg p-2 border border-white/[0.04]">
                        <div className="text-[9px] text-white/50 mb-0.5">Maintenance</div>
                        <div className="text-sm font-bold text-white">
                          {formatCurrency(maintCost)}
                        </div>
                      </div>
                      <div className="bg-[#111111] rounded-lg p-2 border border-white/[0.04]">
                        <div className="text-[9px] text-white/50 mb-0.5">Fuel</div>
                        <div className="text-sm font-bold text-white">
                          {formatCurrency(fuelCost)}
                        </div>
                      </div>
                      <div className="bg-[#111111] rounded-lg p-2 border border-white/[0.04]">
                        <div className="text-[9px] text-white/50 mb-0.5">Incidents</div>
                        <div className="text-sm font-bold text-white">
                          {formatCurrency(incidentCost)}
                        </div>
                      </div>
                    </div>

                    {costsArr.length > 0 ? (
                      <div className="bg-[#111111] rounded-lg border border-white/[0.04] overflow-hidden">
                        <div className="max-h-[300px] overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-[#111111]">
                              <tr className="text-[10px] text-white/40 border-b border-white/[0.04]">
                                <th className="text-left px-2 py-1.5">Date</th>
                                <th className="text-left px-2 py-1.5">Category</th>
                                <th className="text-left px-2 py-1.5">Desc</th>
                                <th className="text-right px-2 py-1.5">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                              {costsArr.slice(0, 50).map((c: any) => (
                                <tr key={c.id} className="hover:bg-white/[0.03]">
                                  <td className="px-2 py-1.5 text-white/60">
                                    {c.date || c.created_at
                                      ? formatDate(c.date || c.created_at)
                                      : '\u2014'}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Badge variant="outline" className="text-[9px]">
                                      {formatEnum(c.category || c.cost_type || 'general')}
                                    </Badge>
                                  </td>
                                  <td className="px-2 py-1.5 text-white/50 max-w-[100px] truncate">
                                    {c.description || c.notes || '\u2014'}
                                  </td>
                                  <td className="px-2 py-1.5 text-right text-white/70">
                                    {formatCurrency(c.amount || c.cost || 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04] text-center text-[10px] text-white/40">
                        Cost breakdown from maintenance ({formatCurrency(maintCost)}) and fuel (
                        {formatCurrency(fuelCost)}) records
                      </div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>

            {/* ---- Tab: Compliance ---- */}
            <TabsContent value="compliance" className="p-3 mt-0">
              {insuranceLoading ? (
                <TableSkeleton rows={2} />
              ) : (() => {
                const insuranceArr = Array.isArray(insurance) ? insurance : [];
                return (
                  <div className="space-y-3">
                    {/* Insurance */}
                    <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04]">
                      <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Insurance
                      </h4>
                      {insuranceArr.length > 0 ? (
                        <div className="space-y-2">
                          {insuranceArr.map((ins: any) => (
                            <div
                              key={ins.id}
                              className="flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="text-white/80">
                                  {ins.carrier || ins.provider || 'Policy'} {'\u2014'}{' '}
                                  {ins.policy_number || '\u2014'}
                                </div>
                                <div className="text-[10px] text-white/50">
                                  {ins.policy_type ? formatEnum(ins.policy_type) : 'General'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[9px] text-white/50">Expires</div>
                                <div className="text-[10px] text-white/70">
                                  {ins.expiration_date || ins.end_date
                                    ? formatDate(ins.expiration_date || ins.end_date)
                                    : '\u2014'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-white/40">No insurance records</p>
                      )}
                    </div>

                    {/* Registration */}
                    <div className="bg-[#111111] rounded-lg p-3 border border-white/[0.04]">
                      <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Registration
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-white/50">License Plate</span>
                          <span className="text-white/80">
                            {vehicleDetail?.license_plate ||
                              selectedVehicle.license_plate ||
                              '\u2014'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">VIN</span>
                          <span className="text-white/80 font-mono text-[10px]">
                            {vehicleDetail?.vin || selectedVehicle.vin || '\u2014'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Registration Exp.</span>
                          <span className="text-white/80">
                            {vehicleDetail?.registration_expiry
                              ? formatDate(vehicleDetail.registration_expiry)
                              : '\u2014'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Last Inspection</span>
                          <span className="text-white/80">
                            {inspectionsArr.length > 0
                              ? formatDate(
                                  inspectionsArr[0]?.date || inspectionsArr[0]?.completed_at
                                )
                              : '\u2014'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            {/* ---- Tab: History ---- */}
            <TabsContent value="history" className="p-3 mt-0">
              <div className="space-y-3">
                {/* History Summary */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-[#111111] rounded-lg p-2 border border-white/[0.04]">
                    <div className="text-[9px] text-white/50 mb-0.5">Services</div>
                    <div className="text-sm font-bold text-white">{maintArr.length}</div>
                  </div>
                  <div className="bg-[#111111] rounded-lg p-2 border border-white/[0.04]">
                    <div className="text-[9px] text-white/50 mb-0.5">Incidents</div>
                    <div className="text-sm font-bold text-white">{incidentsArr.length}</div>
                  </div>
                  <div className="bg-[#111111] rounded-lg p-2 border border-white/[0.04]">
                    <div className="text-[9px] text-white/50 mb-0.5">Inspections</div>
                    <div className="text-sm font-bold text-white">{inspectionsArr.length}</div>
                  </div>
                </div>

                {/* Chronological history log */}
                {timelineEvents.length === 0 ? (
                  <EmptyState icon={History} message="No history records" />
                ) : (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">
                      Vehicle History ({timelineEvents.length} events)
                    </div>
                    <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
                      {timelineEvents.map((event) => (
                        <div
                          key={event.id}
                          className="bg-[#111111] rounded-lg p-2.5 border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                'w-2 h-2 rounded-full shrink-0 mt-1',
                                event.type === 'maintenance' ? 'bg-emerald-400' :
                                event.type === 'damage' ? 'bg-rose-400' :
                                event.type === 'inspection' ? 'bg-amber-400' :
                                'bg-white/40'
                              )} />
                              <div>
                                <div className="text-xs text-white/80 font-medium">{event.title}</div>
                                {event.description && (
                                  <div className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{event.description}</div>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[10px] text-white/50">{formatDate(event.date)}</div>
                              {event.cost != null && event.cost > 0 && (
                                <div className="text-[10px] text-emerald-400 font-medium">{formatCurrency(event.cost)}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                              variant={
                                event.type === 'maintenance' ? 'success' :
                                event.type === 'damage' ? 'destructive' :
                                event.type === 'inspection' ? 'warning' :
                                'outline'
                              }
                              className="text-[8px]"
                            >
                              {event.type}
                            </Badge>
                            {event.status && (
                              <Badge variant={statusBadgeVariant(event.status)} className="text-[8px]">
                                {formatEnum(event.status)}
                              </Badge>
                            )}
                            {event.severity && (
                              <Badge variant={severityBadgeVariant(event.severity)} className="text-[8px]">
                                {formatEnum(event.severity)}
                              </Badge>
                            )}
                            {event.mileage && (
                              <span className="text-[9px] text-white/30">{formatNumber(event.mileage)} mi</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ========================================== */}
      {/* Layer 5b: Reference Photo Card                */}
      {/* ========================================== */}
      {showReferenceCard && selectedVehicle && (
        <ReferencePhotoCard
          make={selectedVehicle.make}
          model={selectedVehicle.model}
          year={selectedVehicle.year}
          isExactMatch={isModelExact}
          matchedModelName={matchedModelName}
          paintId={vehicleColor ? hexToPaintId(vehicleColor) : undefined}
          onApplyAsWrap={!isModelExact ? () => {
            const pid = vehicleColor ? hexToPaintId(vehicleColor) : undefined;
            const wrapUrl = buildImaginUrl(selectedVehicle.make, selectedVehicle.model, selectedVehicle.year, '02', 1200, pid);
            setWrapTextureUrl(wrapUrl);
            setAutoWrapApplied(true);
          } : undefined}
          onGenerateModel={!isModelExact ? () => setShowAIGenerationPanel(true) : undefined}
          onDismiss={() => setShowReferenceCard(false)}
          hasActiveWrap={!!wrapTextureUrl}
          autoWrapApplied={autoWrapApplied}
        />
      )}

      {/* ========================================== */}
      {/* Layer 5c: Comparison Split View (F2)         */}
      {/* ========================================== */}
      {isComparisonMode && selectedVehicle && (
        <ComparisonSplitView
          referenceImageUrl={buildImaginUrl(
            selectedVehicle.make,
            selectedVehicle.model,
            selectedVehicle.year,
            // Map current camera preset to IMAGIN angle
            currentCamera === 'front' ? '09' :
            currentCamera === 'rear' ? '13' :
            currentCamera === 'left' || currentCamera === 'right' ? '02' :
            currentCamera === 'topDown' ? '29' :
            '01',
            1200,
            vehicleColor ? hexToPaintId(vehicleColor) : undefined
          )}
          onClose={() => setIsComparisonMode(false)}
        />
      )}

      {/* ========================================== */}
      {/* Layer 5d: AI Model Generation Panel (F3)     */}
      {/* ========================================== */}
      {showAIGenerationPanel && selectedVehicle && (
        <AIModelGenerationPanel
          vehicleId={selectedVehicle.id}
          vehicleName={formatVehicleName(selectedVehicle)}
          referenceImageUrl={buildImaginUrl(
            selectedVehicle.make,
            selectedVehicle.model,
            selectedVehicle.year,
            '01',
            800,
            vehicleColor ? hexToPaintId(vehicleColor) : undefined
          )}
          onClose={() => setShowAIGenerationPanel(false)}
          onModelGenerated={(newModelUrl) => {
            setModelUrl(newModelUrl);
            setIsModelExact(true);
            setMatchedModelName(null);
            setShowAIGenerationPanel(false);
            // Clear auto-wrap since we now have an "exact" model
            if (autoWrapApplied) {
              setWrapTextureUrl(null);
              setAutoWrapApplied(false);
            }
            toast.success('AI-generated 3D model applied');
          }}
        />
      )}

      {/* ========================================== */}
      {/* Layer 5e: Fleet Gallery Grid (F4)            */}
      {/* ========================================== */}
      {showGallery && (
        <FleetGalleryGrid
          vehicles={showroomVehicles.map((v) => ({
            id: v.id,
            make: v.make,
            model: v.model,
            year: v.year,
            vehicleType: v.vehicleType,
            status: v.status,
          }))}
          onSelectVehicle={(id) => {
            handleVehicleSelect(id);
            setShowGallery(false);
          }}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* ========================================== */}
      {/* Layer 5f: Vehicle Scanner                     */}
      {/* ========================================== */}
      {showScanUpload && (
        <VehicleScanUpload
          vehicleId={selectedVehicle?.id}
          make={selectedVehicle?.make}
          model={selectedVehicle?.model}
          year={selectedVehicle?.year}
          onClose={() => setShowScanUpload(false)}
          onViewDamageIn3D={(points) => {
            setScanDamagePoints(points);
            setShowScanUpload(false);
            if (!isDamageMode) setIsDamageMode(true);
          }}
        />
      )}

      {/* ========================================== */}
      {/* Layer 6: Timeline drawer                     */}
      {/* ========================================== */}
      <TimelineDrawer
        events={timelineEvents}
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
      />

      {/* ========================================== */}
      {/* Layer 7: Photo upload modal                  */}
      {/* ========================================== */}
      {isPhotoModalOpen && (
        <PhotoUploadModal
          onClose={() => setIsPhotoModalOpen(false)}
          onUpload={handlePhotoUpload}
          onApplyWrap={(url) => { setWrapTextureUrl(url); setAutoWrapApplied(false); }}
          onClearWrap={() => { setWrapTextureUrl(null); setAutoWrapApplied(false); }}
          photos={vehiclePhotos}
          hasActiveWrap={!!wrapTextureUrl}
        />
      )}
    </div>
  );
}
