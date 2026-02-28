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
                <div className="col-span-full text-center p-3 bg-[var(--surface-2)] rounded-lg text-[var(--text-primary)]">
                    No photos available. (Placeholder Gallery)
                </div>
            ) : (
                photos.map((photo) => (
                    <div key={photo.url || photo.id} className="bg-[var(--surface-3)] p-2 rounded">
                        <img src={photo.url || 'https://placehold.co/600x400'} alt="Captured" className="w-full h-48 object-cover rounded" />
                    </div>
                ))
            )}
        </div>
    );
};
