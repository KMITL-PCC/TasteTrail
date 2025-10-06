"use client";

import { useState, useEffect, useRef } from "react";
import { Save as SaveIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation"; // เพิ่ม import ข้างบน
import { useSearchParams } from "next/navigation";

interface RestaurantcreateFormProps {
  initialTab?: string; // 🔹 ต้องประกาศ props เพื่อรับจาก parent
}

const Mainmap = dynamic(() => import("../map/MainMap"), { ssr: false });

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;
const SELLER_ENDPOINT = `${backendURL}/account/openRestaurant`;

const daysOfWeek = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

export default function SellerInfoWeb({
  initialTab,
}: RestaurantcreateFormProps) {
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
  const [profileImages, setProfileUploadImages] = useState<File[]>([]);
  const [previewProfileImages, setPreviewProfileUploadImages] = useState<
    string[]
  >([]);

  const router = useRouter();
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
  const [contactDetail, setContactDetail] = useState("");
  const [description, setDescription] = useState("");

  const [categoriesSelected, setCategoriesSelected] = useState<string[]>([]);

  // ประเภทร้าน
  const categories = [
    "ร้านอาหารตามสั่ง",
    "คาเฟ่",
    "ร้านก๋วยเตี๋ยว",
    "ร้านเครื่องดื่ม",
    "ร้านอาหารอิสาน",
    "ร้านของหวาน",
    "ร้านของกินเล่น",
    "อาหารฮาลาล",
  ];

  const toggleCategory = (cat: string) => {
    setCategoriesSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const toggleService = (id: number) => {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(CSRF_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });
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

  const handleTimeChange = (
    weekday: number,
    timeType: "openTime" | "closeTime",
    value: string,
  ) => {
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
      const selectedFiles = Array.from(files);
      // รวมกับไฟล์เดิมแต่ไม่เกิน 4
      const combined = [...uploadedImages, ...selectedFiles].slice(0, 4);
      setUploadedImages(combined);
      setPreviewImages(combined.map((file) => URL.createObjectURL(file)));
    }
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const selectedFiles = Array.from(files).slice(0, 1);
      setProfileUploadImages(selectedFiles);
      setPreviewProfileUploadImages(
        selectedFiles.map((file) => URL.createObjectURL(file)),
      );
    }
  };

  const handleSave = async () => {
    if (!csrfToken) {
      toast.error("Session not ready", {
        description: "กรุณารอสักครู่เพื่อเตรียมข้อมูล",
      });
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
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          services,
          contactDetail,
        }),
      );
      form.append(
        "price",
        JSON.stringify({
          minPrice: minPrice || 0,
          maxPrice: maxPrice || 0,
        }),
      );
      form.append("time", JSON.stringify(openingTimes));
      uploadedImages.forEach((file) => form.append("restaurantImages", file));
      profileImages.forEach((file) => form.append("profileImage", file));

      form.append("category", JSON.stringify(categoriesSelected));

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

      router.back();
    } catch (err) {
      toast.error("Connection Error", {
        description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
      });
    }
  };

  const getFileNames = (files: File[]) => {
    if (!files.length) return "No file chosen";
    return files.map((f) => f.name).join(", ");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl p-4 md:p-8 xl:px-16">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="mb-6">
                <h2 className="text-base font-medium">รายละเอียดร้านค้า</h2>
                <p className="text-muted-foreground text-sm">
                  กรอกข้อมูลพื้นฐานของร้านคุณให้ครบถ้วน
                </p>
              </div>

              <div className="grid gap-6">
                <FieldBlock label="ชื่อจริงและนามสกุล" required>
                  <Input
                    value={firstName}
                    placeholder="ชื่อจริง"
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <Input
                    value={lastName}
                    placeholder="นามสกุลจริง"
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </FieldBlock>

                <Separator />

                <FieldBlock label="ชื่อร้านค้า" required>
                  <Input
                    value={shopName}
                    placeholder="ชื่อร้านค้า"
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </FieldBlock>

                <Separator />

                <FieldBlock label="ประเภทร้าน" required>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {categories.map((cat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Checkbox
                          id={`category-${idx}`}
                          checked={categoriesSelected.includes(cat)}
                          onCheckedChange={() => toggleCategory(cat)}
                        />
                        <Label htmlFor={`category-${idx}`}>{cat}</Label>
                      </div>
                    ))}
                  </div>
                </FieldBlock>

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

                {hasPhysicalStore && (
                  <>
                    <Separator />
                    <FieldBlock label="ที่อยู่ในการเข้ารับสินค้า">
                      <textarea
                        rows={3}
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="บ้านเลขที่ / หมู่ / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"
                      />
                    </FieldBlock>

                    <div className="relative z-0 h-64 w-full overflow-hidden rounded-lg">
                      <Mainmap
                        onLocationChange={([lat, lng]) => {
                          setLatitude(lat);
                          setLongitude(lng);
                        }}
                      />
                    </div>
                  </>
                )}

                <Separator />

                <div className="mb-4">
                  <Label className="text-sm font-medium">
                    วันและเวลาเปิด-ปิด
                  </Label>

                  {/* แถวบน 4 วัน */}
                  <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-4">
                    {daysOfWeek.slice(0, 4).map((day, index) => (
                      <div
                        key={index}
                        className="flex flex-col rounded-lg border border-gray-200 p-3 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <p className="mb-2 text-sm font-semibold text-gray-700">
                          {day}
                        </p>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">เปิด</span>
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
                              step={60}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">ปิด</span>
                            <input
                              type="time"
                              value={openingTimes[index].closeTime}
                              onChange={(e) =>
                                handleTimeChange(
                                  index,
                                  "closeTime",
                                  e.target.value,
                                )
                              }
                              className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                              step={60}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* แถวล่าง 3 วันตรงกลาง */}
                  <div className="mt-2 flex flex-col items-center gap-2 md:flex-row md:justify-center md:gap-4">
                    {daysOfWeek.slice(4).map((day, i) => {
                      const index = i + 4;
                      return (
                        <div
                          key={index}
                          className="flex w-full flex-col rounded-lg border border-gray-200 p-3 shadow-sm transition-shadow hover:shadow-md md:w-40"
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
                                step={60}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">ปิด</span>
                              <input
                                type="time"
                                value={openingTimes[index].closeTime}
                                onChange={(e) =>
                                  handleTimeChange(
                                    index,
                                    "closeTime",
                                    e.target.value,
                                  )
                                }
                                className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                step={60}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ราคาต่ำสุด/สูงสุด */}
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

                <FieldBlock label="ช่องทางติดต่อ (Contact detail)">
                  <Input
                    value={contactDetail}
                    placeholder="เบอร์โทร"
                    onChange={(e) => setContactDetail(e.target.value)}
                  />
                </FieldBlock>

                {/* รูปภาพร้าน */}
                <FieldBlock
                  label="อัปโหลดรูปภาพร้าน (สูงสุด 4 รูป, ขนาดไม่เกิน 8MB)"
                  required
                >
                  <div className="flex items-center gap-4">
                    <Button asChild>
                      <label
                        htmlFor="restaurantImages"
                        className="cursor-pointer rounded-md px-4 py-2 text-white"
                      >
                        เลือกรูปภาพ
                      </label>
                    </Button>
                    <span className="text-sm text-gray-500">
                      {getFileNames(uploadedImages)}
                    </span>
                  </div>
                  <input
                    id="restaurantImages"
                    type="file"
                    accept="image/*"
                    onChange={handleStoreFileChange}
                    multiple
                    className="hidden"
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    {previewImages.map((img, index) => (
                      <div key={index} className="relative h-32 w-32">
                        {/* ใช้ <img> แทน <Image> สำหรับ blob URL */}
                        <Image
                          src={img}
                          alt={`uploaded-img-${index}`}
                          className="h-32 w-32 rounded-md object-cover"
                          width={128}
                          height={128}
                        />
                        {/* ปุ่มลบมุมขวาบน */}
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = uploadedImages.filter(
                              (_, i) => i !== index,
                            );
                            const newPreviews = previewImages.filter(
                              (_, i) => i !== index,
                            );
                            setUploadedImages(newFiles);
                            setPreviewImages(newPreviews);
                          }}
                          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </FieldBlock>

                {/* รูปเจ้าของร้าน */}
                <FieldBlock label="อัปโหลดรูปเจ้าของร้าน">
                  <div className="flex items-center gap-4">
                    <Button asChild>
                      <label
                        htmlFor="profileImage"
                        className="cursor-pointer rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-500"
                      >
                        เลือกรูปภาพ
                      </label>
                    </Button>
                    <span className="text-sm text-gray-500">
                      {getFileNames(profileImages)}
                    </span>
                  </div>
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleProfileFileChange}
                    className="hidden"
                  />

                  {previewProfileImages[0] && (
                    <div className="relative mt-4 h-32 w-32">
                      <>
                        <Image
                          src={previewProfileImages[0]}
                          alt="owner-profile"
                          className="h-32 w-32 rounded-full object-cover"
                          width={128}
                          height={128}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProfileUploadImages([]);
                            setPreviewProfileUploadImages([]);
                          }}
                          className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    </div>
                  )}
                </FieldBlock>

                {/* บริการ */}
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

          <CardFooter className="flex justify-end space-x-2 border-t bg-gray-50 p-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              ยกเลิก
            </Button>

            <Button onClick={handleSave}>
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
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
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
