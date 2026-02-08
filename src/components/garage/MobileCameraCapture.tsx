import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface CapturedPhoto {
    id: string | number;
    url: string;
    dataUrl: string;
    blob: Blob;
    timestamp: Date;
    vehicleZone?: string;
    location?: {
        latitude: number;
        longitude: number;
        accuracy: number;
    };
}

export interface MobileCameraCaptureProps {
    assetId: string;
    onPhotosCapture: (photos: CapturedPhoto[]) => void;
    onClose: () => void;
    guidedMode?: boolean;
    maxPhotos?: number;
    compressionQuality?: number;
    maxDimension?: number;
}

export const MobileCameraCapture: React.FC<MobileCameraCaptureProps> = ({
    onPhotosCapture,
    onClose
}) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (!isMounted) return;
                streamRef.current = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                setError('Camera access denied or unavailable.');
            }
        };
        init();

        return () => {
            isMounted = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, []);

    const handleCapture = useCallback(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

        const blob: Blob = await new Promise((resolve) => {
            canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.9);
        });

        const photo: CapturedPhoto = {
            id: Date.now(),
            url: URL.createObjectURL(blob),
            dataUrl,
            blob,
            timestamp: new Date()
        };

        onPhotosCapture([photo]);
    }, [onPhotosCapture]);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
            <div className="bg-slate-900 p-3 rounded-lg max-w-sm w-full">
                <h2 className="text-base font-bold mb-2">Camera Capture</h2>
                {error ? (
                    <p className="mb-3 text-red-400">{error}</p>
                ) : (
                    <div className="mb-3">
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded" />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}
                <div className="flex gap-3">
                    <button
                        onClick={handleCapture}
                        className="flex-1 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                        disabled={!!error}
                    >
                        Capture
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-slate-700 rounded hover:bg-slate-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
