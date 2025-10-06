// page.tsx
"use client";

import CreateRestaurantFormClient from "@/components/restaurants/CreateRestaurantFormClient";
import { Suspense } from "react";

export default function RestaurantCreatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateRestaurantFormClient />
    </Suspense>
  );
}
