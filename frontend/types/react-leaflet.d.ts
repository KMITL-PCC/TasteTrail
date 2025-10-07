declare module "react-leaflet" {
  import {
    type FitBoundsOptions,
    type LatLngBoundsExpression,
    Map as LeafletMap,
    type MapOptions,
  } from "leaflet";
  import React, { type CSSProperties, type ReactNode } from "react";

  export type MapRef = LeafletMap | null;

  export interface MapContainerProps extends MapOptions {
    bounds?: LatLngBoundsExpression;
    boundsOptions?: FitBoundsOptions;
    children?: ReactNode;
    className?: string;
    id?: string;
    placeholder?: ReactNode;
    style?: CSSProperties;
    center?: [number, number];
    zoom?: number;
    scrollWheelZoom?: boolean;
    dragging?: boolean;
    zoomControl?: boolean;
    attributionControl?: boolean;
    doubleClickZoom?: boolean;
    zoomAnimation?: boolean;
    zoomAnimationThreshold?: number;
    zoomAnimationSpeed?: number;
    whenReady?: () => void;
  }

  export const MapContainer: React.ForwardRefExoticComponent<
    MapContainerProps & React.RefAttributes<LeafletMap>
  >;
  export const TileLayer: React.FC<any>;
  export const Marker: React.FC<any>;
  export const Popup: React.FC<any>;
  export function useMapEvents(handlers: any): any;
}
