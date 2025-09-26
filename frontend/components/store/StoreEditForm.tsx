"use client";

import { useState, useEffect, useRef } from "react";
import { Save as SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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

// ✅ Backend URL
const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;
const SELLER_ENDPOINT = `${backendURL}/seller`;

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

export default function SellerInfoWeb() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [shopName, setShopName] = useState("");
  const [hasPhysicalStore, setHasPhysicalStore] = useState(true);
  const [pickupAddress, setPickupAddress] = useState("");

  type OpeningTime = {
    weekday: number;
    openTime: string;
    closeTime: string;
  };

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [openingTimes, setOpeningTimes] = useState<OpeningTime[]>([
    { weekday: 0, openTime: "", closeTime: "" },
    { weekday: 1, openTime: "", closeTime: "" },
    { weekday: 2, openTime: "", closeTime: "" },
    { weekday: 3, openTime: "", closeTime: "" },
    { weekday: 4, openTime: "", closeTime: "" },
    { weekday: 5, openTime: "", closeTime: "" },
    { weekday: 6, openTime: "", closeTime: "" },
  ]);

  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const [services, setServices] = useState<number[]>([]);
  const toggleService = (id: number) => {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  // โหลด CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(CSRF_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          toast.error("Security token error", {
            description: "ไม่สามารถโหลด CSRF token",
          });
          return;
        }

        const data = await res.json();
        setCsrfToken(data.csrfToken || null);
      } catch (err) {
        toast.error("Connection Error", {
          description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
        });
      }
    };

    fetchCsrfToken();
  }, []);

  // สร้างแผนที่
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
          center: fromLonLat([100.5018, 13.7563]), // Bangkok
          zoom: 12,
        }),
      });

      const markerSource = new VectorSource();
      const markerLayer = new VectorLayer({
        source: markerSource,
      });
      map.addLayer(markerLayer);

      map.on("click", (event) => {
        const coordinate = event.coordinate;
        const lonLat = toLonLat(coordinate);

        const marker = new Feature({
          geometry: new Point(coordinate),
        });

        markerSource.clear();
        markerSource.addFeature(marker);

        setLongitude(lonLat[0]);
        setLatitude(lonLat[1]);
      });

      return () => {
        map.setTarget(undefined);
      };
    }
  }, []);

  // ฟังก์ชันแก้ไขเวลา
  const handleTimeChange = (
    weekday: number,
    timeType: "openTime" | "closeTime",
    value: string,
  ) => {
    setOpeningTimes((prev: OpeningTime[]) => {
      const updatedTimes = [...prev];
      updatedTimes[weekday] = { ...updatedTimes[weekday], [timeType]: value };
      return updatedTimes;
    });
  };

  // ฟังก์ชันอัปโหลดไฟล์
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const selectedFiles = Array.from(files).slice(0, 4);
      const validFiles = selectedFiles.filter(
        (file) => file.size <= 8 * 1024 * 1024,
      );

      if (validFiles.length !== selectedFiles.length) {
        toast.error("ขนาดไฟล์ไม่ควรเกิน 8MB");
      }

      setUploadedImages(validFiles);
      const previews = validFiles.map((file) => URL.createObjectURL(file));
      setPreviewImages(previews);
    }
  };

  // ฟังก์ชันบันทึก
  const handleSave = async () => {
    if (!csrfToken) {
      toast.error("Session not ready", {
        description: "กรุณารอสักครู่เพื่อเตรียมข้อมูล",
      });
      return;
    }

    try {
      toast.info("กำลังบันทึกข้อมูล...");

      const form = new FormData();
      form.append("firstName", firstName);
      form.append("lastName", lastName);
      form.append("shopName", shopName);
      form.append("hasPhysicalStore", String(hasPhysicalStore));
      if (hasPhysicalStore) {
        form.append("pickupAddress", pickupAddress);
      }

      // เวลาเปิด-ปิด
      openingTimes.forEach((time: OpeningTime, index: number) => {
        form.append(`openingTimes[${index}].weekday`, time.weekday.toString());
        form.append(`openingTimes[${index}].openTime`, time.openTime);
        form.append(`openingTimes[${index}].closeTime`, time.closeTime);
      });

      // ราคา
      form.append(
        "price",
        JSON.stringify({
          minPrice: minPrice || 0,
          maxPrice: maxPrice || 0,
        }),
      );

      // พิกัด
      if (latitude !== null && longitude !== null) {
        form.append("latitude", String(latitude));
        form.append("longitude", String(longitude));
      }

      // services
      form.append("services", JSON.stringify(services));

      // รูปภาพ
      uploadedImages.forEach((file, idx) => {
        form.append("images", file);
      });

      const res = await fetch(SELLER_ENDPOINT, {
        method: "POST",
        body: form,
        headers: {
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.json();
        toast.error("บันทึกล้มเหลว", {
          description: msg?.message || "เกิดข้อผิดพลาด",
        });
        return;
      }

      const data = await res.json();
      toast.success("บันทึกสำเร็จ", {
        description: data?.message || "ข้อมูลร้านค้าถูกบันทึกเรียบร้อยแล้ว",
      });
    } catch (err) {
      toast.error("Connection Error", {
        description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto mt-6 max-w-5xl px-4">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="md:col-span-4">
                <h2 className="text-base font-medium">รายละเอียดร้านค้า</h2>
                <p className="text-muted-foreground text-sm">
                  กรอกข้อมูลพื้นฐานของร้านคุณให้ครบถ้วน
                </p>
              </div>

              <div className="md:col-span-8">
                <div className="grid gap-6">
                  {/* ชื่อจริง */}
                  <FieldBlock label="ชื่อจริงและนามสกุล" required>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      maxLength={30}
                      placeholder="ชื่อจริง"
                    />
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      maxLength={30}
                      placeholder="นามสกุลจริง"
                    />
                  </FieldBlock>

                  <Separator />

                  {/* ชื่อร้าน */}
                  <FieldBlock label="ชื่อร้านค้า" required>
                    <Input
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      maxLength={30}
                      placeholder="ชื่อร้านค้า"
                    />
                  </FieldBlock>

                  <Separator />

                  {/* หน้าร้าน */}
                  <FieldBlock label="หน้าร้าน">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="hasPhysicalStore"
                        checked={hasPhysicalStore}
                        onCheckedChange={(v) => setHasPhysicalStore(!!v)}
                      />
                      <Label htmlFor="hasPhysicalStore">มีหน้าร้าน</Label>
                    </div>
                  </FieldBlock>

                  <Separator />

                  {hasPhysicalStore && (
                    <>
                      <FieldBlock label="ที่อยู่ในการเข้ารับสินค้า" required>
                        <Textarea
                          rows={3}
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          placeholder="บ้านเลขที่ / หมู่ / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"
                        />
                      </FieldBlock>

                      <Separator />

                      <div style={{ height: "400px" }}>
                        <div ref={mapRef} style={{ height: "100%" }} />
                      </div>

                      <Separator />

                      {/* เวลาเปิดปิด */}
                      <div>
                        {openingTimes.map(
                          (time: OpeningTime, index: number) => (
                            <div key={index} className="mb-4">
                              <p>{`วัน ${daysOfWeek[time.weekday]}`}</p>
                              <div className="flex gap-4">
                                <div className="flex flex-col">
                                  <Label className="text-sm">เวลาเปิด</Label>
                                  <input
                                    type="time"
                                    value={time.openTime}
                                    onChange={(e) =>
                                      handleTimeChange(
                                        index,
                                        "openTime",
                                        e.target.value,
                                      )
                                    }
                                    className="rounded-md border border-gray-300 px-4 py-2"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <Label className="text-sm">เวลาปิด</Label>
                                  <input
                                    type="time"
                                    value={time.closeTime}
                                    onChange={(e) =>
                                      handleTimeChange(
                                        index,
                                        "closeTime",
                                        e.target.value,
                                      )
                                    }
                                    className="rounded-md border border-gray-300 px-4 py-2"
                                  />
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>

                      <Separator />
                    </>
                  )}

                  {/* ราคา */}
                  <FieldBlock label="ช่วงราคา (บาท)">
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <Label className="text-sm">ราคาต่ำสุด</Label>
                        <Input
                          type="number"
                          min={0}
                          value={minPrice}
                          onChange={(e) =>
                            setMinPrice(Number(e.target.value) || "")
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="flex flex-col">
                        <Label className="text-sm">ราคาสูงสุด</Label>
                        <Input
                          type="number"
                          min={0}
                          value={maxPrice}
                          onChange={(e) =>
                            setMaxPrice(Number(e.target.value) || "")
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </FieldBlock>

                  {/* รูปภาพ */}
                  <div>
                    <Label className="text-sm">
                      อัปโหลดรูปภาพ (สูงสุด 4 รูป, ขนาดไม่เกิน 8MB)
                    </Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      multiple
                      className="mt-2"
                    />
                    <div className="mt-4 flex gap-2">
                      {previewImages.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`uploaded-img-${index}`}
                          className="h-32 w-32 rounded-md object-cover"
                        />
                      ))}
                    </div>
                  </div>

                  <Separator />
                  {/* บริการที่มี */}
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
              <SaveIcon className="mr-2 h-4 w-4" />
              บันทึกข้อมูล
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
        {label} {required ? <span className="text-red-500">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
