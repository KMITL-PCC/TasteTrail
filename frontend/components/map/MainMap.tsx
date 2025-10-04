"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type MainMapProps = {
  initialPosition?: [number, number]; // fix type
  onLocationChange?: (position: [number, number]) => void;
};

// กำหนด icon สำหรับ Marker
if (typeof window !== "undefined") {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.jpg",
    iconUrl: "/leaflet/marker-icon.jpg",
    shadowUrl: "/leaflet/marker-shadow.jpg",
  });
}

// --- Location Marker Component ---
function LocationMarker({
  initialPosition,
  onLocationChange,
}: {
  initialPosition?: [number, number];
  onLocationChange?: (coords: [number, number]) => void;
}) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialPosition || null,
  );

  useEffect(() => {
    if (initialPosition) setPosition(initialPosition);
  }, [initialPosition]);

  const map = useMapEvents({
    click(e) {
      const pos: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(pos);
      map.flyTo(pos, map.getZoom());
      onLocationChange?.(pos);
    },
  });

  if (!position) return null;

  return (
    <Marker position={position}>
      <Popup>ตำแหน่งที่เลือก</Popup>
    </Marker>
  );
}

export default function MainMap({
  initialPosition,
  onLocationChange,
}: MainMapProps) {
  const DEFAULT_LOCATION: [number, number] = [
    10.724484933110002, 99.37435541163748,
  ];
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-[50vh] items-center justify-center rounded-md bg-gray-100">
        <span className="text-gray-400">กำลังโหลดแผนที่...</span>
      </div>
    );
  }

  return (
    <div className="z-0 h-[50vh] rounded-md">
      <MapContainer
        center={initialPosition || DEFAULT_LOCATION}
        zoom={13}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          initialPosition={initialPosition}
          onLocationChange={onLocationChange}
        />
      </MapContainer>
    </div>
  );
}
