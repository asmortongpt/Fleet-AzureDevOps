declare namespace L {
  // Core Types
  export type LatLngExpression = LatLng | LatLngLiteral | LatLngTuple;
  export type LatLngTuple = [number, number];
  export type LatLngLiteral = { lat: number; lng: number };
  export type LatLngBoundsExpression = LatLngBounds | LatLngBoundsLiteral | LatLngTuple[];
  export type LatLngBoundsLiteral = LatLngTuple[];
  export type PointExpression = Point | PointTuple;
  export type PointTuple = [number, number];
  export type BoundsExpression = Bounds | BoundsLiteral;
  export type BoundsLiteral = [PointTuple, PointTuple];
  export type LayerOptions = any;
  export type PathOptions = any;
  export type MarkerOptions = any;
  export type PopupOptions = any;
  export type TooltipOptions = any;
  export type IconOptions = any;
  export type DivIconOptions = any;
  export type ControlOptions = any;
  export type ZoomOptions = any;
  export type PanOptions = any;
  export type ZoomPanOptions = any;
  export type FitBoundsOptions = any;
  export type MapOptions = any;
  export type TileLayerOptions = any;
  export type GridLayerOptions = any;
  export type PolylineOptions = any;
  export type PolygonOptions = any;
  export type CircleOptions = any;
  export type CircleMarkerOptions = any;
  export type RectangleOptions = any;
  export type LayerGroupOptions = any;
  export type FeatureGroupOptions = any;
  export type GeoJSONOptions = any;
  export type VideoOverlayOptions = any;
  export type ImageOverlayOptions = any;
  export type SVGOverlayOptions = any;
  export type Coords = { x: number; y: number; z: number };
  export type DoneCallback = (error?: Error, tile?: HTMLElement) => void;

  // Event Types
  export interface LeafletEvent {
    type: string;
    target: any;
    sourceTarget?: any;
    propagatedFrom?: any;
  }

  export interface LeafletMouseEvent extends LeafletEvent {
    latlng: LatLng;
    layerPoint: Point;
    containerPoint: Point;
    originalEvent: MouseEvent;
  }

  export interface LeafletKeyboardEvent extends LeafletEvent {
    originalEvent: KeyboardEvent;
  }

  export interface LocationEvent extends LeafletEvent {
    latlng: LatLng;
    bounds: LatLngBounds;
    accuracy: number;
    altitude: number;
    altitudeAccuracy: number;
    heading: number;
    speed: number;
    timestamp: number;
  }

  export interface ErrorEvent extends LeafletEvent {
    message: string;
    code: number;
  }

  export interface LayerEvent extends LeafletEvent {
    layer: Layer;
  }

  export interface LayersControlEvent extends LayerEvent {
    name: string;
  }

  export interface TileEvent extends LeafletEvent {
    tile: HTMLElement;
    coords: Coords;
  }

  export interface TileErrorEvent extends TileEvent {
    error: Error;
  }

  export interface ResizeEvent extends LeafletEvent {
    oldSize: Point;
    newSize: Point;
  }

  export interface GeoJSONEvent extends LeafletEvent {
    layer: Layer;
    properties: any;
    geometryType: string;
    id?: string | number;
  }

  export interface PopupEvent extends LeafletEvent {
    popup: Popup;
  }

  export interface TooltipEvent extends LeafletEvent {
    tooltip: Tooltip;
  }

  export interface DragEndEvent extends LeafletEvent {
    distance: number;
  }

  export interface ZoomAnimEvent extends LeafletEvent {
    center: LatLng;
    zoom: number;
    noUpdate: boolean;
  }

  // Event Handlers
  export interface LeafletEventHandlerFnMap {
    baselayerchange?: (e: LayersControlEvent) => void;
    overlayadd?: (e: LayersControlEvent) => void;
    overlayremove?: (e: LayersControlEvent) => void;
    layeradd?: (e: LayerEvent) => void;
    layerremove?: (e: LayerEvent) => void;
    zoomlevelschange?: (e: LeafletEvent) => void;
    resize?: (e: ResizeEvent) => void;
    unload?: (e: LeafletEvent) => void;
    viewreset?: (e: LeafletEvent) => void;
    load?: (e: LeafletEvent) => void;
    zoomstart?: (e: LeafletEvent) => void;
    movestart?: (e: LeafletEvent) => void;
    zoom?: (e: LeafletEvent) => void;
    move?: (e: LeafletEvent) => void;
    zoomend?: (e: LeafletEvent) => void;
    moveend?: (e: LeafletEvent) => void;
    popupopen?: (e: PopupEvent) => void;
    popupclose?: (e: PopupEvent) => void;
    autopanstart?: (e: LeafletEvent) => void;
    tooltipopen?: (e: TooltipEvent) => void;
    tooltipclose?: (e: TooltipEvent) => void;
    locationerror?: (e: ErrorEvent) => void;
    locationfound?: (e: LocationEvent) => void;
    click?: (e: LeafletMouseEvent) => void;
    dblclick?: (e: LeafletMouseEvent) => void;
    mousedown?: (e: LeafletMouseEvent) => void;
    mouseup?: (e: LeafletMouseEvent) => void;
    mouseover?: (e: LeafletMouseEvent) => void;
    mouseout?: (e: LeafletMouseEvent) => void;
    mousemove?: (e: LeafletMouseEvent) => void;
    contextmenu?: (e: LeafletMouseEvent) => void;
    keypress?: (e: LeafletKeyboardEvent) => void;
    keydown?: (e: LeafletKeyboardEvent) => void;
    keyup?: (e: LeafletKeyboardEvent) => void;
    preclick?: (e: LeafletMouseEvent) => void;
    zoomanim?: (e: ZoomAnimEvent) => void;
    dragend?: (e: DragEndEvent) => void;
    tileunload?: (e: TileEvent) => void;
    tileloadstart?: (e: TileEvent) => void;
    tileerror?: (e: TileErrorEvent) => void;
    tileload?: (e: TileEvent) => void;
    loading?: (e: LeafletEvent) => void;
    add?: (e: LeafletEvent) => void;
    remove?: (e: LeafletEvent) => void;
    update?: (e: LeafletEvent) => void;
    down?: (e: LeafletEvent) => void;
    predrag?: (e: LeafletEvent) => void;
    dragstart?: (e: LeafletEvent) => void;
    drag?: (e: LeafletEvent) => void;
  }

  // Core Classes
  export class Class {
    static extend(props: any): any;
    static include(props: any): any;
    static mergeOptions(props: any): any;
    static addInitHook(fn: () => void): any;
    static addInitHook(methodName: string, ...args: any[]): any;
    callInitHooks(): void;
  }

  export class Evented extends Class {
    on(type: string, fn: Function, context?: any): this;
    on(eventMap: LeafletEventHandlerFnMap): this;
    off(type?: string, fn?: Function, context?: any): this;
    off(eventMap?: LeafletEventHandlerFnMap): this;
    fire(type: string, data?: any, propagate?: boolean): this;
    listens(type: string): boolean;
    once(type: string, fn: Function, context?: any): this;
    once(eventMap: LeafletEventHandlerFnMap): this;
    addEventParent(obj: Evented): this;
    removeEventParent(obj: Evented): this;
    addEventListener(type: string, fn: Function, context?: any): this;
    addEventListener(eventMap: LeafletEventHandlerFnMap): this;
    removeEventListener(type?: string, fn?: Function, context?: any): this;
    removeEventListener(eventMap?: LeafletEventHandlerFnMap): this;
    clearAllEventListeners(): this;
    addOneTimeEventListener(type: string, fn: Function, context?: any): this;
    addOneTimeEventListener(eventMap: LeafletEventHandlerFnMap): this;
    fireEvent(type: string, data?: any, propagate?: boolean): this;
    hasEventListeners(type: string): boolean;
  }

  export class Layer extends Evented {
    constructor(options?: LayerOptions);
    addTo(map: Map | LayerGroup): this;
    remove(): this;
    removeFrom(map: Map): this;
    getPane(name?: string): HTMLElement | undefined;
    getAttribution(): string | null;
    protected _map: Map;
    onAdd(map: Map): this;
    onRemove(map: Map): this;
    getEvents?(): { [name: string]: Function };
    beforeAdd?(map: Map): this;
    bindPopup(content: ((layer: Layer) => string) | string | HTMLElement | Popup, options?: PopupOptions): this;
    unbindPopup(): this;
    openPopup(latlng?: LatLngExpression): this;
    closePopup(): this;
    togglePopup(): this;
    isPopupOpen(): boolean;
    setPopupContent(content: ((layer: Layer) => string) | string | HTMLElement): this;
    getPopup(): Popup | undefined;
    bindTooltip(content: ((layer: Layer) => string) | string | HTMLElement | Tooltip, options?: TooltipOptions): this;
    unbindTooltip(): this;
    openTooltip(latlng?: LatLngExpression): this;
    closeTooltip(): this;
    toggleTooltip(): this;
    isTooltipOpen(): boolean;
    setTooltipContent(content: ((layer: Layer) => string) | string | HTMLElement): this;
    getTooltip(): Tooltip | undefined;
  }

  export class Handler extends Class {
    constructor(map: Map);
    enable(): this;
    disable(): this;
    enabled(): boolean;
    addHooks?(): void;
    removeHooks?(): void;
  }

  export class LatLng {
    constructor(latitude: number, longitude: number, altitude?: number);
    lat: number;
    lng: number;
    alt?: number;
    equals(otherLatLng: LatLngExpression, maxMargin?: number): boolean;
    toString(): string;
    distanceTo(otherLatLng: LatLngExpression): number;
    wrap(): LatLng;
    toBounds(sizeInMeters: number): LatLngBounds;
    clone(): LatLng;
  }

  export class LatLngBounds {
    constructor(corner1: LatLngExpression, corner2: LatLngExpression);
    constructor(latlngs: LatLngExpression[]);
    extend(latlng: LatLngExpression | LatLngBoundsExpression): this;
    pad(bufferRatio: number): LatLngBounds;
    getCenter(): LatLng;
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
    getNorthWest(): LatLng;
    getSouthEast(): LatLng;
    getWest(): number;
    getSouth(): number;
    getEast(): number;
    getNorth(): number;
    contains(otherBounds: LatLngBoundsExpression | LatLngExpression): boolean;
    intersects(otherBounds: LatLngBoundsExpression): boolean;
    overlaps(otherBounds: LatLngBoundsExpression): boolean;
    toBBoxString(): string;
    equals(otherBounds: LatLngBoundsExpression, maxMargin?: number): boolean;
    isValid(): boolean;
  }

  export class Point {
    constructor(x: number, y: number, round?: boolean);
    x: number;
    y: number;
    clone(): Point;
    add(otherPoint: PointExpression): Point;
    subtract(otherPoint: PointExpression): Point;
    divideBy(num: number): Point;
    multiplyBy(num: number): Point;
    scaleBy(scale: PointExpression): Point;
    unscaleBy(scale: PointExpression): Point;
    round(): Point;
    floor(): Point;
    ceil(): Point;
    trunc(): Point;
    distanceTo(otherPoint: PointExpression): number;
    equals(otherPoint: PointExpression): boolean;
    contains(otherPoint: PointExpression): boolean;
    toString(): string;
  }

  export class Bounds {
    constructor(corner1: PointExpression, corner2: PointExpression);
    constructor(points?: PointExpression[]);
    min: Point;
    max: Point;
    extend(point: PointExpression | BoundsExpression): this;
    getCenter(round?: boolean): Point;
    getBottomLeft(): Point;
    getTopRight(): Point;
    getTopLeft(): Point;
    getBottomRight(): Point;
    getSize(): Point;
    contains(otherBounds: BoundsExpression | PointExpression): boolean;
    intersects(otherBounds: BoundsExpression): boolean;
    overlaps(otherBounds: BoundsExpression): boolean;
    isValid(): boolean;
    pad(bufferRatio: number): Bounds;
    equals(otherBounds: BoundsExpression): boolean;
  }

  export class Icon<T extends IconOptions = IconOptions> extends Class {
    constructor(options: T);
    options: T;
    createIcon(oldIcon?: HTMLElement): HTMLElement;
    createShadow(oldIcon?: HTMLElement): HTMLElement;
  }

  export class DivIcon extends Icon<DivIconOptions> {}

  export class Marker<P = any> extends Layer {
    constructor(latlng: LatLngExpression, options?: MarkerOptions);
    options: MarkerOptions;
    feature?: GeoJSON.Feature<GeoJSON.Point, P>;
    getLatLng(): LatLng;
    setLatLng(latlng: LatLngExpression): this;
    setZIndexOffset(offset: number): this;
    getIcon(): Icon | DivIcon;
    setIcon(icon: Icon | DivIcon): this;
    setOpacity(opacity: number): this;
    getElement(): HTMLElement | undefined;
    toGeoJSON(precision?: number): GeoJSON.Feature<GeoJSON.Point>;
    dragging: Handler;
  }

  export class Path extends Layer {
    options: PathOptions;
    redraw(): this;
    setStyle(style: PathOptions): this;
    bringToFront(): this;
    bringToBack(): this;
    getElement(): Element | undefined;
  }

  export class Polyline<T extends GeoJSON.GeometryObject = GeoJSON.LineString | GeoJSON.MultiLineString, P = any> extends Path {
    constructor(latlngs: LatLngExpression[] | LatLngExpression[][], options?: PolylineOptions);
    options: PolylineOptions;
    feature?: GeoJSON.Feature<T, P>;
    toGeoJSON(precision?: number): GeoJSON.Feature<T>;
    getLatLngs(): LatLng[] | LatLng[][] | LatLng[][][];
    setLatLngs(latlngs: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]): this;
    isEmpty(): boolean;
    closestLayerPoint(p: Point): Point;
    getCenter(): LatLng;
    getBounds(): LatLngBounds;
    addLatLng(latlng: LatLngExpression | LatLngExpression[], latlngs?: LatLng[]): this;
  }

  export class Polygon<P = any> extends Polyline<GeoJSON.Polygon | GeoJSON.MultiPolygon, P> {
    constructor(latlngs: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][], options?: PolygonOptions);
    options: PolygonOptions;
  }

  export class Rectangle<P = any> extends Polygon<P> {
    constructor(latLngBounds: LatLngBoundsExpression, options?: RectangleOptions);
    options: RectangleOptions;
    setBounds(latLngBounds: LatLngBoundsExpression): this;
  }

  export class Circle<P = any> extends CircleMarker<P> {
    constructor(latlng: LatLngExpression, options?: CircleOptions);
    constructor(latlng: LatLngExpression, radius: number, options?: CircleOptions);
    options: CircleOptions;
    setRadius(radius: number): this;
    getRadius(): number;
    getBounds(): LatLngBounds;
  }

  export class CircleMarker<P = any> extends Path {
    constructor(latlng: LatLngExpression, options?: CircleMarkerOptions);
    options: CircleMarkerOptions;
    feature?: GeoJSON.Feature<GeoJSON.Point, P>;
    setLatLng(latLng: LatLngExpression): this;
    getLatLng(): LatLng;
    setRadius(radius: number): this;
    getRadius(): number;
    toGeoJSON(precision?: number): GeoJSON.Feature<GeoJSON.Point>;
  }

  export class LayerGroup<P = any> extends Layer {
    constructor(layers?: Layer[], options?: LayerGroupOptions);
    feature?: GeoJSON.FeatureCollection<GeoJSON.GeometryObject, P>;
    toGeoJSON(precision?: number): GeoJSON.FeatureCollection<GeoJSON.GeometryObject>;
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer | number): this;
    hasLayer(layer: Layer | number): boolean;
    clearLayers(): this;
    invoke(methodName: string, ...args: any[]): this;
    eachLayer(fn: (layer: Layer) => void, context?: any): this;
    getLayer(id: number): Layer | undefined;
    getLayers(): Layer[];
    setZIndex(zIndex: number): this;
    getLayerId(layer: Layer): number;
  }

  export class FeatureGroup<P = any> extends LayerGroup<P> {
    constructor(layers?: Layer[], options?: FeatureGroupOptions);
    setStyle(style: PathOptions): this;
    bringToFront(): this;
    bringToBack(): this;
    getBounds(): LatLngBounds;
  }

  export class GeoJSON<P = any> extends FeatureGroup<P> {
    constructor(geojson?: GeoJSON.GeoJsonObject, options?: GeoJSONOptions);
    options: GeoJSONOptions;
    addData(data: GeoJSON.GeoJsonObject): this;
    resetStyle(layer?: Layer): this;
    setStyle(style: PathOptions | ((feature?: GeoJSON.Feature<GeoJSON.GeometryObject>) => PathOptions)): this;
    static geometryToLayer<P = any>(featureData: GeoJSON.Feature<GeoJSON.GeometryObject, P>, options?: GeoJSONOptions): Layer;
    static coordsToLatLng(coords: [number, number] | [number, number, number]): LatLng;
    static coordsToLatLngs(coords: any[], levelsDeep?: number, coordsToLatLng?: (coords: [number, number] | [number, number, number]) => LatLng): any[];
    static latLngToCoords(latlng: LatLng, precision?: number): [number, number] | [number, number, number];
    static latLngsToCoords(latlngs: any[], levelsDeep?: number, closed?: boolean): any[];
    static asFeature<P = any>(geojson: GeoJSON.Feature<GeoJSON.GeometryObject, P> | GeoJSON.GeometryObject): GeoJSON.Feature<GeoJSON.GeometryObject, P>;
  }

  export class GridLayer extends Layer {
    constructor(options?: GridLayerOptions);
    bringToFront(): this;
    bringToBack(): this;
    getContainer(): HTMLElement | null;
    setOpacity(opacity: number): this;
    setZIndex(zIndex: number): this;
    isLoading(): boolean;
    redraw(): this;
    getTileSize(): Point;
    protected createTile(coords: Coords, done: DoneCallback): HTMLElement;
    protected _tileCoordsToKey(coords: Coords): string;
    protected _keyToTileCoords(key: string): Coords;
    protected _removeTile(key: string): void;
    protected _tiles: { [key: string]: HTMLElement };
    protected _tileZoom?: number;
  }

  export class TileLayer extends GridLayer {
    constructor(urlTemplate: string, options?: TileLayerOptions);
    setUrl(url: string, noRedraw?: boolean): this;
    getTileUrl(coords: Coords): string;
    protected _tileOnLoad(done: DoneCallback, tile: HTMLElement): void;
    protected _tileOnError(done: DoneCallback, tile: HTMLElement, e: Error): void;
    protected _abortLoading(): void;
    protected _getZoomForUrl(): number;
    options: TileLayerOptions;
  }

  export namespace TileLayer {
    export class WMS extends TileLayer {
      constructor(baseUrl: string, options: WMSOptions);
      setParams(params: WMSParams, noRedraw?: boolean): this;
      wmsParams: WMSParams;
      options: WMSOptions;
    }
  }

  export interface WMSOptions extends TileLayerOptions {
    layers?: string;
    styles?: string;
    format?: string;
    transparent?: boolean;
    version?: string;
    crs?: CRS;
    uppercase?: boolean;
  }

  export interface WMSParams {
    format?: string;
    layers: string;
    request?: string;
    service?: string;
    styles?: string;
    version?: string;
    transparent?: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }

  export class ImageOverlay extends Layer {
    constructor(imageUrl: string, bounds: LatLngBoundsExpression, options?: ImageOverlayOptions);
    setOpacity(opacity: number): this;
    bringToFront(): this;
    bringToBack(): this;
    setUrl(url: string): this;
    setBounds(bounds: LatLngBoundsExpression): this;
    setZIndex(value: number): this;
    getBounds(): LatLngBounds;
    getElement(): HTMLImageElement | undefined;
    options: ImageOverlayOptions;
  }

  export class VideoOverlay extends ImageOverlay {
    constructor(video: string | string[] | HTMLVideoElement, bounds: LatLngBoundsExpression, options?: VideoOverlayOptions);
    getElement(): HTMLVideoElement | undefined;
    options: VideoOverlayOptions;
  }

  export class SVGOverlay extends ImageOverlay {
    constructor(svgImage: string | SVGElement, bounds: LatLngBoundsExpression, options?: ImageOverlayOptions);
    getElement(): SVGElement | undefined;
  }

  export class Popup extends Layer {
    constructor(options?: PopupOptions, source?: Layer);
    options: PopupOptions;
    getLatLng(): LatLng | undefined;
    setLatLng(latlng: LatLngExpression): this;
    getContent(): ((source: Layer) => string) | string | HTMLElement | undefined;
    setContent(htmlContent: ((source: Layer) => string) | string | HTMLElement): this;
    getElement(): HTMLElement | undefined;
    update(): void;
    isOpen(): boolean;
    bringToFront(): this;
    bringToBack(): this;
    openOn(map: Map): this;
  }

  export class Tooltip extends Layer {
    constructor(options?: TooltipOptions, source?: Layer);
    options: TooltipOptions;
    setLatLng(latlng: LatLngExpression): this;
    getLatLng(): LatLng | undefined;
    setContent(htmlContent: ((source: Layer) => string) | string | HTMLElement): this;
    getContent(): ((source: Layer) => string) | string | HTMLElement | undefined;
    getElement(): HTMLElement | undefined;
    update(): void;
    isOpen(): boolean;
    bringToFront(): this;
    bringToBack(): this;
    openOn(map: Map): this;
  }

  export class Control extends Class {
    constructor(options?: ControlOptions);
    options: ControlOptions;
    getPosition(): string;
    setPosition(position: string): this;
    getContainer(): HTMLElement | undefined;
    addTo(map: Map): this;
    remove(): this;
    onAdd(map: Map): HTMLElement;
    onRemove(map: Map): void;
  }

  export namespace Control {
    export class Zoom extends Control {
      constructor(options?: ZoomOptions);
      options: ZoomOptions;
    }

    export class Attribution extends Control {
      constructor(options?: AttributionOptions);
      options: AttributionOptions;
      setPrefix(prefix: string | false): this;
      addAttribution(text: string): this;
      removeAttribution(text: string): this;
    }

    export class Layers extends Control {
      constructor(baseLayers?: LayersObject, overlays?: LayersObject, options?: LayersOptions);
      options: LayersOptions;
      addBaseLayer(layer: Layer, name: string): this;
      addOverlay(layer: Layer, name: string): this;
      removeLayer(layer: Layer): this;
      expand(): this;
      collapse(): this;
    }

    export class Scale extends Control {
      constructor(options?: ScaleOptions);
      options: ScaleOptions;
    }
  }

  export interface LayersObject {
    [name: string]: Layer;
  }

  export interface AttributionOptions extends ControlOptions {
    prefix?: string | false;
  }

  export interface LayersOptions extends ControlOptions {
    collapsed?: boolean;
    autoZIndex?: boolean;
    hideSingleBase?: boolean;
    sortLayers?: boolean;
    sortFunction?: (layerA: Layer, layerB: Layer, nameA: string, nameB: string) => number;
  }

  export interface ScaleOptions extends ControlOptions {
    maxWidth?: number;
    metric?: boolean;
    imperial?: boolean;
    updateWhenIdle?: boolean;
  }

  export class Map extends Evented {
    constructor(element: string | HTMLElement, options?: MapOptions);
    options: MapOptions;
    
    // Methods
    getRenderer(layer: Path): Renderer;
    addControl(control: Control): this;
    removeControl(control: Control): this;
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    hasLayer(layer: Layer): boolean;
    eachLayer(fn: (layer: Layer) => void, context?: any): this;
    openPopup(popup: Popup): this;
    openPopup(content: ((source: Layer) => string) | string | HTMLElement, latlng: LatLngExpression, options?: PopupOptions): this;
    closePopup(popup?: Popup): this;
    openTooltip(tooltip: Tooltip): this;
    openTooltip(content: ((source: Layer) => string) | string | HTMLElement, latlng: LatLngExpression, options?: TooltipOptions): this;
    closeTooltip(tooltip?: Tooltip): this;
    setView(center: LatLngExpression, zoom?: number, options?: ZoomPanOptions): this;
    setZoom(zoom: number, options?: ZoomPanOptions): this;
    zoomIn(delta?: number, options?: ZoomOptions): this;
    zoomOut(delta?: number, options?: ZoomOptions): this;
    setZoomAround(latlng: LatLngExpression | PointExpression, zoom: number, options?: ZoomOptions): this;
    fitBounds(bounds: LatLngBoundsExpression, options?: FitBoundsOptions): this;
    fitWorld(options?: FitBoundsOptions): this;
    panTo(latlng: LatLngExpression, options?: PanOptions): this;
    panBy(offset: PointExpression, options?: PanOptions): this;
    flyTo(latlng: LatLngExpression, zoom?: number, options?: ZoomPanOptions): this;
    flyToBounds(bounds: LatLngBoundsExpression, options?: FitBoundsOptions): this;
    setMaxBounds(bounds: LatLngBoundsExpression): this;
    setMinZoom(zoom: number): this;
    setMaxZoom(zoom: number): this;
    panInsideBounds(bounds: LatLngBoundsExpression, options?: PanOptions): this;
    panInside(latlng: LatLngExpression, options?: PanOptions): this;
    invalidateSize(options?: boolean | InvalidateSizeOptions): this;
    stop(): this;
    locate(options?: LocateOptions): this;
    stopLocate(): this;
    remove(): this;
    getCenter(): LatLng;
    getZoom(): number;
    getBounds(): LatLngBounds;
    getMinZoom(): number;
    getMaxZoom(): number;
    getBoundsZoom(bounds: LatLngBoundsExpression, inside?: boolean, padding?: PointExpression): number;
    getSize(): Point;
    getPixelBounds(): Bounds;
    getPixelOrigin(): Point;
    getPixelWorldBounds(zoom?: number): Bounds;
    getPane(pane: string | HTMLElement): HTMLElement | undefined;
    getPanes(): { [name: string]: HTMLElement };
    getContainer(): HTMLElement;
    whenReady(fn: () => void, context?: any): this;
    getZoomScale(toZoom: number, fromZoom?: number): number;
    getScaleZoom(scale: number, fromZoom?: number): number;
    project(latlng: LatLngExpression, zoom?: number): Point;
    unproject(point: PointExpression, zoom?: number): LatLng;
    layerPointToLatLng(point: PointExpression): LatLng;
    latLngToLayerPoint(latlng: LatLngExpression): Point;
    wrapLatLng(latlng: LatLngExpression): LatLng;
    wrapLatLngBounds(bounds: LatLngBoundsExpression): LatLngBounds;
    distance(latlng1: LatLngExpression, latlng2: LatLngExpression): number;
    containerPointToLayerPoint(point: PointExpression): Point;
    layerPointToContainerPoint(point: PointExpression): Point;
    containerPointToLatLng(point: PointExpression): LatLng;
    latLngToContainerPoint(latlng: LatLngExpression): Point;
    mouseEventToContainerPoint(e: MouseEvent): Point;
    mouseEventToLayerPoint(e: MouseEvent): Point;
    mouseEventToLatLng(e: MouseEvent): LatLng;
  }
}