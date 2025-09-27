"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { RestaurantInfoProps } from "@/types";
import { useUser } from "@/store/user-store";

const RestaurantStatus = ({
  status,
}: {
  status: RestaurantInfoProps["status"];
}) => {
  const [restaurantStatus, setRestaurantStatus] = useState(status);
  const { user } = useUser();

  if (user?.role === "RestaurantOwner") {
    return (
      <Select
        defaultValue={restaurantStatus}
        onValueChange={setRestaurantStatus}
      >
        <SelectTrigger
          className={cn(
            restaurantStatus === "Open"
              ? "bg-green-500/10 text-green-500"
              : restaurantStatus === "Closed"
                ? "text-destructive bg-destructive/10"
                : "bg-yellow-500/10 text-yellow-500",
            "rounded-md px-2 py-1 text-sm",
          )}
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Open">Open</SelectItem>
          <SelectItem value="Closed">Closed</SelectItem>
          <SelectItem value="Temporarily_Closed">Temporarily Closed</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <div
      className={cn(
        restaurantStatus === "Open"
          ? "bg-green-500/10 text-green-500"
          : restaurantStatus === "Closed"
            ? "text-destructive bg-destructive/10"
            : "bg-yellow-500/10 text-yellow-500",
        "rounded-md px-2 py-1 text-sm",
      )}
    >
      <span>{restaurantStatus}</span>
    </div>
  );
};
export default RestaurantStatus;
