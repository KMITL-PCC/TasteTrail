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
import dynamic from "next/dynamic";

const Mainmap = dynamic(() => import("../map/MainMap"), { ssr: false });

// ✅ Backend URL
const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;
const SELLER_ENDPOINT = `${backendURL}/account/openRestaurant`;

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
  // เก็บไฟล์
  const [profileImages, setProfileUploadImages] = useState<File[]>([]);

  // เก็บ preview (string URL ไม่ใช่ File)
  const [previewProfileImages, setPreviewProfileUploadImages] = useState<
    string[]
  >([]);

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

  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const [services, setServices] = useState<number[]>([]);
  const toggleService = (id: number) => {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };
  const [contactDetail, setContactDetail] = useState("");

  const [description, setDescription] = useState("");

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

  // ฟังก์ชันแก้ไขเวลา
  const handleTimeChange = (
    weekday: number,
    timeType: "openTime" | "closeTime",
    value: string,
  ) => {
    // แปลงเวลาเป็น HH:MM 24 ชั่วโมง
    const [h, m] = value.split(":").map(Number);
    const formatted = `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}`;

    setOpeningTimes((prev) => {
      const updated = [...prev];
      updated[weekday] = { ...updated[weekday], [timeType]: formatted };
      return updated;
    });
  };

  const handleStoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const selectedFiles = Array.from(files).slice(0, 4); // จำกัดสูงสุด 4 รูป
      const validFiles = selectedFiles.filter(
        (file) => file.size <= 8 * 1024 * 1024,
      );

      if (validFiles.length !== selectedFiles.length) {
        toast.error("ขนาดไฟล์ไม่ควรเกิน 8MB");
      }

      setUploadedImages(validFiles);
      setPreviewImages(validFiles.map((file) => URL.createObjectURL(file)));
    }
  };

  // ✅ ฟังก์ชันอัปโหลดรูปเจ้าของร้าน
  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const selectedFiles = Array.from(files).slice(0, 1); // จำกัด 1 รูป
      const validFiles = selectedFiles.filter(
        (file) => file.size <= 8 * 1024 * 1024,
      );

      if (validFiles.length !== selectedFiles.length) {
        toast.error("ขนาดไฟล์ไม่ควรเกิน 8MB");
      }

      setProfileUploadImages(validFiles);
      const profileImgs = validFiles.map((file) => URL.createObjectURL(file));
      setPreviewProfileUploadImages(profileImgs); // ✅ ตรงกับ state ข้างบน
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

      // ✅ fullName
      form.append("fullname", JSON.stringify({ firstName, lastName }));

      // ✅ information (เฉพาะข้อมูลร้าน)
      form.append(
        "information",
        JSON.stringify({
          name: shopName,
          description: description, // ถ้ามี UI ให้ผู้ใช้กรอก เพิ่มตรงนี้
          address: hasPhysicalStore ? pickupAddress : "",
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          services,
          contactDetail,
        }),
      );

      // ✅ price แยก field ออกมา
      form.append(
        "price",
        JSON.stringify({
          minPrice: minPrice || 0,
          maxPrice: maxPrice || 0,
        }),
      );

      // ✅ contactDetail แยกเป็น field ของมันเอง (string)
      // form.append("contactDetail", contactDetail);

      // ✅ openingTimes แยก field ออกมา
      form.append("time", JSON.stringify(openingTimes));

      // ✅ รูปภาพ
      uploadedImages.forEach((file) => form.append("restaurantImages", file));

      // ✅ รูปเจ้าของร้าน
      profileImages.forEach((file) => form.append("profileImage", file));

      const res = await fetch(SELLER_ENDPOINT, {
        method: "POST",
        body: form,
        headers: { "X-CSRF-Token": csrfToken },
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
      <div className="mx-auto mt-6 max-w-3xl px-4">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* หัวข้ออยู่ด้านบน */}
              <div className="mb-6">
                <h2 className="text-base font-medium">รายละเอียดร้านค้า</h2>
                <p className="text-muted-foreground text-sm">
                  กรอกข้อมูลพื้นฐานของร้านคุณให้ครบถ้วน
                </p>
              </div>

              <div className="grid gap-6">
                {/* ชื่อจริงและนามสกุล */}
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

                {/* คำอธิบายร้าน */}
                <FieldBlock label="คำอธิบายร้านค้า (Description)">
                  <Textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ใส่คำอธิบายสั้น ๆ ของร้านคุณ"
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

                    <Mainmap
                      onLocationChange={([lat, lng]) => {
                        setLatitude(lat);
                        setLongitude(lng);
                      }}
                    />

                    <Separator />

                    {/* เวลาเปิดปิด */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium">
                        วันและเวลาเปิด-ปิด
                      </Label>
                      <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-4">
                        {daysOfWeek.map((day, index) => (
                          <div
                            key={index}
                            className="flex flex-col rounded-lg border border-gray-200 p-3 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <p className="mb-2 text-sm font-semibold text-gray-700">
                              {day}
                            </p>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  เปิด
                                </span>
                                <input
                                  type="time"
                                  value={openingTimes[index].openTime}
                                  onChange={(e) =>
                                    handleTimeChange(
                                      index,
                                      "openTime",
                                      e.target.value,
                                    )
                                  }
                                  className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                  step={60} // 24 ชั่วโมง
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  ปิด
                                </span>
                                <input
                                  type="time"
                                  value={openingTimes[index].closeTime} // ✅ ใช้ closeTime
                                  onChange={(e) =>
                                    handleTimeChange(
                                      index,
                                      "closeTime",
                                      e.target.value,
                                    )
                                  }
                                  className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                  step={60} // 24 ชั่วโมง
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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

                {/* ช่องทางติดต่อ */}
                <FieldBlock label="ช่องทางติดต่อ (Contact detail)" required>
                  <Input
                    value={contactDetail}
                    onChange={(e) => setContactDetail(e.target.value)}
                    maxLength={100}
                    placeholder="เช่น เบอร์โทร, Line ID หรืออีเมล"
                  />
                </FieldBlock>

                <Separator />

                {/* รูปภาพร้าน */}
                <div>
                  <Label className="text-sm">
                    อัปโหลดรูปภาพร้าน (สูงสุด 4 รูป, ขนาดไม่เกิน 8MB)
                  </Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStoreFileChange}
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

                {/* รูปเจ้าของร้าน */}
                <div>
                  <Label className="text-sm">
                    อัปโหลดรูปภาพเจ้าของร้าน (1 รูป, ขนาดไม่เกิน 8MB)
                  </Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileFileChange}
                    className="mt-2"
                  />
                  <div className="mt-4 flex gap-2">
                    {previewProfileImages.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`owner-profile-${index}`}
                        className="h-32 w-32 rounded-full object-cover"
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
