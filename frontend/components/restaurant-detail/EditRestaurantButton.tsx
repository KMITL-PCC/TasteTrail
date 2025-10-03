"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@/store/user-store";
import { Button } from "../ui/button";
import { Edit } from "lucide-react";

import Link from "next/link";

const EditRestaurantButton = () => {
  const pathname = usePathname();
  const id = pathname.split("/")[2];
  const { user } = useUser();

  if (user?.role === "RestaurantOwner" && user?.restaurantId === id) {
    return (
      <Button asChild>
        <Link href={`/restaurants/${id}/edit`}>
          <Edit />
          <span>แก้ไข</span>
        </Link>
      </Button>
    );
  }

  return null;
};
export default EditRestaurantButton;
