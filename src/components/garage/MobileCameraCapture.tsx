import React from 'react';

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
    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
            <div className="bg-slate-900 p-3 rounded-lg max-w-sm w-full">
                <h2 className="text-base font-bold mb-2">Camera Capture</h2>
                <p className="mb-3 text-slate-300">
                    Camera component was missing from the import. This is a placeholder.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => onPhotosCapture([{
                            id: Date.now(),
                            url: 'https://placehold.co/600x400',
                            dataUrl: 'data:image/jpeg;base64,...',
                            blob: new Blob([''], { type: 'image/jpeg' }),
                            timestamp: new Date()
                        }])}
                        className="flex-1 py-2 bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Simulate Capture
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
