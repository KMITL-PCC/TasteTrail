"use client";

import { useState, useEffect } from "react";
import { Save as SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";

const MainMap = dynamic(() => import("../map/MainMap"), { ssr: false });

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;
const GET_RESTAURANT_ENDPOINT = `${backendURL}/account/updateRestaurantInfo`;
const SAVE_RESTAURANT_ENDPOINT = `${backendURL}/account/updateRestaurantInfo`;

const daysOfWeek = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

type OpeningTime = { weekday: number; openTime: string; closeTime: string };

export default function EditRestaurantPage({
  restaurantId,
}: {
  restaurantId: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // --- field states ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [hasPhysicalStore, setHasPhysicalStore] = useState(true);
  const [contactDetail, setContactDetail] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [services, setServices] = useState<number[]>([]);
  const [openingTimes, setOpeningTimes] = useState<OpeningTime[]>(
    Array.from({ length: 7 }, (_, i) => ({
      weekday: i,
      openTime: "",
      closeTime: "",
    })),
  );
  type PreviewImage = {
    id: number | null; // id จาก backend, null = รูปใหม่
    url: string; // preview URL
    file?: File; // ถ้าเป็นรูปใหม่หรือเปลี่ยน
  };

  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [previewProfileImages, setPreviewProfileImages] = useState<string[]>(
    [],
  );

  const router = useRouter();

  // ฟังก์ชันเปลี่ยนรูปตาม index
  const handleReplaceImage = (index: number, file: File) => {
    setPreviewImages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], file, url: URL.createObjectURL(file) };
      return copy;
    });
  };

  // ฟังก์ชันลบรูป
  const handleRemoveImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const [profileImages, setProfileImages] = useState<File[]>([]);
  // เปลี่ยนรูปเจ้าของร้านตาม index
  const handleReplaceProfileImage = (file: File) => {
    setProfileImages([file]); // เก็บแค่ 1 ไฟล์
    setPreviewProfileImages([URL.createObjectURL(file)]);
  };

  // ลบรูปเจ้าของร้าน
  const handleRemoveProfileImage = () => {
    setProfileImages([]);
    setPreviewProfileImages([]);
  };

  const [updateImages, setUpdateImages] = useState<number[]>([]);

  const [serviceOptions, setServiceOptions] = useState<
    { id: number; name: string }[]
  >([]);

  // --- fetch data once on mount ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const csrfRes = await fetch(CSRF_ENDPOINT, { credentials: "include" });
        const csrfData = await csrfRes.json();
        setCsrfToken(csrfData.csrfToken ?? null);

        const res = await fetch(GET_RESTAURANT_ENDPOINT, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch restaurant info");
        const data = await res.json();

        // --- fullname ---
        if (typeof data.fullname === "string") {
          const [first = "", last = ""] = data.fullname.split(" ");
          setFirstName(first);
          setLastName(last);
        } else {
          setFirstName(data.fullname?.firstName ?? "");
          setLastName(data.fullname?.lastName ?? "");
        }

        // --- fields ---
        setShopName(data.name ?? "");
        setDescription(data.description ?? "");
        setPickupAddress(data.address ?? "");
        setLatitude(data.latitude ?? 10.7246);
        setLongitude(data.longitude ?? 99.3743);
        setContactDetail(data.contact?.contactDetail ?? "");
        setMinPrice(data.minPrice ? Number(data.minPrice) : "");
        setMaxPrice(data.maxPrice ? Number(data.maxPrice) : "");

        // --- services ---
        const serviceMap: Record<string, number> = {
          delivery: 1,
          qr: 2,
          wifi: 3,
          alcohol: 4,
        };
        setServices(
          (data.services ?? [])
            .map((s: string) => serviceMap[s.toLowerCase()])
            .filter(Boolean),
        );

        // --- opening hours ---
        const timeFromAPI: any[] = data.openingHour ?? [];
        setOpeningTimes(
          Array.from({ length: 7 }, (_, i) => {
            const t = timeFromAPI.find((x) => x.weekday === i);
            return {
              weekday: i,
              openTime: t?.openTime ?? "",
              closeTime: t?.closeTime ?? "",
            };
          }),
        );

        // --- images ---
        if (data.image?.restaurantImages)
          setPreviewImages(
            data.image.restaurantImages.map((img: any) => ({
              id: img.id,
              url: img.url,
            })),
          );

        if (data.image?.profileImage)
          setPreviewProfileImages([data.image.profileImage.url]);

        setIsLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("โหลดข้อมูลร้านล้มเหลว");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- handlers ---
  const toggleService = (id: number) =>
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

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

  const handleStoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selected = Array.from(files).slice(0, 4 - previewImages.length);
    setPreviewImages((prev) => [
      ...prev,
      ...selected.map((f) => ({
        id: null,
        file: f,
        url: URL.createObjectURL(f),
      })),
    ]);
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selected = Array.from(files).slice(0, 1);
    setProfileImages(selected);
    setPreviewProfileImages(selected.map((f) => URL.createObjectURL(f)));
  };

  // เปลี่ยนรูป
  // เปลี่ยนรูป
  const handleUpdateImage = (index: number, file: File) => {
    handleReplaceImage(index, file);

    const id = previewImages[index].id;
    if (id !== null) {
      setUpdateImages(
        (prev) => (prev.includes(id) ? prev : [...prev, id]), // ไม่ซ้ำ
      );
    }
  };

  // ลบรูป
  const handleRemoveUpdateImage = (index: number) => {
    const id = previewImages[index].id;
    handleRemoveImage(index);

    if (id !== null) {
      setUpdateImages(
        (prev) => (prev.includes(id) ? prev : [...prev, id]), // ไม่ซ้ำ
      );
    }
  };

  const handleSave = async () => {
    if (!csrfToken) return toast.error("Session not ready");
    try {
      const form = new FormData();

      // ข้อมูลทั่วไป
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
      console.log(openingTimes);

      // รูปภาพ
      // รูปใหม่ที่ผู้ใช้เปลี่ยนหรือเพิ่ม
      previewImages.forEach((img) => {
        if (img.file) form.append("restaurantImages", img.file);
      });

      // ส่ง id ของรูปที่ถูกเปลี่ยน
      if (updateImages.length > 0) {
        form.append("updateImage", JSON.stringify(updateImages));
      }

      // รูปโปรไฟล์
      profileImages.forEach((f) => form.append("profileImage", f));

      const res = await fetch(SAVE_RESTAURANT_ENDPOINT, {
        method: "PUT",
        body: form,
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.json();
        return toast.error("บันทึกล้มเหลว", { description: msg?.message });
      }

      toast.success("บันทึกสำเร็จ");
      router.push(`/restaurants/${restaurantId}`);
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  if (isLoading) return <p className="p-4">กำลังโหลดข้อมูลร้าน...</p>;

  return (
    <div className="max-w-3xl px-4 mx-auto mt-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* หัวข้ออยู่ด้านบน */}
            <div className="mb-6">
              <h2 className="text-base font-medium">รายละเอียดร้านค้า</h2>
              <p className="text-sm text-muted-foreground">
                กรอกข้อมูลพื้นฐานของร้านคุณให้ครบถ้วน
              </p>
            </div>

            <div className="grid gap-6">
              {/* ชื่อจริงและนามสกุล */}
              <FieldBlock label="ชื่อจริงและนามสกุล" required>
                <Input
                  value={firstName}
                  onChange={(e) => {
                    const allowed = e.target.value.replace(
                      /[^ก-ฮa-zA-Z0-9\s]/g,
                      "",
                    );
                    // อนุญาตตัวอักษรไทย อังกฤษ ตัวเลข และเว้นวรรค
                    setShopName(allowed);
                  }}
                  maxLength={30}
                  placeholder="ชื่อจริง"
                />
                <Input
                  value={lastName}
                  onChange={(e) => {
                    const allowed = e.target.value.replace(
                      /[^ก-ฮa-zA-Z0-9\s]/g,
                      "",
                    );
                    setDescription(allowed);
                  }}
                  maxLength={30}
                  placeholder="นามสกุลจริง"
                />
              </FieldBlock>

              <Separator />

              {/* ชื่อร้าน */}
              <FieldBlock label="ชื่อร้านค้า" required>
                <Input
                  value={shopName}
                  onChange={(e) => {
                    const allowed = e.target.value.replace(
                      /[^ก-ฮa-zA-Z0-9\s]/g,
                      "",
                    );
                    // อนุญาตตัวอักษรไทย อังกฤษ ตัวเลข และเว้นวรรค
                    setShopName(allowed);
                  }}
                  maxLength={30}
                  placeholder="ชื่อร้านค้า"
                />
              </FieldBlock>

              <Separator />

              {/* คำอธิบายร้าน */}
              <FieldBlock label="คำอธิบายร้านค้า (Description)">
                <Textarea
                  rows={3}
                  value={description}
                  onChange={(e) => {
                    const allowed = e.target.value.replace(
                      /[^ก-ฮa-zA-Z0-9\s]/g,
                      "",
                    );
                    setDescription(allowed);
                  }}
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
                      onChange={(e) => {
                        const allowed = e.target.value.replace(
                          /[^ก-ฮa-zA-Z0-9\s/.,-]/g,
                          "",
                        );
                        setPickupAddress(allowed);
                      }}
                      placeholder="บ้านเลขที่ / หมู่ / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"
                    />
                  </FieldBlock>

                  <Separator />

                  <MainMap
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

                    {/* แถวบน 4 วัน */}
                    <div className="grid grid-cols-1 gap-4 mt-2 md:grid-cols-4">
                      {daysOfWeek.slice(0, 4).map((day, index) => (
                        <div
                          key={index}
                          className="flex flex-col p-3 transition-shadow border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
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
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md"
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
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md"
                                step={60}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* แถวล่าง 3 วันตรงกลาง */}
                    <div className="flex flex-col items-center gap-2 mt-2 md:flex-row md:justify-center md:gap-4">
                      {daysOfWeek.slice(4).map((day, i) => {
                        const index = i + 4;
                        return (
                          <div
                            key={index}
                            className="flex flex-col w-full p-3 transition-shadow border border-gray-200 rounded-lg shadow-sm hover:shadow-md md:w-40"
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
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md"
                                  step={60}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  ปิด
                                </span>
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
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md"
                                  step={60}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
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

              <Separator />

              {/* ช่องทางติดต่อ */}
              <FieldBlock label="ช่องทางติดต่อ (Contact detail)" required>
                <Input
                  value={contactDetail}
                  onChange={(e) => {
                    const allowed = e.target.value.replace(/[^0-9]/g, "");
                    // อนุญาตแค่ตัวเลข
                    setContactDetail(allowed);
                  }}
                  maxLength={100}
                  placeholder="เบอร์โทร"
                />
              </FieldBlock>

              <Separator />

              {/* รูปภาพร้าน */}
              <FieldBlock label="รูปภาพร้าน (สูงสุด 4 รูป, ขนาดไม่เกิน 8MB)">
                {/* input หลักสำหรับเพิ่มรูปใหม่ */}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="store-input"
                  onChange={handleStoreFileChange}
                />

                <div className="flex gap-2 mt-4">
                  {previewImages.map((img, i) => (
                    <div
                      key={i}
                      className="relative cursor-pointer"
                      onClick={() =>
                        document.getElementById(`replace-image-${i}`)?.click()
                      }
                    >
                      <Image
                        src={img.url} // <- ต้องใช้ img.url ไม่ใช่ img object
                        alt={`uploaded-img-${i}`}
                        width={128}
                        height={128}
                        className="object-cover w-32 h-32 rounded-md"
                      />

                      {/* input สำหรับเปลี่ยนรูปเฉพาะ index */}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`replace-image-${i}`}
                        onChange={(e) => {
                          if (e.target.files?.[0])
                            handleUpdateImage(i, e.target.files[0]);
                        }}
                      />

                      {/* ปุ่มลบรูป */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveUpdateImage(i); // ส่ง index
                        }}
                        className="absolute top-0 right-0 flex items-center justify-center w-6 h-6 text-xs text-white bg-red-500 rounded-full"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* ช่องเพิ่มรูปใหม่ ถ้ายังไม่ครบ 4 รูป */}
                  {previewImages.length < 4 && (
                    <div
                      className="flex items-center justify-center w-32 h-32 text-gray-500 bg-gray-200 rounded-md cursor-pointer"
                      onClick={() =>
                        document.getElementById("store-input")?.click()
                      }
                    >
                      เพิ่มรูป
                    </div>
                  )}
                </div>
              </FieldBlock>

              <Separator />

              {/* รูปเจ้าของร้าน */}
              <FieldBlock label="รูปเจ้าของร้าน (1 รูป, ขนาดไม่เกิน 8MB)">
                {/* input hidden สำหรับเลือก/เปลี่ยนรูป */}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="profile-input"
                  onChange={(e) => {
                    if (e.target.files?.[0])
                      handleReplaceProfileImage(e.target.files[0]);
                  }}
                />

                <div className="flex gap-2 mt-4">
                  {previewProfileImages.length > 0 ? (
                    <div
                      className="relative cursor-pointer"
                      onClick={() =>
                        document.getElementById("profile-input")?.click()
                      }
                    >
                      <Image
                        src={previewProfileImages[0]}
                        alt="owner-profile"
                        width={128}
                        height={128}
                        className="size-[128px] rounded-full object-cover"
                      />
                      {/* ปุ่มลบรูป */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // ป้องกันคลิกเปิดไฟล์
                          handleRemoveProfileImage();
                        }}
                        className="absolute flex items-center justify-center w-6 h-6 text-xs text-white bg-red-500 rounded-full top-1 right-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-center w-32 h-32 text-gray-500 bg-gray-200 rounded-full cursor-pointer"
                      onClick={() =>
                        document.getElementById("profile-input")?.click()
                      }
                    >
                      เพิ่มรูป
                    </div>
                  )}
                </div>
              </FieldBlock>

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

        <CardFooter className="flex justify-end p-4 border-t gap-x-2 bg-gray-50">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="text-gray-700 bg-gray-200 hover:bg-gray-300"
          >
            ยกเลิก
          </Button>

          <Button onClick={handleSave}>
            <SaveIcon className="w-4 h-4 mr-2" />
            บันทึกข้อมูล
          </Button>
        </CardFooter>
      </Card>
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
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}
