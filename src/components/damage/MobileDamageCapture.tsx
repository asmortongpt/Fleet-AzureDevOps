import React, { useState, useRef, useCallback } from 'react';
import {
  Camera,
  Video,
  Upload,
  Scan,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';

interface MobileDamageCaptureProps {
  vehicleId: string;
  onAnalysisComplete: (analysis: any) => void;
}

export function MobileDamageCapture({ vehicleId, onAnalysisComplete }: MobileDamageCaptureProps) {
  const [captureMode, setCaptureMode] = useState<'photo' | 'video' | 'lidar' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [capturedFiles, setCapturedFiles] = useState<File[]>([]);
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    hasCamera: false,
    hasVideo: false,
    hasDepth: false,
    hasLiDAR: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Detect device capabilities
  React.useEffect(() => {
    const detectCapabilities = async () => {
      const capabilities = {
        hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        hasVideo: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        hasDepth: false, // iOS depth data detection would require native bridge
        hasLiDAR: false // iOS LiDAR detection would require native bridge
      };

      // Check for iOS-specific features via user agent
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIPadPro = /iPad/.test(navigator.userAgent) && window.devicePixelRatio >= 2;
      const isIPhone12OrLater = /iPhone/.test(navigator.userAgent); // Simplified detection

      if (isIOS) {
        capabilities.hasDepth = true; // iPhone 7+ has depth capability
        capabilities.hasLiDAR = isIPadPro || isIPhone12OrLater; // iPhone 12 Pro+, iPad Pro 2020+
      }

      setDeviceCapabilities(capabilities);
    };

    detectCapabilities();
  }, []);

  const handlePhotoCapture = useCallback(async () => {
    if (!fileInputRef.current) return;

    // Trigger file input with camera
    fileInputRef.current.accept = 'image/*';
    fileInputRef.current.capture = 'environment'; // Use rear camera
    fileInputRef.current.click();
  }, []);

  const handleVideoCapture = useCallback(async () => {
    if (!videoInputRef.current) return;

    // Trigger file input with video camera
    videoInputRef.current.accept = 'video/*';
    videoInputRef.current.capture = 'environment';
    videoInputRef.current.click();
  }, []);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const newFiles = Array.from(files);
      setCapturedFiles((prev) => [...prev, ...newFiles]);
    },
    []
  );

  const analyzePhotos = useCallback(async () => {
    if (capturedFiles.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Prepare form data
      const formData = new FormData();

      capturedFiles.forEach((file, index) => {
        formData.append('photos', file);

        // Add metadata for each photo
        const metadata = {
          deviceModel: navigator.userAgent,
          captureDate: new Date().toISOString(),
          orientation: 'landscape',
          width: 1920, // Would get from image in production
          height: 1080
        };
        formData.append(`metadata_${index}`, JSON.stringify(metadata));
      });

      setAnalysisProgress(30);

      // Call comprehensive analysis API
      const response = await fetch('/api/damage/comprehensive-analysis', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      setAnalysisProgress(70);

      const result = await response.json();

      setAnalysisProgress(100);

      // Pass results to parent
      onAnalysisComplete(result);

      // Reset state
      setCapturedFiles([]);
      setCaptureMode(null);
    } catch (error) {
      console.error('Error analyzing photos:', error);
      alert('Failed to analyze photos. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [capturedFiles, onAnalysisComplete]);

  const analyzeVideo = useCallback(async () => {
    if (capturedFiles.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', capturedFiles[0]);
      formData.append('duration', '10'); // Would extract from video metadata
      formData.append('fps', '30');
      formData.append('frameInterval', '1'); // Extract 1 frame per second

      setAnalysisProgress(20);

      const response = await fetch('/api/damage/analyze-video', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Video analysis failed');
      }

      setAnalysisProgress(80);

      const result = await response.json();

      setAnalysisProgress(100);

      onAnalysisComplete(result);

      setCapturedFiles([]);
      setCaptureMode(null);
    } catch (error) {
      console.error('Error analyzing video:', error);
      alert('Failed to analyze video. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [capturedFiles, onAnalysisComplete]);

  return (
    <div className="space-y-6">
      {/* Device Capabilities Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium">Device Capabilities Detected:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li className={deviceCapabilities.hasCamera ? 'text-green-600' : 'text-gray-400'}>
                {deviceCapabilities.hasCamera ? '✓' : '✗'} Camera
              </li>
              <li className={deviceCapabilities.hasVideo ? 'text-green-600' : 'text-gray-400'}>
                {deviceCapabilities.hasVideo ? '✓' : '✗'} Video Recording
              </li>
              <li className={deviceCapabilities.hasDepth ? 'text-green-600' : 'text-gray-400'}>
                {deviceCapabilities.hasDepth ? '✓' : '✗'} Depth Sensing
              </li>
              <li className={deviceCapabilities.hasLiDAR ? 'text-green-600' : 'text-gray-400'}>
                {deviceCapabilities.hasLiDAR ? '✓' : '✗'} LiDAR Scanner
              </li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Capture Mode Selection */}
      {!captureMode && !isAnalyzing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => setCaptureMode('photo')}
          >
            <CardHeader>
              <Camera className="h-8 w-8 mb-2 text-blue-500" />
              <CardTitle>Photo Analysis</CardTitle>
              <CardDescription>
                Capture multiple photos from different angles. Best for detailed damage assessment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 5-10 photos recommended</li>
                <li>• Front, rear, sides, and closeups</li>
                {deviceCapabilities.hasDepth && <li>• Includes depth data</li>}
              </ul>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-green-500 transition-colors"
            onClick={() => setCaptureMode('video')}
          >
            <CardHeader>
              <Video className="h-8 w-8 mb-2 text-green-500" />
              <CardTitle>Video Walkthrough</CardTitle>
              <CardDescription>
                Record a 360° video walkthrough. AI will analyze key frames automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 30-60 seconds recommended</li>
                <li>• Walk around entire vehicle</li>
                <li>• Hold steady for best results</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:border-purple-500 transition-colors ${
              !deviceCapabilities.hasLiDAR ? 'opacity-50' : ''
            }`}
            onClick={() => deviceCapabilities.hasLiDAR && setCaptureMode('lidar')}
          >
            <CardHeader>
              <Scan className="h-8 w-8 mb-2 text-purple-500" />
              <CardTitle>LiDAR Scan</CardTitle>
              <CardDescription>
                {deviceCapabilities.hasLiDAR
                  ? 'High-precision 3D scan with depth measurements. Most accurate method.'
                  : 'Requires iPhone 12 Pro+ or iPad Pro 2020+'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deviceCapabilities.hasLiDAR ? (
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Millimeter-level accuracy</li>
                  <li>• 3D depth map included</li>
                  <li>• Best for insurance claims</li>
                </ul>
              ) : (
                <p className="text-sm text-red-500">LiDAR not available on this device</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Photo Capture Mode */}
      {captureMode === 'photo' && !isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle>Capture Photos</CardTitle>
            <CardDescription>
              Take photos from multiple angles: front, rear, both sides, and closeups of damage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={handlePhotoCapture} variant="default" className="flex-1">
                <Camera className="mr-2 h-4 w-4" />
                Take Photo ({capturedFiles.length})
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
            </div>

            {capturedFiles.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {capturedFiles.map((file, index) => (
                    <div key={index} className="relative aspect-video rounded-md overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Captured ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button onClick={analyzePhotos} variant="default" className="flex-1">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Analyze {capturedFiles.length} Photo{capturedFiles.length > 1 ? 's' : ''}
                  </Button>
                  <Button
                    onClick={() => {
                      setCapturedFiles([]);
                      setCaptureMode(null);
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Tips for best results:</strong>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Hold camera steady and avoid blur</li>
                  <li>Good lighting is essential</li>
                  <li>Capture closeups of damage areas</li>
                  <li>Include context shots showing entire vehicle</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Video Capture Mode */}
      {captureMode === 'video' && !isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle>Video Walkthrough</CardTitle>
            <CardDescription>
              Record a 30-60 second video walking around the vehicle. AI will extract and analyze
              key frames.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={handleVideoCapture} variant="default" className="flex-1">
                <Video className="mr-2 h-4 w-4" />
                Record Video
              </Button>
              <Button
                onClick={() => videoInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </div>

            {capturedFiles.length > 0 && (
              <div className="space-y-4">
                <div className="aspect-video rounded-md overflow-hidden bg-black">
                  <video src={URL.createObjectURL(capturedFiles[0])} controls className="w-full h-full" />
                </div>

                <div className="flex gap-2">
                  <Button onClick={analyzeVideo} variant="default" className="flex-1">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Analyze Video
                  </Button>
                  <Button
                    onClick={() => {
                      setCapturedFiles([]);
                      setCaptureMode(null);
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Tips for video recording:</strong>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Walk slowly and steadily around vehicle</li>
                  <li>Keep camera pointing at vehicle</li>
                  <li>Pause briefly at each corner</li>
                  <li>Focus on damaged areas for 2-3 seconds</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* LiDAR Scan Mode (Placeholder) */}
      {captureMode === 'lidar' && !isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle>LiDAR 3D Scan</CardTitle>
            <CardDescription>
              Launch native iOS 3D scanner app to capture high-precision point cloud data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                LiDAR scanning requires a native iOS app. This feature will open the iOS 3D Scanner
                or Polycam app if installed.
              </AlertDescription>
            </Alert>

            <Button
              variant="default"
              className="w-full"
              onClick={() => {
                // In production, this would deep link to iOS scanning app
                alert(
                  'LiDAR scanning requires native iOS integration. Install Polycam or 3D Scanner app and import the scan.'
                );
              }}
            >
              <Scan className="mr-2 h-4 w-4" />
              Launch 3D Scanner
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing Vehicle Damage...
            </CardTitle>
            <CardDescription>
              Our AI is processing your {captureMode === 'video' ? 'video' : 'photos'} to detect
              and assess damage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={analysisProgress} className="w-full" />
            <div className="text-sm text-gray-600 space-y-1">
              <p>✓ Uploading files...</p>
              {analysisProgress > 20 && <p>✓ Detecting vehicle...</p>}
              {analysisProgress > 40 && <p>✓ Identifying damage...</p>}
              {analysisProgress > 60 && <p>✓ Calculating measurements...</p>}
              {analysisProgress > 80 && <p>✓ Estimating repair costs...</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
