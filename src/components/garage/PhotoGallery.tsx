import React from 'react';

export interface PhotoGalleryProps {
    photos: any[];
    onDeletePhoto?: (photoId: string | number) => void;
    groupByZone?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {photos.length === 0 ? (
                <div className="col-span-full text-center p-3 bg-slate-900 rounded-lg text-slate-700">
                    No photos available.
                </div>
            ) : (
                photos.map((photo, i) => (
                    <div key={i} className="bg-slate-800 p-2 rounded">
                        {photo.url ? (
                            <img src={photo.url} alt="Captured" className="w-full h-48 object-cover rounded" />
                        ) : (
                            <div className="w-full h-48 rounded bg-slate-900 flex items-center justify-center text-slate-700 text-sm">
                                No image available
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};
