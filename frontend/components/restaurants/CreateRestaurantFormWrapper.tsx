// /components/restaurants/CreateRestaurantFormWrapper.tsx
"use client"; // 🔹 ต้องมี "use client"

// ใช้ dynamic import สำหรับฟอร์มจริง
import dynamic from "next/dynamic";

const CreateRestaurantFormClient = dynamic(
  () => import("./CreateRestaurantFormClient"),
  { ssr: false },
);

export default function CreateRestaurantFormWrapper() {
  return <CreateRestaurantFormClient />;
}
