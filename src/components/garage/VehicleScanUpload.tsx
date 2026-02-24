/**
 * VehicleScanUpload — Upload vehicle photos/videos for AI-powered
 * damage detection, showroom-quality processing, and change tracking.
 *
 * Communicates with the Python FastAPI scanner service via
 * /api/vehicle-scanner/* proxy.
 *
 * Features:
 * - Quick upload & guided 8-angle scan modes
 * - Auto work order creation from damage items
 * - View damage in 3D (scan-to-3d mapper)
 * - AI assessment integration
 */

import {
  Upload,
  Camera,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  Video,
  FileWarning,
  RefreshCw,
  Wrench,
  Box,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import { GuidedScanFlow } from './GuidedScanFlow';
import { mapScanDamageTo3D } from './scan-to-3d-mapper';

import type { DamagePoint } from '@/components/garage/DamageOverlay';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format-helpers';

// ============================================================================
// Types
// ============================================================================

interface VehicleScanUploadProps {
  vehicleId?: string;
  make?: string;
  model?: string;
  year?: number;
  onClose: () => void;
  onViewDamageIn3D?: (damagePoints: DamagePoint[]) => void;
}

type ScanStage =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'preprocessing'
  | 'detecting'
  | 'segmenting'
  | 'comparing'
  | 'reporting'
  | 'complete'
  | 'error';

interface DamageItem {
  id: string;
  damage_type: string;
  severity: 'minor' | 'moderate' | 'severe';
  confidence: number;
  description: string;
  area_percent?: number;
  bbox?: number[];
  frame_index?: number;
  zone?: string;
}

interface DamageReport {
  scan_id: string;
  overall_score: number;
  items: DamageItem[];
  total_damage_area_percent: number;
  annotated_image_url?: string;
  frame_count: number;
}

interface ScanResults {
  scan_id: string;
  status: string;
  damage_report?: DamageReport;
  showroom_images: string[];
  frames_analyzed?: number;
  damage_items?: DamageItem[];
}

// Feature 2: Work Order types
interface WorkOrderPayload {
  vehicle_id: string;
  type: 'corrective';
  priority: 'high' | 'medium' | 'low';
  description: string;
  title: string;
  notes: string;
}

// Feature 6: AI Assessment types
interface AIAssessment {
  summary: string;
  recommendations: string[];
  costEstimate: { min: number; max: number; currency: string };
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  detailedFindings: string;
}

// ============================================================================
// Constants
// ============================================================================

const STAGE_LABELS: Record<ScanStage, string> = {
  idle: 'Ready to scan',
  uploading: 'Uploading files...',
  extracting: 'Extracting keyframes...',
  preprocessing: 'Removing backgrounds & enhancing...',
  detecting: 'Analyzing for damage...',
  segmenting: 'Segmenting damage regions...',
  comparing: 'Comparing with previous scan...',
  reporting: 'Generating damage report...',
  complete: 'Scan complete',
  error: 'Scan failed',
};

const STAGE_ORDER: ScanStage[] = [
  'uploading',
  'extracting',
  'preprocessing',
  'detecting',
  'segmenting',
  'comparing',
  'reporting',
  'complete',
];

const ACCEPTED_TYPES = '.mp4,.mov,.avi,.webm,.jpg,.jpeg,.png,.heic,.heif';

// ============================================================================
// Helpers
// ============================================================================

function mapSeverityToPriority(severity: string): 'high' | 'medium' | 'low' {
  switch (severity) {
    case 'severe':
      return 'high';
    case 'moderate':
      return 'medium';
    default:
      return 'low';
  }
}

function damageToWorkOrder(
  item: DamageItem,
  vehicleId: string,
  vehicleName: string
): WorkOrderPayload {
  return {
    vehicle_id: vehicleId,
    type: 'corrective',
    priority: mapSeverityToPriority(item.severity),
    title: `Repair: ${item.damage_type.replace(/_/g, ' ')} (${item.severity})`,
    description: `Damage detected by vehicle scanner on ${vehicleName}. Type: ${item.damage_type.replace(/_/g, ' ')}. Severity: ${item.severity}. Confidence: ${Math.round(item.confidence * 100)}%.`,
    notes: item.description || `Auto-generated from scan damage detection. ${item.area_percent ? `Affected area: ${item.area_percent.toFixed(1)}%` : ''}`,
  };
}

// ============================================================================
// Component
// ============================================================================

export function VehicleScanUpload({
  vehicleId,
  make,
  model,
  year,
  onClose,
  onViewDamageIn3D,
}: VehicleScanUploadProps) {
  // Core state
  const [files, setFiles] = useState<File[]>([]);
  const [scanId, setScanId] = useState<string | null>(null);
  const [stage, setStage] = useState<ScanStage>('idle');
  const [progress, setProgress] = useState(0);
  const [stageDescription, setStageDescription] = useState('');
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<ScanResults | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Feature 4: Scan mode
  const [scanMode, setScanMode] = useState<'quick' | 'guided'>('quick');

  // Feature 2: Work Order creation
  const [creatingWO, setCreatingWO] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
  const [creatingAllWO, setCreatingAllWO] = useState(false);

  // Feature 6: AI Assessment
  const [aiAssessment, setAiAssessment] = useState<AIAssessment | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDetailsExpanded, setAiDetailsExpanded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    setFiles((prev) => [...prev, ...arr]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  // Start the scan pipeline
  const startScan = useCallback(async () => {
    if (files.length === 0) return;

    setStage('uploading');
    setProgress(0);
    setErrorMessage(null);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (vehicleId) formData.append('vehicle_id', vehicleId);
    if (make) formData.append('make', make);
    if (model) formData.append('model', model);
    if (year) formData.append('year', String(year));

    try {
      const res = await fetch('/api/vehicle-scanner/scan', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      setScanId(data.scan_id);

      // Start polling for status
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/vehicle-scanner/scan/${data.scan_id}/status`);
          if (!statusRes.ok) return;

          const status = await statusRes.json();
          setStage(status.status as ScanStage);
          setProgress(status.progress || 0);
          setStageDescription(status.stage_description || '');
          setEtaSeconds(status.eta_seconds || null);

          if (status.status === 'complete') {
            if (pollRef.current) clearInterval(pollRef.current);
            // Fetch full results
            const resultsRes = await fetch(`/api/vehicle-scanner/scan/${data.scan_id}/results`);
            if (resultsRes.ok) {
              const scanResults = await resultsRes.json();
              setResults(scanResults);
            }
          } else if (status.status === 'error') {
            if (pollRef.current) clearInterval(pollRef.current);
            setErrorMessage(status.error_message || 'Pipeline failed');
          }
        } catch {
          // Polling error — keep trying
        }
      }, 2000);
    } catch (err: any) {
      setStage('error');
      setErrorMessage(err.message || 'Failed to start scan');
    }
  }, [files, vehicleId, make, model, year]);

  // Feature 4: Handle guided scan completion
  const handleGuidedComplete = useCallback(
    (guidedFiles: File[]) => {
      setFiles(guidedFiles);
      setScanMode('quick'); // Switch back to quick mode for progress display
      // Create FormData and start scan immediately
      const formData = new FormData();
      guidedFiles.forEach((f) => formData.append('files', f));
      if (vehicleId) formData.append('vehicle_id', vehicleId);
      if (make) formData.append('make', make);
      if (model) formData.append('model', model);
      if (year) formData.append('year', String(year));

      setStage('uploading');
      setProgress(0);
      setErrorMessage(null);

      fetch('/api/vehicle-scanner/scan', {
        method: 'POST',
        body: formData,
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(err.detail || `Upload failed (${res.status})`);
          }
          return res.json();
        })
        .then((data) => {
          setScanId(data.scan_id);
          pollRef.current = setInterval(async () => {
            try {
              const statusRes = await fetch(`/api/vehicle-scanner/scan/${data.scan_id}/status`);
              if (!statusRes.ok) return;
              const status = await statusRes.json();
              setStage(status.status as ScanStage);
              setProgress(status.progress || 0);
              setStageDescription(status.stage_description || '');
              setEtaSeconds(status.eta_seconds || null);
              if (status.status === 'complete') {
                if (pollRef.current) clearInterval(pollRef.current);
                const resultsRes = await fetch(`/api/vehicle-scanner/scan/${data.scan_id}/results`);
                if (resultsRes.ok) setResults(await resultsRes.json());
              } else if (status.status === 'error') {
                if (pollRef.current) clearInterval(pollRef.current);
                setErrorMessage(status.error_message || 'Pipeline failed');
              }
            } catch {
              /* keep trying */
            }
          }, 2000);
        })
        .catch((err: any) => {
          setStage('error');
          setErrorMessage(err.message || 'Failed to start scan');
        });
    },
    [vehicleId, make, model, year]
  );

  const resetScan = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setFiles([]);
    setScanId(null);
    setStage('idle');
    setProgress(0);
    setStageDescription('');
    setEtaSeconds(null);
    setErrorMessage(null);
    setResults(null);
    setCreatingWO({});
    setCreatingAllWO(false);
    setAiAssessment(null);
    setAiLoading(false);
    setAiError(null);
  }, []);

  // Feature 2: Create work order for a single damage item
  const createWorkOrder = useCallback(
    async (item: DamageItem, index: number) => {
      if (!vehicleId) {
        toast.error('No vehicle ID available');
        return;
      }

      const key = String(index);
      setCreatingWO((prev) => ({ ...prev, [key]: 'loading' }));

      const vehicleName = [year, make, model].filter(Boolean).join(' ');
      const payload = damageToWorkOrder(item, vehicleId, vehicleName);

      try {
        const res = await fetch('/api/work-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Failed to create work order (${res.status})`);
        }

        setCreatingWO((prev) => ({ ...prev, [key]: 'success' }));
        toast.success(`Work order created for ${item.damage_type.replace(/_/g, ' ')}`);
      } catch (err: any) {
        setCreatingWO((prev) => ({ ...prev, [key]: 'error' }));
        toast.error(err.message || 'Failed to create work order');
      }
    },
    [vehicleId, year, make, model]
  );

  // Feature 2: Create work orders for all damage items
  const createAllWorkOrders = useCallback(async () => {
    if (!results?.damage_report?.items.length || !vehicleId) return;

    setCreatingAllWO(true);
    const items = results.damage_report.items;

    for (let i = 0; i < items.length; i++) {
      const key = String(i);
      if (creatingWO[key] === 'success') continue; // Skip already created
      await createWorkOrder(items[i], i);
      // Small delay between requests
      if (i < items.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    setCreatingAllWO(false);
    toast.success('All work orders created');
  }, [results, vehicleId, creatingWO, createWorkOrder]);

  // Feature 3: View damage in 3D
  const handleViewIn3D = useCallback(() => {
    if (!results?.damage_report?.items) return;

    const damageItems = results.damage_report.items;
    const frameCount = results.damage_report.frame_count || results.frames_analyzed || 8;
    const points = mapScanDamageTo3D(damageItems, frameCount);

    if (onViewDamageIn3D) {
      onViewDamageIn3D(points);
      toast.success(`${points.length} damage points mapped to 3D view`);
    }
  }, [results, onViewDamageIn3D]);

  // Feature 6: Request AI Assessment
  const requestAIAssessment = useCallback(async () => {
    if (!scanId) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch(`/api/vehicle-scanner-ai/ai-assessment/${scanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          vehicleInfo: {
            make: make || undefined,
            model: model || undefined,
            year: year || undefined,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`AI assessment failed (${res.status})`);
      }

      const data = await res.json();
      setAiAssessment(data);
    } catch (err: any) {
      setAiError(err.message || 'Failed to get AI assessment');
      toast.error('AI assessment unavailable');
    } finally {
      setAiLoading(false);
    }
  }, [scanId, make, model, year]);

  // ============================================================================
  // Render helpers
  // ============================================================================

  const severityColor = (s: string) => {
    switch (s) {
      case 'severe':
        return 'text-rose-400 bg-rose-500/20';
      case 'moderate':
        return 'text-amber-400 bg-amber-500/20';
      default:
        return 'text-emerald-400 bg-emerald-500/20';
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const urgencyColors: Record<string, string> = {
    critical: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    high: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    medium: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    low: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  };

  const isProcessing = stage !== 'idle' && stage !== 'complete' && stage !== 'error';

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[#111]/95 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Vehicle Scanner</h2>
            {make && model && (
              <span className="text-xs text-white/40">
                {year} {make} {model}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/[0.08] text-white/40 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* === IDLE: File Upload Area === */}
          {stage === 'idle' && (
            <>
              {/* Feature 4: Scan mode toggle */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <button
                  onClick={() => setScanMode('quick')}
                  className={cn(
                    'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                    scanMode === 'quick'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-white/50 hover:text-white/70'
                  )}
                >
                  Quick Upload
                </button>
                <button
                  onClick={() => setScanMode('guided')}
                  className={cn(
                    'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                    scanMode === 'guided'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-white/50 hover:text-white/70'
                  )}
                >
                  Guided Scan
                </button>
              </div>

              {/* Feature 4: Guided scan flow */}
              {scanMode === 'guided' ? (
                <GuidedScanFlow
                  onComplete={handleGuidedComplete}
                  onCancel={() => setScanMode('quick')}
                />
              ) : (
                <>
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                      isDragging
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-white/[0.12] hover:border-white/[0.20] bg-white/[0.02]'
                    )}
                  >
                    <Upload className="w-8 h-8 text-white/30 mx-auto mb-3" />
                    <p className="text-sm text-white/60 mb-1">
                      Drop photos or videos here
                    </p>
                    <p className="text-[10px] text-white/30">
                      Supports MP4, MOV, JPG, PNG, HEIC (max 500MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={ACCEPTED_TYPES}
                      className="hidden"
                      onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    />
                  </div>

                  {/* Camera capture button */}
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo with Camera
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    />
                  </button>

                  {/* Selected files */}
                  {files.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide">
                        {files.length} file{files.length !== 1 ? 's' : ''} selected
                      </p>
                      {files.map((f, i) => (
                        <div
                          key={`${f.name}-${i}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                        >
                          {f.type.startsWith('video') ? (
                            <Video className="w-3.5 h-3.5 text-white/30" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-white/30" />
                          )}
                          <span className="text-xs text-white/60 flex-1 truncate">{f.name}</span>
                          <span className="text-[10px] text-white/30">
                            {(f.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(i);
                            }}
                            className="p-0.5 rounded hover:bg-white/[0.08] text-white/30 hover:text-white/50"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* Start scan button */}
                      <button
                        onClick={startScan}
                        className="w-full mt-3 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                      >
                        Start Vehicle Scan
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* === PROCESSING: Pipeline Progress === */}
          {isProcessing && (
            <div className="space-y-4">
              {/* Overall progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/60">{STAGE_LABELS[stage]}</span>
                  <span className="text-xs text-white/40">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {stageDescription && (
                  <p className="text-[10px] text-white/30 mt-1">{stageDescription}</p>
                )}
                {etaSeconds != null && etaSeconds > 0 && (
                  <p className="text-[10px] text-white/30">
                    ~{Math.ceil(etaSeconds)}s remaining
                  </p>
                )}
              </div>

              {/* Stage pipeline visualization */}
              <div className="space-y-1">
                {STAGE_ORDER.map((s) => {
                  const stageIdx = STAGE_ORDER.indexOf(s);
                  const currentIdx = STAGE_ORDER.indexOf(stage);
                  const isDone = stageIdx < currentIdx;
                  const isCurrent = s === stage;

                  return (
                    <div
                      key={s}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors',
                        isCurrent && 'bg-emerald-500/10 text-emerald-400',
                        isDone && 'text-white/30',
                        !isCurrent && !isDone && 'text-white/15'
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/50" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-current opacity-30" />
                      )}
                      <span>{STAGE_LABELS[s]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === ERROR === */}
          {stage === 'error' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <FileWarning className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-rose-400">Scan Failed</p>
                  <p className="text-xs text-white/40 mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={resetScan}
                className="w-full py-2 rounded-lg bg-white/[0.06] text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.10] transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </button>
            </div>
          )}

          {/* === COMPLETE: Results === */}
          {stage === 'complete' && results && (
            <div className="space-y-4">
              {/* Score card */}
              {results.damage_report && (
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-white/40 uppercase tracking-wide">
                      Vehicle Condition
                    </span>
                    <span className="text-xs text-white/30">
                      {results.damage_report.frame_count} frames analyzed
                    </span>
                  </div>

                  {/* Score gauge */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={cn(
                        'text-4xl font-bold tabular-nums',
                        scoreColor(results.damage_report.overall_score)
                      )}
                    >
                      {Math.round(results.damage_report.overall_score)}
                    </div>
                    <div>
                      <p className="text-sm text-white/60">
                        {results.damage_report.overall_score >= 80
                          ? 'Good Condition'
                          : results.damage_report.overall_score >= 60
                          ? 'Fair Condition'
                          : 'Needs Attention'}
                      </p>
                      <p className="text-[10px] text-white/30">
                        {results.damage_report.items.length} damage item
                        {results.damage_report.items.length !== 1 ? 's' : ''} detected
                      </p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        results.damage_report.overall_score >= 80
                          ? 'bg-emerald-500'
                          : results.damage_report.overall_score >= 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      )}
                      style={{ width: `${results.damage_report.overall_score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Annotated image */}
              {results.damage_report?.annotated_image_url && (
                <div className="rounded-xl overflow-hidden border border-white/[0.08]">
                  <img
                    src={`/api/vehicle-scanner${results.damage_report.annotated_image_url}`}
                    alt="Annotated damage view"
                    className="w-full h-auto"
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {/* Feature 3: View in 3D + Feature 2: Create All WOs */}
              {results.damage_report && results.damage_report.items.length > 0 && (
                <div className="flex gap-2">
                  {onViewDamageIn3D && (
                    <button
                      onClick={handleViewIn3D}
                      className="flex-1 py-2 rounded-lg bg-white/[0.06] text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.10] transition-colors flex items-center justify-center gap-2"
                    >
                      <Box className="w-3.5 h-3.5" />
                      View in 3D
                    </button>
                  )}
                  {vehicleId && (
                    <button
                      onClick={createAllWorkOrders}
                      disabled={creatingAllWO}
                      className="flex-1 py-2 rounded-lg bg-white/[0.06] text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.10] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {creatingAllWO ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wrench className="w-3.5 h-3.5" />
                      )}
                      Create All Work Orders
                    </button>
                  )}
                </div>
              )}

              {/* Damage items list */}
              {results.damage_report && results.damage_report.items.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide">
                    Damage Details
                  </p>
                  {results.damage_report.items.map((item, index) => {
                    const woStatus = creatingWO[String(index)] || 'idle';
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                      >
                        <AlertTriangle
                          className={cn(
                            'w-3.5 h-3.5 shrink-0',
                            item.severity === 'severe'
                              ? 'text-rose-400'
                              : item.severity === 'moderate'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white/70 capitalize">
                              {item.damage_type.replace(/_/g, ' ')}
                            </span>
                            <span
                              className={cn(
                                'text-[9px] px-1.5 py-0.5 rounded-full font-medium',
                                severityColor(item.severity)
                              )}
                            >
                              {item.severity}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[10px] text-white/30 truncate">{item.description}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-white/30 tabular-nums">
                          {Math.round(item.confidence * 100)}%
                        </span>
                        {/* Feature 2: Per-item WO button */}
                        {vehicleId && (
                          <button
                            onClick={() => createWorkOrder(item, index)}
                            disabled={woStatus === 'loading' || woStatus === 'success'}
                            className={cn(
                              'shrink-0 px-2 py-0.5 rounded text-[9px] font-medium transition-colors',
                              woStatus === 'success'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : woStatus === 'loading'
                                ? 'text-white/30'
                                : woStatus === 'error'
                                ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                                : 'text-white/50 bg-white/[0.05] hover:bg-white/[0.08]'
                            )}
                          >
                            {woStatus === 'success' ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> WO
                              </span>
                            ) : woStatus === 'loading' ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              '+ WO'
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Feature 6: AI Assessment */}
              {scanId && (
                <div className="space-y-2">
                  {!aiAssessment && !aiLoading && (
                    <button
                      onClick={requestAIAssessment}
                      disabled={aiLoading}
                      className="w-full py-2 rounded-lg bg-white/[0.06] text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.10] transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Get AI Analysis
                    </button>
                  )}

                  {aiLoading && (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span className="text-xs text-white/50">Generating AI assessment...</span>
                    </div>
                  )}

                  {aiError && (
                    <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <p className="text-xs text-rose-400">{aiError}</p>
                      <button
                        onClick={requestAIAssessment}
                        className="text-[10px] text-white/40 hover:text-white/60 mt-1 underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {aiAssessment && (
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-white/80">AI Assessment</span>
                        <span
                          className={cn(
                            'text-[9px] px-2 py-0.5 rounded-full font-medium border',
                            urgencyColors[aiAssessment.urgencyLevel] || urgencyColors.medium
                          )}
                        >
                          {aiAssessment.urgencyLevel}
                        </span>
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-white/60 leading-relaxed">
                        {aiAssessment.summary}
                      </p>

                      {/* Cost estimate */}
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[10px] text-white/40">Estimated Cost:</span>
                        <span className="text-xs font-medium text-white/80">
                          {formatCurrency(aiAssessment.costEstimate.min)} &ndash;{' '}
                          {formatCurrency(aiAssessment.costEstimate.max)}
                        </span>
                      </div>

                      {/* Recommendations */}
                      {aiAssessment.recommendations.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-1">
                            Recommendations
                          </p>
                          <ol className="space-y-1 list-decimal list-inside">
                            {aiAssessment.recommendations.map((rec, i) => (
                              <li key={i} className="text-xs text-white/60">
                                {rec}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Detailed findings (collapsible) */}
                      {aiAssessment.detailedFindings && (
                        <div>
                          <button
                            onClick={() => setAiDetailsExpanded(!aiDetailsExpanded)}
                            className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 transition-colors"
                          >
                            {aiDetailsExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                            Detailed Findings
                          </button>
                          {aiDetailsExpanded && (
                            <p className="text-xs text-white/50 mt-1.5 leading-relaxed whitespace-pre-line">
                              {aiAssessment.detailedFindings}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Showroom images */}
              {results.showroom_images.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide">
                    Showroom Images
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {results.showroom_images.map((url, i) => (
                      <div
                        key={i}
                        className="rounded-lg overflow-hidden border border-white/[0.08] bg-[#0a0a0a]"
                      >
                        <img
                          src={`/api/vehicle-scanner${url}`}
                          alt={`Showroom view ${i + 1}`}
                          className="w-full h-auto"
                          crossOrigin="anonymous"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={resetScan}
                  className="flex-1 py-2 rounded-lg bg-white/[0.06] text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.10] transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  New Scan
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-sm text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
