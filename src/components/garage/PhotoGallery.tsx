import React from 'react';

export interface PhotoGalleryProps {
    photos: any[];
    onDeletePhoto?: (photoId: string | number) => void;
    groupByZone?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.length === 0 ? (
                <div className="col-span-full text-center p-8 bg-slate-900 rounded-lg text-slate-400">
                    No photos available. (Placeholder Gallery)
                </div>
            ) : (
                photos.map((photo, i) => (
                    <div key={i} className="bg-slate-800 p-2 rounded">
                        <img src={photo.url || 'https://placehold.co/600x400'} alt="Captured" className="w-full h-48 object-cover rounded" />
                    </div>
                ))
            )}
        </div>
    );
};
