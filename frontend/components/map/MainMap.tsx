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
  initialPosition?: [number, number] | null;
  onLocationChange?: (position: [number, number]) => void;
};

iconRetinaUrl: "/leaflet/marker-icon-2x.jpg";
iconUrl: "/leaflet/marker-icon.jpg";
shadowUrl: "/leaflet/marker-shadow.png";

// ✅ ทำให้รันเฉพาะ client เพื่อไม่ให้ break ตอน SSR
if (typeof window !== "undefined") {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.jpg",
    iconUrl: "/leaflet/marker-icon.jpg",
    shadowUrl: "/leaflet/marker-shadow.png",
  });
}

// --- Location Marker Component ---
function LocationMarker({
  initialPosition,
  onLocationChange,
}: {
  initialPosition?: [number, number] | null;
  onLocationChange?: (coords: [number, number]) => void;
}) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialPosition || null,
  );

  useEffect(() => {
    if (initialPosition) setPosition(initialPosition);
  }, [initialPosition]);

  const map = useMapEvents({
    click: (e: any) => {
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
  const DEFAULT_LOCATION: [number, number] = [13, 100];
  const [isClient, setIsClient] = useState(false);

  // ✅ รอให้ DOM พร้อมก่อน render MapContainer
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // fallback UI ระหว่างรอ mount
    return (
      <div className="flex h-[50vh] items-center justify-center rounded-md bg-gray-100">
        <span className="text-gray-400">กำลังโหลดแผนที่...</span>
      </div>
    );
  }

  return (
    <div className="h-[50vh] rounded-md">
      <MapContainer
        center={initialPosition || DEFAULT_LOCATION}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }} // ป้องกัน Tailwind ไม่กิน style
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          initialPosition={initialPosition || null}
          onLocationChange={onLocationChange}
        />
      </MapContainer>
    </div>
  );
}
