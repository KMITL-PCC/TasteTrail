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

export default function EditRestaurantPage() {
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
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [previewProfileImages, setPreviewProfileImages] = useState<string[]>(
    [],
  );

  const router = useRouter();

  // ฟังก์ชันเปลี่ยนรูปตาม index
  const handleReplaceImage = (index: number, file: File) => {
    // update uploadedImages
    const newUploaded = [...uploadedImages];
    newUploaded[index] = file;
    setUploadedImages(newUploaded);

    // update preview
    const newPreview = [...previewImages];
    newPreview[index] = URL.createObjectURL(file);
    setPreviewImages(newPreview);
  };

  // ฟังก์ชันลบรูป
  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
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
            data.image.restaurantImages.map((img: any) => img.url),
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
    const selected = Array.from(files).slice(0, 4);
    setUploadedImages(selected);
    setPreviewImages(selected.map((f) => URL.createObjectURL(f)));
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selected = Array.from(files).slice(0, 1);
    setProfileImages(selected);
    setPreviewProfileImages(selected.map((f) => URL.createObjectURL(f)));
  };

  // เปลี่ยนรูป
  const handleUpdateImage = (id: number, file: File) => {
    handleReplaceImage(id, file); // อัปเดต previewImages + uploadedImages
    if (!updateImages.includes(id)) {
      setUpdateImages((prev) => [...prev, id]);
    }
  };

  // ลบรูป
  const handleRemoveUpdateImage = (id: number) => {
    handleRemoveImage(id); // อัปเดต previewImages + uploadedImages
    if (!updateImages.includes(id)) {
      setUpdateImages((prev) => [...prev, id]);
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
      uploadedImages.forEach((f) => form.append("restaurantImages", f));
      profileImages.forEach((f) => form.append("profileImage", f));

      // เฉพาะ updateImages: ส่ง array ของ id ถ้ามีการแก้ไข
      form.append("updateImage", JSON.stringify(updateImages));

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
      router.back();
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  if (isLoading) return <p className="p-4">กำลังโหลดข้อมูลร้าน...</p>;

  return (
    <div className="mx-auto mt-6 max-w-3xl px-4">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* หัวข้อ */}
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
                  onChange={(e) => {
                    const allowed = e.target.value.replace(
                      /[^ก-ฮa-zA-Z0-9\s]/g,
                      "",
                    );
                    setFirstName(allowed);
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
                    setLastName(allowed);
                  }}
                  maxLength={30}
                  placeholder="นามสกุลจริง"
                />
                {/* Status block */}
                <p className="mt-1 text-sm text-gray-500">
                  {firstName && lastName
                    ? "Status: All is well."
                    : "กรอกชื่อ-นามสกุลให้ครบ"}
                </p>
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
                      ))}
                    </div>

                    {/* แถวล่าง 3 วัน */}
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
                    setContactDetail(allowed);
                  }}
                  maxLength={100}
                  placeholder="เบอร์โทร"
                />
              </FieldBlock>

              <Separator />

              {/* รูปภาพร้าน */}
              <FieldBlock label="รูปภาพร้าน (สูงสุด 4 รูป, ขนาดไม่เกิน 8MB)">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="store-input"
                  onChange={handleStoreFileChange}
                />

                <div className="mt-4 flex gap-2">
                  {previewImages.map((img, i) => (
                    <div
                      key={i}
                      className="relative cursor-pointer"
                      onClick={() =>
                        document.getElementById(`replace-image-${i}`)?.click()
                      }
                    >
                      <img
                        src={img}
                        alt={`uploaded-img-${i}`}
                        className="h-32 w-32 rounded-md object-cover"
                      />
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveUpdateImage(i);
                        }}
                        className="absolute top-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {previewImages.length < 4 && (
                    <div
                      className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-md bg-gray-200 text-gray-500"
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

                <div className="mt-4 flex gap-2">
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
                        className="rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveProfileImage();
                        }}
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-gray-500"
                      onClick={() =>
                        document.getElementById("profile-input")?.click()
                      }
                    >
                      เพิ่มรูป
                    </div>
                  )}
                </div>
              </FieldBlock>

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

        <CardFooter className="flex justify-end gap-2 border-t bg-gray-50 p-4">
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={() => router.back()}
          >
            ยกเลิก
          </Button>
          <Button
            className="bg-green-700 hover:bg-green-600"
            onClick={handleSave}
          >
            <SaveIcon className="mr-2 h-4 w-4" />
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
