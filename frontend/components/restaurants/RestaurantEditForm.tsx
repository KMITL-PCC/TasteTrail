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
  const [categoriesSelected, setCategoriesSelected] = useState<string[]>([]);

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

  const categoryOptions = [
    "ร้านอาหารตามสั่ง",
    "คาเฟ่",
    "ร้านก๋วยเตี๋ยว",
    "ร้านเครื่องดื่ม",
    "ร้านอาหารอิสาน",
    "ร้านของหวาน",
    "ร้านของกินเล่น",
    "อาหารฮาลาล",
  ];

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
        interface OpeningHour {
          weekday: number; // 0 = Sunday, 1 = Monday, ...
          openTime: string;
          closeTime: string;
        }

        const timeFromAPI: OpeningHour[] = data.openingHour ?? [];

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
        interface RestaurantImage {
          id: string;
          url: string;
        }

        if (data.image?.restaurantImages) {
          setPreviewImages(
            data.image.restaurantImages.map((img: RestaurantImage) => ({
              id: img.id,
              url: img.url,
            })),
          );
        }

        if (data.image?.profileImage)
          setPreviewProfileImages([data.image.profileImage.url]);

        if (Array.isArray(data.category)) {
          setCategoriesSelected(data.category);
        }

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
    type: "openTime" | "closeTime" | "both",
    value?: string,
  ) => {
    setOpeningTimes((prev) => {
      const copy = [...prev];
      if (type === "both") {
        // ล้างทั้ง openTime และ closeTime
        copy[weekday] = { ...copy[weekday], openTime: "", closeTime: "" };
      } else {
        copy[weekday] = { ...copy[weekday], [type]: value || "" };
      }
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

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return; // ป้องกันกดซ้ำ
    if (!csrfToken) return toast.error("Session not ready");

    setIsSaving(true); // ปุ่มถูก disable

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
      form.append("category", JSON.stringify(categoriesSelected));
      form.append("time", JSON.stringify(openingTimes));

      // รูปภาพ
      previewImages.forEach((img) => {
        if (img.file) form.append("restaurantImages", img.file);
      });
      if (updateImages.length > 0) {
        form.append("updateImage", JSON.stringify(updateImages));
      }
      profileImages.forEach((f) => form.append("profileImage", f));

      const res = await fetch(SAVE_RESTAURANT_ENDPOINT, {
        method: "PUT",
        body: form,
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.json();
        toast.error("บันทึกล้มเหลว", { description: msg?.message });
        setIsSaving(false); // ให้กดอีกครั้งได้
        return;
      }

      toast.success("บันทึกสำเร็จ");
      router.push(`/restaurants/${restaurantId}`);
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      setIsSaving(false); // ให้กดอีกครั้งได้
    }
  };

  if (isLoading) return <p className="p-4">กำลังโหลดข้อมูลร้าน...</p>;

  return (
    <div className="mx-auto mt-6 max-w-4xl px-4">
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
                  onChange={(e) => {
                    const allowed = e.target.value.replace(
                      /[^ก-๙a-zA-Z0-9\s]/g, // ก-๙ ครอบคลุมตัวอักษรไทย + สระ + วรรณยุกต์
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
                      /[^ก-๙a-zA-Z0-9\s]/g,
                      "",
                    );
                    setLastName(allowed);
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
                    // อนุญาตตัวอักษรไทย อังกฤษ ตัวเลข และเว้นวรรค
                    setShopName(e.target.value);
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
                    setDescription(e.target.value);
                  }}
                  placeholder="ใส่คำอธิบายสั้น ๆ ของร้านคุณ"
                />
              </FieldBlock>

              <Separator />

              <FieldBlock label="หมวดหมู่ร้าน">
                <div className="grid gap-2 sm:grid-cols-2">
                  {categoryOptions.map((cat) => (
                    <div key={cat} className="flex items-center gap-2">
                      <Checkbox
                        checked={categoriesSelected.includes(cat)}
                        onCheckedChange={(v) => {
                          setCategoriesSelected((prev) =>
                            v ? [...prev, cat] : prev.filter((c) => c !== cat),
                          );
                        }}
                      />
                      <Label>{cat}</Label>
                    </div>
                  ))}
                </div>
              </FieldBlock>

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
                        setPickupAddress(e.target.value);
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
                          className="relative flex flex-col rounded-lg border border-gray-200 p-3 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <p className="mb-2 text-sm font-semibold text-gray-700">
                            {day}
                          </p>

                          {/* ปุ่มล้างเวลา */}
                          <button
                            type="button"
                            className="absolute top-2 right-2 text-xs text-red-500 hover:underline"
                            onClick={() => handleTimeChange(index, "both")}
                          >
                            ล้าง
                          </button>

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

                    {/* แถวล่าง 3 วันตรงกลาง */}
                    <div className="mt-2 flex flex-col items-center gap-2 md:flex-row md:justify-center md:gap-4">
                      {daysOfWeek.slice(4).map((day, i) => {
                        const index = i + 4;
                        return (
                          <div
                            key={index}
                            className="relative flex w-full flex-col rounded-lg border border-gray-200 p-3 shadow-sm transition-shadow hover:shadow-md md:w-40"
                          >
                            <p className="mb-2 text-sm font-semibold text-gray-700">
                              {day}
                            </p>

                            {/* ปุ่มล้างเวลา */}
                            <button
                              type="button"
                              className="absolute top-2 right-2 text-xs text-red-500 hover:underline"
                              onClick={() => handleTimeChange(index, "both")}
                            >
                              ล้าง
                            </button>

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
                    // อนุญาตแค่ตัวเลข
                    setContactDetail(e.target.value);
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

                <div className="mt-4 flex gap-2">
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
                        className="h-32 w-32 rounded-md object-cover"
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
                        className="absolute top-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* ช่องเพิ่มรูปใหม่ ถ้ายังไม่ครบ 4 รูป */}
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
                        className="size-[128px] rounded-full object-cover"
                      />
                      {/* ปุ่มลบรูป */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // ป้องกันคลิกเปิดไฟล์
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

        <CardFooter className="flex justify-end gap-x-2 border-t bg-gray-50 p-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            ยกเลิก
          </Button>

          <Button onClick={handleSave} disabled={isSaving}>
            <SaveIcon className="mr-2 h-4 w-4" />
            {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
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
