"use client";

import { Suspense } from "react";
import RestaurantcreateForm from "@/components/restaurants/RestaurantcreateForm";

const Restaurantcreatepage = () => {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <RestaurantcreateForm />
    </Suspense>
  );
};

export default Restaurantcreatepage;
