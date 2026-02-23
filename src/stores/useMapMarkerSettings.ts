import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MarkerStyle = 'pin' | 'circle' | 'badge';
export type MarkerSize = 'small' | 'medium' | 'large';

interface MapMarkerSettingsState {
  markerStyle: MarkerStyle;
  markerSize: MarkerSize;
  showLabels: boolean;
  setMarkerStyle: (style: MarkerStyle) => void;
  setMarkerSize: (size: MarkerSize) => void;
  setShowLabels: (show: boolean) => void;
}

export const useMapMarkerSettings = create<MapMarkerSettingsState>()(
  persist(
    (set) => ({
      markerStyle: 'pin',
      markerSize: 'medium',
      showLabels: false,
      setMarkerStyle: (markerStyle) => set({ markerStyle }),
      setMarkerSize: (markerSize) => set({ markerSize }),
      setShowLabels: (showLabels) => set({ showLabels }),
    }),
    { name: 'fleet-map-marker-settings' },
  ),
);
