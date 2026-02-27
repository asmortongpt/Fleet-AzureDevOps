import { AlertCircle, CheckCircle, DollarSign, MapPin, Camera } from 'lucide-react';
import { useState } from 'react';

import { formatCurrency } from '@/utils/format-helpers';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

interface DamageAnalysisResultsProps {
  analysis: {
    vehicleDetected: boolean;
    vehicleInfo: {
      make: string | null;
      model: string | null;
      year: number | null;
      color: string;
    };
    cameraAngle: string;
    damages: Array<{
      type: string;
      severity: 'minor' | 'moderate' | 'severe' | 'critical';
      part: string;
      description: string;
      estimatedSize: string;
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      confidence: number;
    }>;
    overallAssessment: string;
    lidarEnhancement?: {
      depth3DModel: string;
      accurateDimensions: Array<{
        damageId: string;
        actualWidth: number;
        actualHeight: number;
        actualDepth: number;
        surfaceArea: number;
      }>;
      confidenceBoost: number;
    };
    depthEnhancement?: {
      depthAnalyzedDamages: Array<{
        damageId: string;
        depthMeasurement: number;
        depthConfidence: number;
      }>;
    };
    videoEnhancement?: {
      multiAngleAnalysis: {
        anglesCaptured: number;
        consistentDamagesAcrossAngles: string[];
        additionalDamagesFound: any[];
      };
    };
  };
  costEstimate: {
    totalEstimate: number;
    currency: string;
    breakdown: Array<{
      damageType: string;
      partName: string;
      severity: string;
      laborCost: number;
      partsCost: number;
      estimatedHours: number;
    }>;
    urgency: 'immediate' | 'high' | 'medium' | 'low';
  };
  onConfirmDamages: (damages: any[]) => void;
  onMap3D?: () => void;
}

const severityColors = {
  minor: 'bg-green-100 text-green-800 border-green-300',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  severe: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300'
};

const urgencyColors = {
  immediate: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

export function DamageAnalysisResults({
  analysis,
  costEstimate,
  onConfirmDamages,
  onMap3D
}: DamageAnalysisResultsProps) {
  const [selectedDamages, setSelectedDamages] = useState<number[]>(
    analysis.damages.map((_, i) => i)
  );

  if (!analysis.vehicleDetected) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No vehicle detected in the provided images. Please ensure the photos clearly show the vehicle.
        </AlertDescription>
      </Alert>
    );
  }

  const toggleDamageSelection = (index: number) => {
    setSelectedDamages((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleConfirm = () => {
    const confirmed = analysis.damages.filter((_, i) => selectedDamages.includes(i));
    onConfirmDamages(confirmed);
  };

  const selectedCost = costEstimate.breakdown
    .filter((_, i) => selectedDamages.includes(i))
    .reduce((sum, item) => sum + item.laborCost + item.partsCost, 0);

  return (
    <div className="space-y-2">
      {/* Vehicle Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vehicle Identified</span>
            <Badge variant="outline" className="text-xs">
              {analysis.cameraAngle.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <p className="text-[var(--text-tertiary)]">Make</p>
              <p className="font-medium">{analysis.vehicleInfo.make || '—'}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Model</p>
              <p className="font-medium">{analysis.vehicleInfo.model || '—'}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Year</p>
              <p className="font-medium">{analysis.vehicleInfo.year || '—'}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Color</p>
              <p className="font-medium">{analysis.vehicleInfo.color}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhancement Badges */}
      {(analysis.lidarEnhancement || analysis.depthEnhancement || analysis.videoEnhancement) && (
        <div className="flex flex-wrap gap-2">
          {analysis.lidarEnhancement && (
            <Badge variant="secondary" className="text-amber-700 bg-amber-100">
              <MapPin className="mr-1 h-3 w-3" />
              LiDAR Enhanced (+{analysis.lidarEnhancement.confidenceBoost}% confidence)
            </Badge>
          )}
          {analysis.depthEnhancement && (
            <Badge variant="secondary" className="text-emerald-700 bg-emerald-500/10">
              <Camera className="mr-1 h-3 w-3" />
              Depth Data Included
            </Badge>
          )}
          {analysis.videoEnhancement && (
            <Badge variant="secondary" className="text-green-700 bg-green-100">
              <CheckCircle className="mr-1 h-3 w-3" />
              {analysis.videoEnhancement.multiAngleAnalysis.anglesCaptured} Angles Analyzed
            </Badge>
          )}
        </div>
      )}

      {/* Overall Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--text-tertiary)]">{analysis.overallAssessment}</p>
        </CardContent>
      </Card>

      {/* Cost Estimate Summary */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Estimated Repair Cost
            </span>
            <div className="flex items-center gap-2">
              <Badge className={urgencyColors[costEstimate.urgency]}>
                {costEstimate.urgency.toUpperCase()}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            {selectedDamages.length} of {analysis.damages.length} damage{analysis.damages.length > 1 ? 's' : ''} selected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-base font-bold text-[var(--text-primary)]">
            {formatCurrency(selectedCost)}
          </div>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Total: {formatCurrency(costEstimate.totalEstimate)}
          </p>
        </CardContent>
      </Card>

      {/* Damage List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Detected Damage ({analysis.damages.length})</h3>
          <div className="text-sm text-[var(--text-primary)]">
            Click to select/deselect damage items
          </div>
        </div>

        {analysis.damages.map((damage, index) => {
          const isSelected = selectedDamages.includes(index);
          const costBreakdown = costEstimate.breakdown[index];
          const lidarDimensions = analysis.lidarEnhancement?.accurateDimensions.find(
            (d) => d.damageId === `${damage.type}-${damage.part}`
          );
          const depthData = analysis.depthEnhancement?.depthAnalyzedDamages.find(
            (d) => d.damageId === `${damage.type}-${damage.part}`
          );

          return (
            <Card
              key={`${damage.type}-${damage.part}`}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'border-2 border-emerald-500'
                  : 'border-[var(--border-default)] opacity-60 hover:opacity-100'
              }`}
              onClick={() => toggleDamageSelection(index)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDamageSelection(index)}
                        className="h-4 w-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="capitalize">{damage.type.replace(/_/g, ' ')}</span>
                      <span className="text-[var(--text-tertiary)]">•</span>
                      <span className="capitalize">{damage.part.replace(/_/g, ' ')}</span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Confidence: {(damage.confidence * 100).toFixed(0)}%
                    </CardDescription>
                  </div>
                  <Badge className={severityColors[damage.severity]}>
                    {damage.severity.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Description */}
                <div>
                  <p className="text-sm text-[var(--text-tertiary)]">{damage.description}</p>
                </div>

                {/* Measurements */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-[var(--text-tertiary)]">Estimated Size</p>
                    <p className="font-medium">{damage.estimatedSize}</p>
                  </div>

                  {lidarDimensions && (
                    <>
                      <div>
                        <p className="text-[var(--text-tertiary)]">Actual Width</p>
                        <p className="font-medium">{(lidarDimensions.actualWidth * 100).toFixed(1)} cm</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-tertiary)]">Actual Depth</p>
                        <p className="font-medium">{(lidarDimensions.actualDepth * 100).toFixed(1)} cm</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-tertiary)]">Surface Area</p>
                        <p className="font-medium">{(lidarDimensions.surfaceArea * 10000).toFixed(0)} cm²</p>
                      </div>
                    </>
                  )}

                  {depthData && !lidarDimensions && (
                    <div>
                      <p className="text-[var(--text-tertiary)]">Depth Measurement</p>
                      <p className="font-medium">{(depthData.depthMeasurement ?? 0).toFixed(1)} mm</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Cost Breakdown */}
                {costBreakdown && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-[var(--text-tertiary)]">Labor</p>
                      <p className="font-medium">
                        ${(costBreakdown.laborCost ?? 0).toFixed(2)}
                        <span className="text-xs text-[var(--text-tertiary)] ml-1">
                          ({costBreakdown.estimatedHours}h)
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-tertiary)]">Parts</p>
                      <p className="font-medium">${(costBreakdown.partsCost ?? 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-tertiary)]">Total</p>
                      <p className="font-bold text-emerald-800">
                        ${(costBreakdown.laborCost + costBreakdown.partsCost).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 sticky bottom-4 bg-white p-2 rounded-lg border">
        {onMap3D && (
          <Button variant="outline" onClick={onMap3D} className="flex-1">
            <MapPin className="mr-2 h-4 w-4" />
            Map to 3D Model
          </Button>
        )}
        <Button
          variant="default"
          onClick={handleConfirm}
          className="flex-1"
          disabled={selectedDamages.length === 0}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Confirm & Save ({selectedDamages.length} Selected)
        </Button>
      </div>
    </div>
  );
}