"use client";

import { useUser } from "@/store/user-store";
import { Button } from "../ui/button";
import { Edit } from "lucide-react";

import Link from "next/link";

const EditRestaurantButton = () => {
  const { user } = useUser();

  if (user?.role !== "RestaurantOwner") {
    return null;
  }

  return (
    <Button asChild>
      <Link href={`/restaurants/edit`}>
        <Edit />
        <span>แก้ไข</span>
      </Link>
    </Button>
  );
};
export default EditRestaurantButton;
