"use client";

import { Suspense } from "react";
import RestaurantcreateForm from "@/components/restaurants/RestaurantcreateForm";
import { useUser } from "@/store/user-store";
import { useRouter } from "next/navigation";

const Restaurantcreatepage = () => {
  const { user } = useUser();
  const router = useRouter();

  if (user?.role === "RestaurantOwner") {
    router.push("/");
  }

  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <RestaurantcreateForm />
    </Suspense>
  );
};

export default Restaurantcreatepage;
