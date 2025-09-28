"use client";

import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// แก้ไอคอน Leaflet
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.jpg",
  iconUrl: "/leaflet/marker-icon.jpg",
  shadowUrl: "/leaflet/marker-shadow.png",
});

// --- TypeScript type สำหรับ click event ---
type LeafletMouseEventType = {
  latlng: {
    lat: number;
    lng: number;
  };
};

type MainMapProps = {
  onLocationChange?: (position: [number, number]) => void;
};

// --- Location Marker Component ---
function LocationMarker({
  onLocationChange,
}: {
  onLocationChange?: (position: [number, number]) => void;
}) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  const map = useMapEvents({
    click: (e: LeafletMouseEventType) => {
      const pos: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(pos);
      map.flyTo(pos, map.getZoom());
      onLocationChange?.(pos); // ✅ ส่งค่ากลับ parent
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  ) : null;
}

// --- Main Map Component ---
const MainMap = ({ onLocationChange }: MainMapProps) => {
  const DEFAULT_LOCATION: [number, number] = [13, 100];

  return (
    <div className="h-[50vh] rounded-md">
      <MapContainer
        className="h-full w-full"
        center={DEFAULT_LOCATION}
        zoom={13}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationChange={onLocationChange} />
      </MapContainer>
    </div>
  );
};

export default MainMap;
