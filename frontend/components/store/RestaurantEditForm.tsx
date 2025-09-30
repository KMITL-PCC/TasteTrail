"use client";

import { useState, useEffect } from "react";
import { Save as SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import dynamic from "next/dynamic";

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

  const [imageIDs, setImageIDs] = useState<number[]>([]);

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
        console.log(data);

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

        if (data.image?.restaurantImages) {
          setPreviewImages(
            data.image.restaurantImages.map((img: any) => img.url),
          );
          setImageIDs(data.image.restaurantImages.map((img: any) => img.id));
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
  const handleUpdateImage = (index: number, file: File) => {
    handleReplaceImage(index, file);
    const id = imageIDs[index]; // เอา ID จริง
    if (!updateImages.includes(id)) setUpdateImages((prev) => [...prev, id]);
  };

  // ลบรูป
  const handleRemoveUpdateImage = (index: number) => {
    handleRemoveImage(index);
    const id = imageIDs[index];
    if (!updateImages.includes(id)) setUpdateImages((prev) => [...prev, id]);
    setImageIDs((prev) => prev.filter((_, i) => i !== index));
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
      console.log(updateImages);

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
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  if (isLoading) return <p className="p-4">กำลังโหลดข้อมูลร้าน...</p>;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto mt-6 max-w-5xl px-4">
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-4">
                <h2 className="text-base font-medium">รายละเอียดร้านค้า</h2>
                <p className="text-muted-foreground text-sm">
                  กรอกข้อมูลร้านของคุณ
                </p>
              </div>
              <div className="grid gap-6 md:col-span-8">
                {/* ชื่อจริง / นามสกุล */}
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

                {/* ชื่อร้าน */}
                <FieldBlock label="ชื่อร้านค้า" required>
                  <Input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="ชื่อร้าน"
                  />
                </FieldBlock>

                {/* คำอธิบาย */}
                <FieldBlock label="คำอธิบายร้านค้า">
                  <Textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="คำอธิบายร้าน"
                  />
                </FieldBlock>

                {/* มีหน้าร้าน */}
                <FieldBlock label="มีหน้าร้าน">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={hasPhysicalStore}
                      onCheckedChange={(v) => setHasPhysicalStore(!!v)}
                    />
                    <Label>มีหน้าร้าน</Label>
                  </div>
                </FieldBlock>

                {hasPhysicalStore && (
                  <>
                    <FieldBlock label="ที่อยู่">
                      <Textarea
                        rows={3}
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                      />
                    </FieldBlock>

                    <FieldBlock label="ตำแหน่งบนแผนที่">
                      <MainMap
                        initialPosition={
                          latitude && longitude
                            ? [latitude, longitude]
                            : undefined
                        }
                        onLocationChange={([lat, lng]) => {
                          setLatitude(lat);
                          setLongitude(lng);
                        }}
                      />
                    </FieldBlock>

                    {openingTimes.map((t, i) => (
                      <FieldBlock
                        key={i}
                        label={`วัน ${daysOfWeek[t.weekday]} เปิด-ปิด`}
                      >
                        <div className="flex gap-4">
                          <input
                            type="time"
                            value={t.openTime}
                            onChange={(e) =>
                              handleTimeChange(i, "openTime", e.target.value)
                            }
                            className="rounded border p-1"
                          />
                          <input
                            type="time"
                            value={t.closeTime}
                            onChange={(e) =>
                              handleTimeChange(i, "closeTime", e.target.value)
                            }
                            className="rounded border p-1"
                          />
                        </div>
                      </FieldBlock>
                    ))}
                  </>
                )}

                {/* ช่วงราคา */}
                <FieldBlock label="ช่วงราคา">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={minPrice === "" ? "" : String(minPrice)}
                      onChange={(e) =>
                        setMinPrice(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      placeholder="ต่ำสุด"
                    />
                    <Input
                      type="number"
                      value={maxPrice === "" ? "" : String(maxPrice)}
                      onChange={(e) =>
                        setMaxPrice(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      placeholder="สูงสุด"
                    />
                  </div>
                </FieldBlock>

                {/* ช่องทางติดต่อ */}
                <FieldBlock label="ช่องทางติดต่อ">
                  <Input
                    value={contactDetail}
                    onChange={(e) => setContactDetail(e.target.value)}
                    placeholder="เบอร์/Line"
                  />
                </FieldBlock>

                {/* รูปภาพร้าน */}
                <FieldBlock label="รูปภาพร้าน">
                  <div className="mt-2 flex flex-wrap gap-2">
                    {previewImages.map((img, i) => (
                      <div key={i} className="relative">
                        <img
                          src={previewImages[i]}
                          className="h-32 w-32 cursor-pointer rounded-md object-cover"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (ev: any) => {
                              if (!ev.target.files) return;
                              const file = ev.target.files[0];
                              handleUpdateImage(i, file);
                            };
                            input.click();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveUpdateImage(i)}
                          className="absolute top-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* ปุ่มเพิ่มรูป ถ้ายังไม่เต็ม 4 รูป */}
                    {previewImages.length < 4 && (
                      <div
                        className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-md bg-gray-200 text-gray-500"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (ev: any) => {
                            if (!ev.target.files) return;
                            const file = ev.target.files[0];
                            setUploadedImages((prev) => [...prev, file]);
                            setPreviewImages((prev) => [
                              ...prev,
                              URL.createObjectURL(file),
                            ]);
                          };
                          input.click();
                        }}
                      >
                        เพิ่มรูป
                      </div>
                    )}
                  </div>
                </FieldBlock>

                {/* รูปเจ้าของร้าน */}
                <FieldBlock label="รูปเจ้าของร้าน">
                  <div className="mt-2 flex gap-2">
                    {previewProfileImages.length > 0 ? (
                      <div className="relative">
                        <img
                          src={previewProfileImages[0]}
                          className="h-32 w-32 cursor-pointer rounded-full object-cover"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (ev: any) => {
                              if (!ev.target.files) return;
                              handleReplaceProfileImage(ev.target.files[0]);
                            };
                            input.click();
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveProfileImage}
                          className="absolute top-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-gray-500"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (ev: any) => {
                            if (!ev.target.files) return;
                            handleReplaceProfileImage(ev.target.files[0]);
                          };
                          input.click();
                        }}
                      >
                        เพิ่มรูป
                      </div>
                    )}
                  </div>
                </FieldBlock>

                {/* บริการ */}
                <FieldBlock label="บริการ">
                  <div className="flex flex-wrap gap-4">
                    {[1, 2, 3, 4].map((id) => (
                      <div key={id} className="flex items-center gap-2">
                        <Checkbox
                          checked={services.includes(id)}
                          onCheckedChange={() => toggleService(id)}
                        />
                        <Label>
                          {["Delivery", "QR", "Wi-Fi", "Alcohol"][id - 1]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </FieldBlock>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={handleSave}
            >
              <SaveIcon className="mr-2 h-4 w-4" /> บันทึก
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
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}
