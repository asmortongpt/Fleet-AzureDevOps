declare module 'react-leaflet' {
  import * as L from 'leaflet';
  import { ComponentType, ReactNode } from 'react';

  export interface MapContainerProps {
    center: L.LatLngExpression;
    zoom: number;
    style?: React.CSSProperties;
    className?: string;
    children?: ReactNode;
    scrollWheelZoom?: boolean;
    doubleClickZoom?: boolean;
    dragging?: boolean;
    zoomControl?: boolean;
    attributionControl?: boolean;
    maxZoom?: number;
    minZoom?: number;
    maxBounds?: L.LatLngBoundsExpression;
    bounds?: L.LatLngBoundsExpression;
    boundsOptions?: L.FitBoundsOptions;
    whenCreated?: (map: L.Map) => void;
    whenReady?: () => void;
    id?: string;
    placeholder?: ReactNode;
    preferCanvas?: boolean;
    touchZoom?: boolean;
    boxZoom?: boolean;
    keyboard?: boolean;
    tap?: boolean;
    tapTolerance?: number;
    worldCopyJump?: boolean;
  }

  export interface TileLayerProps {
    url: string;
    attribution?: string;
    opacity?: number;
    zIndex?: number;
    minZoom?: number;
    maxZoom?: number;
    subdomains?: string | string[];
    errorTileUrl?: string;
    tileSize?: number | L.Point;
    tms?: boolean;
    crossOrigin?: boolean | string;
    referrerPolicy?: boolean | string;
    detectRetina?: boolean;
    className?: string;
    id?: string;
    accessToken?: string;
    eventHandlers?: L.LeafletEventHandlerFnMap;
  }

  export interface MarkerProps {
    position: L.LatLngExpression;
    icon?: L.Icon | L.DivIcon;
    draggable?: boolean;
    opacity?: number;
    zIndexOffset?: number;
    children?: ReactNode;
    eventHandlers?: L.LeafletEventHandlerFnMap;
    title?: string;
    alt?: string;
    interactive?: boolean;
    keyboard?: boolean;
    riseOnHover?: boolean;
    riseOffset?: number;
    pane?: string;
    shadowPane?: string;
    bubblingMouseEvents?: boolean;
    autoPan?: boolean;
    autoPanPadding?: L.PointExpression;
    autoPanSpeed?: number;
  }

  export interface PopupProps {
    position?: L.LatLngExpression;
    children?: ReactNode;
    maxWidth?: number;
    minWidth?: number;
    maxHeight?: number;
    autoPan?: boolean;
    autoPanPaddingTopLeft?: L.PointExpression;
    autoPanPaddingBottomRight?: L.PointExpression;
    autoPanPadding?: L.PointExpression;
    keepInView?: boolean;
    closeButton?: boolean;
    autoClose?: boolean;
    closeOnEscapeKey?: boolean;
    closeOnClick?: boolean;
    className?: string;
    pane?: string;
    offset?: L.PointExpression;
    eventHandlers?: L.LeafletEventHandlerFnMap;
  }

  export const MapContainer: ComponentType<MapContainerProps>;
  export const TileLayer: ComponentType<TileLayerProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Popup: ComponentType<PopupProps>;
  export const Polygon: any;
  export const Circle: any;

  export function useMap(): L.Map;
  export function useMapEvents(handlers: L.LeafletEventHandlerFnMap): L.Map;
  export function useMapEvent<T extends keyof L.LeafletEventHandlerFnMap>(
    type: T,
    handler: L.LeafletEventHandlerFnMap[T]
  ): L.Map;
}