"use client";

import RestaurantEditForm from "@/components/restaurants/RestaurantEditForm";
import BreadcrumbComponent from "@/components/BreadcrumbComponent";
import { getRestaurantById } from "@/lib/api/restaurant";
import { useEffect, useState, use } from "react";
import { RestaurantInfo } from "@/types/restaurant";
import { useUser } from "@/store/user-store";
import { useRouter } from "next/navigation";

const RestaurantEditPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const { id } = use(params);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await getRestaurantById(id);
        setRestaurantInfo(data.restaurantInfo);
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [id]);

  if (user?.role !== "RestaurantOwner" && user?.restaurantId !== id) {
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!restaurantInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Restaurant not found
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1150px] flex-col gap-2 p-4 pt-2 md:p-8 md:pt-2">
      <BreadcrumbComponent restaurantName={restaurantInfo.name} />
      <RestaurantEditForm restaurantId={id} />
    </div>
  );
};

export default RestaurantEditPage;
