"use client";

import { useState, useEffect, useRef } from "react";
import { Save as SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;
const GET_RESTAURANT_ENDPOINT = `${backendURL}/account/updateRestaurantInfo`;
const UPDATE_RESTAURANT_ENDPOINT = `${backendURL}/account/updateRestaurantInfo`;

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

type RestaurantImage = {
  id: string;
  url: string;
  file?: File;
};

export default function EditRestaurant() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [shopName, setShopName] = useState("");
  const [hasPhysicalStore, setHasPhysicalStore] = useState(true);
  const [pickupAddress, setPickupAddress] = useState("");
  const [description, setDescription] = useState("");
  const [contactDetail, setContactDetail] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [profileImages, setProfileImages] = useState<File[]>([]);
  const [previewProfileImages, setPreviewProfileImages] = useState<string[]>(
    [],
  );
  const [restaurantImages, setRestaurantImages] = useState<RestaurantImage[]>(
    [],
  );
  const [services, setServices] = useState<number[]>([]);
  const [openingTimes, setOpeningTimes] = useState<OpeningTime[]>([
    { weekday: 0, openTime: "", closeTime: "" },
    { weekday: 1, openTime: "", closeTime: "" },
    { weekday: 2, openTime: "", closeTime: "" },
    { weekday: 3, openTime: "", closeTime: "" },
    { weekday: 4, openTime: "", closeTime: "" },
    { weekday: 5, openTime: "", closeTime: "" },
    { weekday: 6, openTime: "", closeTime: "" },
  ]);

  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const markerSource = useRef<VectorSource | null>(null);

  // CSRF token
  useEffect(() => {
    fetch(CSRF_ENDPOINT, { method: "GET", credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken || null))
      .catch(() => toast.error("ไม่สามารถโหลด CSRF token"));
  }, []);

  // โหลดข้อมูลร้าน
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(GET_RESTAURANT_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        const data = await res.json();

        console.log(data);
        setFirstName(data.fullname?.firstName ?? "");
        setLastName(data.fullname?.lastName ?? "");

        setShopName(data.information?.name ?? "");
        setDescription(data.information?.description ?? "");
        setPickupAddress(data.information?.address ?? "");
        setLatitude(data.information?.latitude ?? 10.7246);
        setLongitude(data.information?.longitude ?? 99.3743);
        setContactDetail(data.information?.contactDetail ?? "");

        const serviceMapReverse: Record<string, number> = {
          delivery: 1,
          QR: 2,
          wifi: 3,
          alcohol: 4,
        };
        setServices(
          data.information?.services?.map(
            (s: string) => serviceMapReverse[s],
          ) || [],
        );

        setMinPrice(data.price?.minPrice ?? "");
        setMaxPrice(data.price?.maxPrice ?? "");
        setOpeningTimes(data.time || openingTimes);

        if (data.restaurantImages) setRestaurantImages(data.restaurantImages);
        if (data.profileImage) setPreviewProfileImages([data.profileImage.url]);

        setIsLoading(false);
      } catch {
        toast.error("โหลดข้อมูลร้านล้มเหลว");
        setIsLoading(false);
      }
    };
    fetchRestaurant();
  }, []);

  // สร้าง Map ครั้งเดียว
  useEffect(() => {
    if (!mapRef.current) return;

    markerSource.current = new VectorSource();
    const markerLayer = new VectorLayer({ source: markerSource.current });

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), markerLayer],
      view: new View({
        center: fromLonLat([longitude ?? 99.3743, latitude ?? 10.7246]),
        zoom: 12,
      }),
    });

    mapInstance.current.on("click", (event) => {
      const lonLat = toLonLat(event.coordinate);
      if (markerSource.current) {
        markerSource.current.clear();
        const marker = new Feature({ geometry: new Point(event.coordinate) });
        markerSource.current.addFeature(marker);
        setLongitude(lonLat[0]);
        setLatitude(lonLat[1]);
      }
    });

    return () => mapInstance.current?.setTarget(undefined);
  }, []);

  // อัปเดต marker เมื่อ latitude/longitude เปลี่ยน
  useEffect(() => {
    if (latitude && longitude && markerSource.current) {
      markerSource.current.clear();
      const marker = new Feature({
        geometry: new Point(fromLonLat([longitude, latitude])),
      });
      markerSource.current.addFeature(marker);
      mapInstance.current
        ?.getView()
        .setCenter(fromLonLat([longitude, latitude]));
    }
  }, [latitude, longitude]);

  const toggleService = (id: number) => {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleTimeChange = (
    weekday: number,
    type: "openTime" | "closeTime",
    value: string,
  ) => {
    setOpeningTimes((prev) => {
      const copy = [...prev];
      copy[weekday] = { ...copy[weekday], [type]: value };
      return copy;
    });
  };

  const handleReplaceProfileImage = (file: File) => {
    setProfileImages([file]);
    setPreviewProfileImages([URL.createObjectURL(file)]);
  };

  const handleReplaceStoreImage = (index: number, file: File) => {
    setRestaurantImages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], file };
      return copy;
    });
  };

  const handleSave = async () => {
    if (!csrfToken) {
      toast.error("Session not ready");
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
      form.append(
        "price",
        JSON.stringify({ minPrice: minPrice || 0, maxPrice: maxPrice || 0 }),
      );
      form.append("time", JSON.stringify(openingTimes));

      restaurantImages.forEach((img) => {
        if (img.file) form.append("restaurantImages", img.file);
        else form.append("existingImageIds", img.id);
      });

      profileImages.forEach((f) => form.append("profileImage", f));

      const res = await fetch(UPDATE_RESTAURANT_ENDPOINT, {
        method: "PUT",
        body: form,
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.json();
        toast.error("บันทึกล้มเหลว", { description: msg?.message || "" });
        return;
      }

      const data = await res.json();
      toast.success("บันทึกสำเร็จ", { description: data?.message || "" });
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  if (isLoading) return <p className="p-4">กำลังโหลดข้อมูล...</p>;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto mt-6 max-w-5xl px-4">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="md:col-span-4">
                <h2 className="text-base font-medium">แก้ไขร้านค้า</h2>
                <p className="text-muted-foreground text-sm">
                  ปรับแก้ข้อมูลร้านของคุณ
                </p>
              </div>
              <div className="md:col-span-8">
                <div className="grid gap-6">
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

                  <FieldBlock label="ชื่อร้านค้า" required>
                    <Input
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="ชื่อร้าน"
                    />
                  </FieldBlock>

                  <FieldBlock label="คำอธิบายร้านค้า">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border px-4 py-2"
                      placeholder="คำอธิบายสั้น"
                    />
                  </FieldBlock>
                  <Separator />

                  <FieldBlock label="มีหน้าร้าน">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={hasPhysicalStore}
                        onCheckedChange={(v) => setHasPhysicalStore(!!v)}
                      />
                      <Label>มีหน้าร้าน</Label>
                    </div>
                  </FieldBlock>
                  <Separator />

                  {hasPhysicalStore && (
                    <>
                      <FieldBlock label="ที่อยู่ในการเข้ารับสินค้า" required>
                        <textarea
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          rows={3}
                          className="w-full rounded-md border px-4 py-2"
                        />
                      </FieldBlock>

                      <FieldBlock label="ตำแหน่งร้านค้า">
                        <div style={{ height: "400px" }}>
                          <div ref={mapRef} style={{ height: "100%" }} />
                        </div>
                      </FieldBlock>
                      <Separator />

                      {openingTimes.map((t, i) => (
                        <div key={i} className="mb-4">
                          <p>วัน {daysOfWeek[t.weekday]}</p>
                          <div className="flex gap-4">
                            <div className="flex flex-col">
                              <Label>เวลาเปิด</Label>
                              <input
                                type="time"
                                value={t.openTime}
                                onChange={(e) =>
                                  handleTimeChange(
                                    i,
                                    "openTime",
                                    e.target.value,
                                  )
                                }
                                className="rounded-md border px-4 py-2"
                              />
                            </div>
                            <div className="flex flex-col">
                              <Label>เวลาปิด</Label>
                              <input
                                type="time"
                                value={t.closeTime}
                                onChange={(e) =>
                                  handleTimeChange(
                                    i,
                                    "closeTime",
                                    e.target.value,
                                  )
                                }
                                className="rounded-md border px-4 py-2"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Separator />
                    </>
                  )}

                  <FieldBlock label="ช่วงราคา (บาท)">
                    <div className="flex gap-4">
                      <Input
                        type="number"
                        min={0}
                        value={minPrice}
                        onChange={(e) =>
                          setMinPrice(Number(e.target.value) || "")
                        }
                        placeholder="ราคาต่ำสุด"
                      />
                      <Input
                        type="number"
                        min={0}
                        value={maxPrice}
                        onChange={(e) =>
                          setMaxPrice(Number(e.target.value) || "")
                        }
                        placeholder="ราคาสูงสุด"
                      />
                    </div>
                  </FieldBlock>

                  <FieldBlock label="ช่องทางติดต่อ" required>
                    <Input
                      value={contactDetail}
                      onChange={(e) => setContactDetail(e.target.value)}
                      placeholder="เช่น เบอร์โทร, Line ID"
                    />
                  </FieldBlock>
                  <Separator />

                  <FieldBlock label="รูปภาพร้าน (สูงสุด 4 รูป)">
                    <div className="mt-2 flex gap-2">
                      {restaurantImages.map((img, i) => (
                        <div key={img.id} className="relative">
                          <img
                            src={
                              img.file ? URL.createObjectURL(img.file) : img.url
                            }
                            className="h-32 w-32 cursor-pointer rounded-md object-cover"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/*";
                              input.onchange = (e: any) => {
                                if (e.target.files && e.target.files[0])
                                  handleReplaceStoreImage(i, e.target.files[0]);
                              };
                              input.click();
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </FieldBlock>
                  <Separator />

                  <FieldBlock label="รูปเจ้าของร้าน">
                    <div className="mt-2 flex gap-2">
                      {previewProfileImages.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          className="h-32 w-32 cursor-pointer rounded-full object-cover"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (e: any) => {
                              if (e.target.files && e.target.files[0])
                                handleReplaceProfileImage(e.target.files[0]);
                            };
                            input.click();
                          }}
                        />
                      ))}
                    </div>
                  </FieldBlock>
                  <Separator />

                  <FieldBlock label="บริการที่มี">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="delivery"
                          checked={services.includes(1)}
                          onCheckedChange={() => toggleService(1)}
                        />
                        <Label htmlFor="delivery">บริการส่ง (Delivery)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="qr"
                          checked={services.includes(2)}
                          onCheckedChange={() => toggleService(2)}
                        />
                        <Label htmlFor="qr">จ่ายด้วย QR</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="wifi"
                          checked={services.includes(3)}
                          onCheckedChange={() => toggleService(3)}
                        />
                        <Label htmlFor="wifi">มี Wi-Fi</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="alcohol"
                          checked={services.includes(4)}
                          onCheckedChange={() => toggleService(4)}
                        />
                        <Label htmlFor="alcohol">มีเครื่องดื่มแอลกอฮอล์</Label>
                      </div>
                    </div>
                  </FieldBlock>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t bg-gray-50 p-4">
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={handleSave}
            >
              <SaveIcon className="mr-2 h-4 w-4" /> บันทึกข้อมูล
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
    <div className="grid gap-2">
      <Label className="text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}
