// "use client";

// import { useMemo, useRef, useState, useEffect } from "react";
// import { Save as SaveIcon, MapPin } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardFooter } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Loader } from "@googlemaps/js-api-loader";
// import { toast } from "sonner";

// /* ---------------- Config ---------------- */

// const backendURL =
//   process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
// const CSRF_ENDPOINT = `${backendURL}/csrf-token`;
// const SELLER_ENDPOINT = `${backendURL}/seller`;

// /* ======================== Main Page ======================== */

// export default function SellerInfoWeb() {
//   // form states
//   const [shopName, setShopName] = useState("zeroznice");
//   const [hasPhysicalStore, setHasPhysicalStore] = useState(true);

//   const [pickupAddress, setPickupAddress] = useState(
//     "23 ม.7 ต.บ้านพร้าว อ.ป่าโมก จ.อ่างทอง 14130",
//   );

//   // พิกัดเก็บไว้ภายใน (ไม่แสดงช่อง latitude/longitude)
//   const [lat, setLat] = useState<number>(13.7563); // กรุงเทพฯ
//   const [lng, setLng] = useState<number>(100.5018);
//   const [placeSearchText, setPlaceSearchText] = useState("");

//   const [email, setEmail] = useState("zeroznice.nice@gmail.com");
//   const [phone, setPhone] = useState("66932491392");

//   // session / ui states
//   const [csrfToken, setCsrfToken] = useState<string | null>(null);
//   const [loadingInitial, setLoadingInitial] = useState(true);
//   const [saving, setSaving] = useState(false);

//   // validation
//   const errors = useMemo(() => {
//     const e: Record<string, string | null> = {};
//     if (!shopName.trim()) e.shopName = "กรุณากรอกชื่อร้านค้า";
//     if (hasPhysicalStore && !pickupAddress.trim())
//       e.pickupAddress = "กรุณากรอกที่อยู่รับสินค้า";
//     if (!email.trim()) e.email = "กรุณากรอกอีเมล";
//     if (!phone.trim()) e.phone = "กรุณากรอกเบอร์โทรศัพท์";
//     if (hasPhysicalStore && (lat == null || lng == null))
//       e.latlng = "กรุณาปักหมุดตำแหน่งให้เรียบร้อย";
//     return e;
//   }, [shopName, pickupAddress, email, phone, hasPhysicalStore, lat, lng]);

//   const isValid = useMemo(
//     () => Object.values(errors).every((v) => !v),
//     [errors],
//   );

//   /* ---------- Boot: fetch CSRF + load existing seller profile ---------- */
//   useEffect(() => {
//     (async () => {
//       try {
//         // 1) CSRF
//         const csrfRes = await fetch(CSRF_ENDPOINT, {
//           method: "GET",
//           credentials: "include",
//         });
//         if (!csrfRes.ok) {
//           toast.error("Security token error", {
//             description: await pickError(
//               csrfRes,
//               "Could not establish a secure session.",
//             ),
//           });
//           setLoadingInitial(false);
//           return;
//         }
//         const csrfData = await csrfRes.json();
//         setCsrfToken(csrfData?.csrfToken || null);

//         // 2) Load seller info
//         const res = await fetch(SELLER_ENDPOINT, {
//           method: "GET",
//           credentials: "include",
//         });
//         if (!res.ok) {
//           // อนุญาตให้ผู้ใช้เริ่มกรอกใหม่ได้ แม้โหลดไม่สำเร็จ
//           const msg = await pickError(res, "Failed to load seller profile.");
//           toast.warning("Load failed", { description: msg });
//         } else {
//           const data = await res.json();
//           // รองรับรูปแบบข้อมูลทั่วไป: { shopName, hasPhysicalStore, pickupAddress, geo: {lat,lng}, email, phone }
//           if (data?.shopName) setShopName(data.shopName);
//           if (typeof data?.hasPhysicalStore === "boolean")
//             setHasPhysicalStore(data.hasPhysicalStore);
//           if (data?.pickupAddress) setPickupAddress(data.pickupAddress);
//           if (data?.geo?.lat && data?.geo?.lng) {
//             setLat(Number(data.geo.lat));
//             setLng(Number(data.geo.lng));
//           }
//           if (data?.email) setEmail(data.email);
//           if (data?.phone) setPhone(data.phone);
//         }
//       } catch (err) {
//         console.error("Initial load error:", err);
//         toast.error("Connection Error", {
//           description: "Unable to connect to the server.",
//         });
//       } finally {
//         setLoadingInitial(false);
//       }
//     })();
//   }, []);

//   /* ---------- Save ---------- */
//   const handleSave = async () => {
//     if (!isValid) {
//       toast.error("แบบฟอร์มไม่ครบ", {
//         description: "กรุณาตรวจสอบข้อมูลที่จำเป็นให้ครบถ้วน",
//       });
//       return;
//     }
//     if (!csrfToken) {
//       toast.error("Session not ready", {
//         description: "โปรดลองใหม่อีกครั้ง (CSRF token ไม่พร้อม)",
//       });
//       return;
//     }

//     const payload = {
//       shopName,
//       hasPhysicalStore,
//       pickupAddress: hasPhysicalStore ? pickupAddress : null,
//       geo: hasPhysicalStore ? { lat, lng } : null,
//       email,
//       phone,
//     };

//     try {
//       setSaving(true);
//       toast.info("กำลังบันทึกข้อมูล...");

//       const res = await fetch(SELLER_ENDPOINT, {
//         method: "POST", // เปลี่ยนเป็น "PUT" ได้ตามที่ backend กำหนด
//         credentials: "include",
//         headers: {
//           "Content-Type": "application/json",
//           "X-CSRF-Token": csrfToken,
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const msg = await pickError(res, "Failed to save seller profile.");
//         toast.error("บันทึกล้มเหลว", { description: msg });
//         return;
//       }

//       const data = await res.json().catch(() => ({}));
//       toast.success("บันทึกสำเร็จ", {
//         description: data?.message || "อัปเดตข้อมูลร้านค้าเรียบร้อย",
//       });
//     } catch (err) {
//       console.error("Save error:", err);
//       toast.error("Connection Error", {
//         description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       <div className="mx-auto mt-6 max-w-5xl px-4">
//         <Card>
//           <CardContent className="p-6">
//             <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
//               {/* Left column */}
//               <div className="md:col-span-4">
//                 <h2 className="text-base font-medium">รายละเอียดร้านค้า</h2>
//                 <p className="text-muted-foreground text-sm">
//                   กรอกข้อมูลพื้นฐานของร้านคุณให้ครบถ้วน
//                 </p>
//               </div>

//               {/* Right column */}
//               <div className="md:col-span-8">
//                 <div className="grid gap-6">
//                   {/* ชื่อร้านค้า */}
//                   <FieldBlock
//                     label="ชื่อร้านค้า"
//                     required
//                     error={errors.shopName}
//                   >
//                     <Input
//                       value={shopName}
//                       onChange={(e) => setShopName(e.target.value)}
//                       maxLength={30}
//                       placeholder="เช่น zerroznice"
//                       disabled={loadingInitial}
//                     />
//                     <div className="mt-1 text-right text-xs text-gray-400">
//                       {shopName.length}/30
//                     </div>
//                   </FieldBlock>

//                   <Separator />

//                   {/* มีหน้าร้านไหม */}
//                   <FieldBlock label="หน้าร้าน">
//                     <div className="flex items-center gap-2">
//                       <Checkbox
//                         id="hasPhysicalStore"
//                         checked={hasPhysicalStore}
//                         onCheckedChange={(v) => setHasPhysicalStore(!!v)}
//                         disabled={loadingInitial}
//                       />
//                       <Label htmlFor="hasPhysicalStore" className="text-sm">
//                         มีหน้าร้าน (สามารถปักหมุดที่ตั้งได้)
//                       </Label>
//                     </div>
//                   </FieldBlock>

//                   <Separator />

//                   {/* ถ้ามีหน้าร้าน → แสดงที่อยู่ + แผนที่ */}
//                   {hasPhysicalStore && (
//                     <>
//                       <FieldBlock
//                         label="ที่อยู่ในการเข้ารับสินค้า"
//                         required
//                         error={errors.pickupAddress}
//                       >
//                         <Textarea
//                           rows={3}
//                           value={pickupAddress}
//                           onChange={(e) => setPickupAddress(e.target.value)}
//                           placeholder="บ้านเลขที่ / หมู่ / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"
//                           className="resize-none"
//                           disabled={loadingInitial}
//                         />
//                       </FieldBlock>

//                       <FieldBlock
//                         label="ปักหมุดตำแหน่ง"
//                         required
//                         error={errors.latlng}
//                       >
//                         <div className="grid gap-2">
//                           <div className="flex items-center gap-2">
//                             <Input
//                               placeholder="ค้นหาสถานที่ / ถนน / ตำบล"
//                               value={placeSearchText}
//                               onChange={(e) =>
//                                 setPlaceSearchText(e.target.value)
//                               }
//                               disabled={loadingInitial}
//                             />
//                             <MapPin className="h-5 w-5 text-gray-400" />
//                           </div>

//                           <MapPicker
//                             lat={lat}
//                             lng={lng}
//                             searchText={placeSearchText}
//                             onLatLngChange={(la, ln) => {
//                               setLat(la);
//                               setLng(ln);
//                             }}
//                             onPlaceResolved={(addr) => {
//                               if (addr) setPickupAddress(addr);
//                             }}
//                           />
//                         </div>
//                       </FieldBlock>

//                       <Separator />
//                     </>
//                   )}

//                   {/* อีเมล */}
//                   <FieldBlock label="อีเมล" required error={errors.email}>
//                     <Input
//                       type="email"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       placeholder="you@example.com"
//                       disabled={loadingInitial}
//                     />
//                   </FieldBlock>

//                   <Separator />

//                   {/* เบอร์โทร */}
//                   <FieldBlock
//                     label="หมายเลขโทรศัพท์"
//                     required
//                     error={errors.phone}
//                   >
//                     <Input
//                       type="tel"
//                       value={phone}
//                       onChange={(e) => setPhone(e.target.value)}
//                       placeholder="08xxxxxxxx"
//                       disabled={loadingInitial}
//                     />
//                   </FieldBlock>
//                 </div>
//               </div>
//             </div>
//           </CardContent>

//           <CardFooter className="flex justify-end border-t bg-gray-50 p-4">
//             <Button
//               className="bg-red-500 hover:bg-red-600"
//               disabled={!isValid || saving || loadingInitial}
//               onClick={handleSave}
//             >
//               <SaveIcon className="mr-2 h-4 w-4" />
//               {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
//             </Button>
//           </CardFooter>
//         </Card>
//       </div>
//     </div>
//   );
// }

// /* ======================== Shared Blocks ======================== */

// function FieldBlock({
//   label,
//   required,
//   error,
//   children,
// }: {
//   label: string;
//   required?: boolean;
//   error?: string | null;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="grid gap-2">
//       <Label className="text-sm">
//         {label} {required ? <span className="text-red-500">*</span> : null}
//       </Label>
//       {children}
//       {error ? <p className="text-xs text-red-500">{error}</p> : null}
//     </div>
//   );
// }

// /* ======================== MapPicker (Marker ปกติ) ======================== */

// function MapPicker({
//   lat,
//   lng,
//   onLatLngChange,
//   searchText,
//   onPlaceResolved,
// }: {
//   lat: number;
//   lng: number;
//   onLatLngChange: (lat: number, lng: number) => void;
//   searchText: string;
//   onPlaceResolved?: (address?: string) => void;
// }) {
//   const mapRef = useRef<HTMLDivElement | null>(null);
//   const mapObjRef = useRef<google.maps.Map | null>(null);
//   const markerRef = useRef<google.maps.Marker | null>(null);
//   const placesSvcRef = useRef<google.maps.places.PlacesService | null>(null);
//   const autocompleteSvcRef =
//     useRef<google.maps.places.AutocompleteService | null>(null);

//   // โหลดแผนที่ครั้งแรก
//   useEffect(() => {
//     const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
//     if (!apiKey || !mapRef.current) return;

//     let cancelled = false;

//     (async () => {
//       const loader = new Loader({
//         apiKey,
//         version: "weekly",
//         libraries: ["places"], // ใช้ Places อย่างเดียวพอ
//       });

//       await loader.load();
//       if (cancelled) return;

//       const center = { lat, lng };

//       // สร้าง Map
//       const map = new google.maps.Map(mapRef.current!, {
//         center,
//         zoom: 14,
//       });
//       mapObjRef.current = map;

//       // สร้าง Marker (ลากได้)
//       const marker = new google.maps.Marker({
//         map,
//         position: center,
//         draggable: true,
//       });
//       markerRef.current = marker;

//       // อัปเดตพิกัดเมื่อ dragend
//       marker.addListener("dragend", () => {
//         const pos = marker.getPosition();
//         if (pos) onLatLngChange(pos.lat(), pos.lng());
//       });

//       // อัปเดตพิกัดเมื่อคลิกที่แผนที่
//       map.addListener("click", (e: google.maps.MapMouseEvent) => {
//         if (!e.latLng) return;
//         marker.setPosition(e.latLng);
//         onLatLngChange(e.latLng.lat(), e.latLng.lng());
//       });

//       // Services
//       placesSvcRef.current = new google.maps.places.PlacesService(map);
//       autocompleteSvcRef.current = new google.maps.places.AutocompleteService();
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   // เมื่อ lat/lng เปลี่ยนจากภายนอก → อัปเดตแผนที่/หมุด
//   useEffect(() => {
//     const map = mapObjRef.current;
//     const marker = markerRef.current;
//     if (!map || !marker) return;

//     const pos = new google.maps.LatLng(lat, lng);
//     marker.setPosition(pos);
//     map.panTo(pos);
//   }, [lat, lng]);

//   // autocomplete แบบง่าย: พิมพ์แล้วเลือกผลลัพธ์ตัวแรก
//   useEffect(() => {
//     const svc = autocompleteSvcRef.current;
//     const places = placesSvcRef.current;
//     const map = mapObjRef.current;
//     const marker = markerRef.current;

//     if (!svc || !places || !map || !marker) return;
//     if (!searchText || searchText.trim().length < 3) return;

//     svc.getPlacePredictions(
//       { input: searchText, componentRestrictions: { country: ["th"] } },
//       (predictions) => {
//         if (!predictions || predictions.length === 0) return;

//         const first = predictions[0];
//         places.getDetails(
//           {
//             placeId: first.place_id,
//             fields: ["geometry", "formatted_address"],
//           },
//           (place, status) => {
//             if (
//               status === google.maps.places.PlacesServiceStatus.OK &&
//               place?.geometry?.location
//             ) {
//               const loc = place.geometry.location;
//               const newPos = new google.maps.LatLng(loc.lat(), loc.lng());
//               marker.setPosition(newPos);
//               map.panTo(newPos);
//               onLatLngChange(loc.lat(), loc.lng());
//               onPlaceResolved?.(place.formatted_address || undefined);
//             }
//           },
//         );
//       },
//     );
//   }, [searchText, onLatLngChange, onPlaceResolved]);

//   return (
//     <div className="grid gap-2">
//       <div
//         ref={mapRef}
//         className="h-[320px] w-full overflow-hidden rounded-md border"
//       />
//       <p className="text-muted-foreground text-xs">
//         เคล็ดลับ: คลิกบนแผนที่หรือลากหมุดเพื่อปรับตำแหน่งให้ตรงที่สุด
//       </p>
//     </div>
//   );
// }

// /* ---------------- helpers ---------------- */
// async function pickError(res: Response, fallback: string) {
//   try {
//     const j = await res.json();
//     return j?.message || fallback;
//   } catch {
//     const t = await res.text();
//     return t || fallback;
//   }
// }
