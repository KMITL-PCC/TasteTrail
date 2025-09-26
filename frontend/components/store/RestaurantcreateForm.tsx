"use client";

import { useState, useEffect, useRef } from "react";
import { Save as SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Map, View } from "ol";
import "ol/ol.css";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import { fromLonLat, toLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Point } from "ol/geom";
import Feature from "ol/Feature";
import { useUserStore } from "@/store/user-store";

// ✅ Backend URL
const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;
const UPDATE_RESTAURANT_ENDPOINT = `${backendURL}/account/updateRestaurant`;

// วันในสัปดาห์
const daysOfWeek = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

type OpeningTime = {
  weekday: number;
  openTime: string;
  closeTime: string;
};

export default function EditRestaurantPage() {
  const { user } = useUserStore();
  const restaurant = user?.restaurant;

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [shopName, setShopName] = useState(restaurant?.name || "");
  const [description, setDescription] = useState(restaurant?.description || "");
  const [hasPhysicalStore, setHasPhysicalStore] = useState(
    !!restaurant?.address,
  );
  const [pickupAddress, setPickupAddress] = useState(restaurant?.address || "");
  const [latitude, setLatitude] = useState<number | null>(
    restaurant?.latitude || null,
  );
  const [longitude, setLongitude] = useState<number | null>(
    restaurant?.longitude || null,
  );
  const [services, setServices] = useState<number[]>(
    restaurant?.services || [],
  );
  const [contactDetail, setContactDetail] = useState(
    restaurant?.contactDetail || "",
  );
  const [minPrice, setMinPrice] = useState<number | "">(
    restaurant?.minPrice || "",
  );
  const [maxPrice, setMaxPrice] = useState<number | "">(
    restaurant?.maxPrice || "",
  );
  const [openingTimes, setOpeningTimes] = useState<OpeningTime[]>(
    restaurant?.openingTimes || [
      { weekday: 0, openTime: "", closeTime: "" },
      { weekday: 1, openTime: "", closeTime: "" },
      { weekday: 2, openTime: "", closeTime: "" },
      { weekday: 3, openTime: "", closeTime: "" },
      { weekday: 4, openTime: "", closeTime: "" },
      { weekday: 5, openTime: "", closeTime: "" },
      { weekday: 6, openTime: "", closeTime: "" },
    ],
  );

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>(
    restaurant?.images || [],
  );
  const [profileImages, setProfileUploadImages] = useState<File[]>([]);
  const [previewProfileImages, setPreviewProfileUploadImages] = useState<
    string[]
  >(restaurant?.profileImage ? [restaurant.profileImage] : []);

  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  // โหลด CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(CSRF_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) return;
        const data = await res.json();
        setCsrfToken(data.csrfToken || null);
      } catch (err) {
        console.error("CSRF error:", err);
      }
    };

    fetchCsrfToken();
  }, []);

  // สร้างแผนที่ + marker เดิม
  useEffect(() => {
    if (mapRef.current) {
      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: fromLonLat([longitude || 100.5018, latitude || 13.7563]),
          zoom: 12,
        }),
      });

      const markerSource = new VectorSource();
      const markerLayer = new VectorLayer({ source: markerSource });
      map.addLayer(markerLayer);

      if (latitude && longitude) {
        const coord = fromLonLat([longitude, latitude]);
        const marker = new Feature({ geometry: new Point(coord) });
        markerSource.addFeature(marker);
      }

      map.on("click", (event) => {
        const coordinate = event.coordinate;
        const lonLat = toLonLat(coordinate);
        const marker = new Feature({ geometry: new Point(coordinate) });
        markerSource.clear();
        markerSource.addFeature(marker);
        setLongitude(lonLat[0]);
        setLatitude(lonLat[1]);
      });

      return () => map.setTarget(undefined);
    }
  }, [latitude, longitude]);

  const toggleService = (id: number) => {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleStoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selectedFiles = Array.from(files).slice(0, 4);
    const validFiles = selectedFiles.filter((f) => f.size <= 8 * 1024 * 1024);
    setUploadedImages(validFiles);
    setPreviewImages(validFiles.map((file) => URL.createObjectURL(file)));
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selectedFiles = Array.from(files).slice(0, 1);
    const validFiles = selectedFiles.filter((f) => f.size <= 8 * 1024 * 1024);
    setProfileUploadImages(validFiles);
    setPreviewProfileUploadImages(
      validFiles.map((file) => URL.createObjectURL(file)),
    );
  };

  const handleTimeChange = (
    weekday: number,
    timeType: "openTime" | "closeTime",
    value: string,
  ) => {
    setOpeningTimes((prev) => {
      const updated = [...prev];
      updated[weekday] = { ...updated[weekday], [timeType]: value };
      return updated;
    });
  };

  // ✅ บันทึกการแก้ไข
  const handleSave = async () => {
    if (!csrfToken) {
      toast.error("กรุณารอสักครู่ CSRF token กำลังโหลด...");
      return;
    }

    try {
      const form = new FormData();
      form.append("fullname", JSON.stringify({ firstName, lastName }));
      form.append(
        "information",
        JSON.stringify({
          name: shopName,
          description,
          address: hasPhysicalStore ? pickupAddress : "",
          latitude,
          longitude,
          services,
          contactDetail,
        }),
      );
      form.append("price", JSON.stringify({ minPrice, maxPrice }));
      form.append("time", JSON.stringify(openingTimes));

      uploadedImages.forEach((f) => form.append("restaurantImages", f));
      profileImages.forEach((f) => form.append("profileImage", f));

      const res = await fetch(UPDATE_RESTAURANT_ENDPOINT, {
        method: "PUT",
        body: form,
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.json();
        toast.error("บันทึกล้มเหลว", { description: msg.message });
        return;
      }

      toast.success("แก้ไขข้อมูลสำเร็จ 🎉");
    } catch (err) {
      toast.error("Connection error", {
        description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
      });
    }
  };

  if (!restaurant) {
    return (
      <div className="p-6">
        <p className="text-gray-500">คุณยังไม่มีร้านค้า</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto mt-6 max-w-5xl px-4">
        <Card>
          <CardContent className="p-6">
            {/* ฟอร์มเหมือนหน้า create แต่ preload ค่าเดิม */}
            <FieldBlock label="ชื่อจริงและนามสกุล" required>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ชื่อจริง"
              />
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="นามสกุล"
              />
            </FieldBlock>
            <Separator />
            <FieldBlock label="ชื่อร้าน" required>
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
              />
            </FieldBlock>
            <FieldBlock label="คำอธิบายร้านค้า">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FieldBlock>
            {/* ...เหมือน create ต่อไป (address, map, price, contact, services, images)... */}
          </CardContent>
          <CardFooter className="flex justify-end border-t bg-gray-50 p-4">
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleSave}
            >
              <SaveIcon className="mr-2 h-4 w-4" /> บันทึกการแก้ไข
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function FieldBlock({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 grid gap-2">
      <Label className="text-sm">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
