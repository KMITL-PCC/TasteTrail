"use client";

import { useState, useEffect, useRef } from "react";
import { Save as SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "../ui/textarea";
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
const MY_RESTAURANT_ENDPOINT = `${backendURL}/account/updateRestaurantInfo`;
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

type ImageItem = { id?: string; url?: string; file?: File };
type OpeningTime = { weekday: number; openTime: string; closeTime: string };

export default function RestaurantEditForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [shopName, setShopName] = useState("");
  const [hasPhysicalStore, setHasPhysicalStore] = useState(true);
  const [pickupAddress, setPickupAddress] = useState("");
  const [description, setDescription] = useState("");
  const [contactDetail, setContactDetail] = useState("");
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [previewImages, setPreviewImages] = useState<ImageItem[]>([]);
  const [previewProfileImages, setPreviewProfileImages] = useState<ImageItem[]>(
    [],
  );
  const [openingTimes, setOpeningTimes] = useState<OpeningTime[]>(
    Array.from({ length: 7 }, (_, i) => ({
      weekday: i,
      openTime: "",
      closeTime: "",
    })),
  );

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markerSourceRef = useRef<VectorSource | null>(null);

  // โหลด CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(CSRF_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setCsrfToken(data.csrfToken || null);
        }
      } catch {
        toast.error("โหลด token ไม่สำเร็จ");
      }
    };
    fetchCsrfToken();
  }, []);

  // โหลดข้อมูลร้าน
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(MY_RESTAURANT_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();

        setFirstName(data?.fullname?.firstName || "");
        setLastName(data?.fullname?.lastName || "");
        setShopName(data?.information?.name || "");
        setDescription(data?.information?.description || "");
        setPickupAddress(data?.information?.address || "");
        setContactDetail(data?.information?.contactDetail || "");

        if (data?.openingTimes) {
          setOpeningTimes(
            data.openingTimes.map((t: any) => ({
              weekday: t.weekday,
              openTime: t.openTime,
              closeTime: t.closeTime,
            })),
          );
        }

        setPreviewImages(
          (data?.restaurantImages || []).map((img: any) => ({
            id: img.id,
            url: img.url,
          })),
        );
        setPreviewProfileImages(
          data?.profileImage
            ? [{ id: data.profileImage.id, url: data.profileImage.url }]
            : [],
        );

        // prefill map
        if (data?.information?.latitude && data?.information?.longitude) {
          setLatitude(data.information.latitude);
          setLongitude(data.information.longitude);
        }
      } catch {
        toast.error("โหลดข้อมูลร้านไม่สำเร็จ");
      }
    };
    fetchRestaurant();
  }, []);

  // สร้าง map และ marker
  useEffect(() => {
    if (!mapRef.current) return;

    const markerSource = new VectorSource();
    markerSourceRef.current = markerSource;

    const markerLayer = new VectorLayer({ source: markerSource });
    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), markerLayer],
      view: new View({
        center: fromLonLat([longitude || 100.5018, latitude || 13.7563]), // default กรุงเทพ
        zoom: 12,
      }),
    });

    mapInstanceRef.current = map;

    // ถ้ามีพิกัด pre-fill marker
    if (latitude && longitude) {
      const marker = new Feature({
        geometry: new Point(fromLonLat([longitude, latitude])),
      });
      markerSource.addFeature(marker);
    }

    // คลิกที่ map จะ update marker
    map.on("click", (e) => {
      const coords = toLonLat(e.coordinate);
      setLongitude(coords[0]);
      setLatitude(coords[1]);

      const marker = new Feature({ geometry: new Point(e.coordinate) });
      markerSource.clear();
      markerSource.addFeature(marker);
    });

    return () => map.setTarget(undefined);
  }, [mapRef.current]);

  // preview helper
  const getPreviewSrc = (item: ImageItem | undefined) =>
    item?.file ? URL.createObjectURL(item.file) : item?.url || "";

  const handleStoreFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    const file = files[0];
    if (file.size > 8 * 1024 * 1024) {
      toast.error("ไฟล์ต้องไม่เกิน 8MB");
      return;
    }
    const newPreview = [...previewImages];
    newPreview[index] = { file };
    setPreviewImages(newPreview);
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    const file = files[0];
    if (file.size > 8 * 1024 * 1024) {
      toast.error("ไฟล์ต้องไม่เกิน 8MB");
      return;
    }
    setPreviewProfileImages([{ file }]);
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

  const handleUpdate = async () => {
    if (!csrfToken) return toast.error("Session not ready");

    try {
      const form = new FormData();
      form.append("fullname", JSON.stringify({ firstName, lastName }));
      form.append(
        "information",
        JSON.stringify({
          name: shopName,
          description,
          address: hasPhysicalStore ? pickupAddress : "",
          contactDetail,
          latitude,
          longitude,
        }),
      );
      form.append("openingTimes", JSON.stringify(openingTimes));

      // ส่งเฉพาะรูปใหม่ของร้าน
      previewImages.forEach((item) => {
        if (item.file) {
          form.append("restaurantImages", item.file);
        }
      });

      // ส่งเฉพาะรูปใหม่ของเจ้าของร้าน
      previewProfileImages.forEach((item) => {
        if (item.file) {
          form.append("profileImage", item.file);
        }
      });

      const res = await fetch(UPDATE_RESTAURANT_ENDPOINT, {
        method: "PUT",
        body: form,
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.json();
        return toast.error(msg?.message || "แก้ไขไม่สำเร็จ");
      }

      toast.success("อัปเดตข้อมูลสำเร็จ");
    } catch {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto mt-6 max-w-5xl px-4">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="md:col-span-4">
                <h2 className="text-base font-medium">แก้ไขข้อมูลร้าน</h2>
                <p className="text-muted-foreground text-sm">
                  ปรับรายละเอียดของร้านคุณให้เป็นปัจจุบัน
                </p>
              </div>

              <div className="md:col-span-8">
                <div className="grid gap-6">
                  {/* ชื่อจริงและนามสกุล */}
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

                  {/* ชื่อร้าน */}
                  <FieldBlock label="ชื่อร้านค้า" required>
                    <Input
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="ชื่อร้าน"
                    />
                  </FieldBlock>

                  <FieldBlock label="คำอธิบายร้านค้า (Description)">
                    <Textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="คำอธิบายร้าน"
                    />
                  </FieldBlock>

                  <Separator />

                  {/* ที่อยู่ + map */}
                  {hasPhysicalStore && (
                    <>
                      <FieldBlock label="ที่อยู่ในการเข้ารับสินค้า">
                        <Textarea
                          rows={3}
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          placeholder="กรอกที่อยู่ร้าน"
                        />
                      </FieldBlock>

                      <div className="my-4" style={{ height: 300 }}>
                        <div ref={mapRef} style={{ height: "100%" }} />
                        <p className="mt-1 text-xs text-gray-500">
                          คลิกบนแผนที่เพื่อปรับตำแหน่งร้าน
                        </p>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* เวลาเปิด-ปิด */}
                  {hasPhysicalStore && (
                    <div>
                      <Label className="text-sm font-medium">
                        เวลาเปิด-ปิดร้าน
                      </Label>
                      <div className="mt-2 grid gap-4">
                        {openingTimes.map((time, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <span className="w-24">
                              {daysOfWeek[time.weekday]}
                            </span>
                            <input
                              type="time"
                              value={time.openTime}
                              onChange={(e) =>
                                handleTimeChange(i, "openTime", e.target.value)
                              }
                              className="rounded-md border border-gray-300 px-2 py-1"
                            />
                            <span>-</span>
                            <input
                              type="time"
                              value={time.closeTime}
                              onChange={(e) =>
                                handleTimeChange(i, "closeTime", e.target.value)
                              }
                              className="rounded-md border border-gray-300 px-2 py-1"
                            />
                          </div>
                        ))}
                      </div>
                      <Separator />
                    </div>
                  )}

                  {/* ช่องทางติดต่อ */}
                  <FieldBlock label="ช่องทางติดต่อ (Contact detail)" required>
                    <Input
                      value={contactDetail}
                      onChange={(e) => setContactDetail(e.target.value)}
                      placeholder="เช่น เบอร์โทร, Line ID หรืออีเมล"
                    />
                  </FieldBlock>

                  <Separator />

                  {/* รูปภาพร้าน */}
                  <div>
                    <Label className="text-sm">อัปโหลดรูปภาพร้าน</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {previewImages.map((item, i) => (
                        <label key={i}>
                          <img
                            src={getPreviewSrc(item)}
                            className="h-32 w-32 cursor-pointer rounded-md object-cover"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleStoreFileChange(e, i)}
                            className="hidden"
                          />
                          {item.id && (
                            <p className="text-center text-xs text-gray-500">
                              ID: {item.id}
                            </p>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* รูปเจ้าของร้าน */}
                  <div>
                    <Label className="text-sm">อัปโหลดรูปเจ้าของร้าน</Label>
                    {previewProfileImages[0] && (
                      <label>
                        <img
                          src={getPreviewSrc(previewProfileImages[0])}
                          className="h-32 w-32 cursor-pointer rounded-full object-cover"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileFileChange}
                          className="hidden"
                        />
                        {previewProfileImages[0].id && (
                          <p className="text-xs text-gray-500">
                            ID: {previewProfileImages[0].id}
                          </p>
                        )}
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t bg-gray-50 p-4">
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleUpdate}
            >
              <SaveIcon className="mr-2 h-4 w-4" />
              บันทึกการแก้ไข
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
