declare module 'react-leaflet-cluster' {
  import { MarkerClusterGroupOptions } from 'leaflet';
  import { ReactElement, ComponentType } from 'react';
  import { PathProps } from 'react-leaflet';

  export interface MarkerClusterGroupProps extends MarkerClusterGroupOptions, PathProps {
    children?: ReactElement | ReactElement[];
    chunkedLoading?: boolean;
    chunkDelay?: number;
    chunkInterval?: number;
    chunkProgress?: (processed: number, total: number, elapsed: number) => void;
    unspiderfyOnZoom?: boolean;
    spiderfyOnEveryZoom?: boolean;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    spiderfyDistanceMultiplier?: number;
    maxClusterRadius?: number | ((zoom: number) => number);
    polygonOptions?: Record<string, any>;
    singleMarkerMode?: boolean;
    disableClusteringAtZoom?: number;
    removeOutsideVisibleBounds?: boolean;
    animate?: boolean;
    animateAddingMarkers?: boolean;
    spiderLegPolylineOptions?: Record<string, any>;
    iconCreateFunction?: (cluster: any) => L.Icon | L.DivIcon;
  }

  const MarkerClusterGroup: ComponentType<MarkerClusterGroupProps>;
  
  export default MarkerClusterGroup;
}