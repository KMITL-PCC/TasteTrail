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
import { OSM } from "ol/source";
import { Tile } from "ol/layer";
import { fromLonLat, toLonLat } from "ol/proj";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Point } from "ol/geom";
import { Feature } from "ol";

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
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [openingTimes, setOpeningTimes] = useState<any>([
    { weekday: 0, openTime: "", closeTime: "" }, // Sunday
    { weekday: 1, openTime: "", closeTime: "" }, // Monday
    { weekday: 2, openTime: "", closeTime: "" }, // Tuesday
    { weekday: 3, openTime: "", closeTime: "" }, // Wednesday
    { weekday: 4, openTime: "", closeTime: "" }, // Thursday
    { weekday: 5, openTime: "", closeTime: "" }, // Friday
    { weekday: 6, openTime: "", closeTime: "" }, // Saturday
  ]);

  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mapRef.current) {
      const map = new Map({
        target: mapRef.current,
        layers: [
          new Tile({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: fromLonLat([100.5018, 13.7563]),
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
      });

      return () => {
        map.setTarget(undefined);
      };
    }
  }, []);

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

      const newImages = validFiles.map((file) => URL.createObjectURL(file));
      setUploadedImages((prevImages) => [...prevImages, ...newImages]);
    }
  };

  const handleSave = async () => {
    const payload = {
      fullName: {
        firstName,
        lastName,
      },
      shopName,
      hasPhysicalStore,
      pickupAddress: hasPhysicalStore ? pickupAddress : null,
      openingTimes,
      images: uploadedImages,
    };

    try {
      toast.info("กำลังบันทึกข้อมูล...");
      const res = await fetch("/api/saveSeller", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
        description: data?.message || "อัปเดตข้อมูลร้านค้าเรียบร้อย",
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

                  <FieldBlock label="ชื่อร้านค้า" required>
                    <Input
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      maxLength={30}
                      placeholder="ชื่อร้านค้า"
                    />
                  </FieldBlock>

                  <Separator />

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

                      {/* เลือกเวลาเปิดร้าน */}
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

                  <Separator />

                  {/* ฟอร์มอัปโหลดรูปภาพ */}
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
                    <div className="mt-4">
                      {uploadedImages.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`uploaded-img-${index}`}
                          className="mb-2 h-32 w-32 rounded-md object-cover"
                        />
                      ))}
                    </div>
                  </div>

                  <Separator />
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
