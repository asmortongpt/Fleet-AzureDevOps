/**
 * VehicleScanUpload — Upload vehicle photos/videos for AI-powered
 * damage detection, showroom-quality processing, and change tracking.
 *
 * Communicates with the Python FastAPI scanner service via
 * /api/vehicle-scanner/* proxy.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
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
  ArrowLeftRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleScanUploadProps {
  vehicleId?: string;
  make?: string;
  model?: string;
  year?: number;
  onClose: () => void;
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
}

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

export function VehicleScanUpload({
  vehicleId,
  make,
  model,
  year,
  onClose,
}: VehicleScanUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [scanId, setScanId] = useState<string | null>(null);
  const [stage, setStage] = useState<ScanStage>('idle');
  const [progress, setProgress] = useState(0);
  const [stageDescription, setStageDescription] = useState('');
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<ScanResults | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
  }, []);

  const severityColor = (s: string) => {
    switch (s) {
      case 'severe': return 'text-rose-400 bg-rose-500/20';
      case 'moderate': return 'text-amber-400 bg-amber-500/20';
      default: return 'text-emerald-400 bg-emerald-500/20';
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
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

              {/* Damage items list */}
              {results.damage_report && results.damage_report.items.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide">
                    Damage Details
                  </p>
                  {results.damage_report.items.map((item) => (
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
                    </div>
                  ))}
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
