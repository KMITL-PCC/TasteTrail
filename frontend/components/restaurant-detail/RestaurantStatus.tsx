"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { RestaurantInfo } from "@/types/restaurant";
import { useUser } from "@/store/user-store";
import { usePathname, useRouter } from "next/navigation";

const RestaurantStatus = ({ status }: { status: RestaurantInfo["status"] }) => {
  const [restaurantStatus, setRestaurantStatus] = useState(status);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/")[2];

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/csrf-token`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!res.ok) {
          console.log("Failed to fetch CSRF token");
        }

        const { csrfToken } = await res.json();

        setCsrfToken(csrfToken);
      } catch (err) {
        console.log("Failed to fetch CSRF token");
      }
    };

    fetchCsrfToken();
  }, []);

  useEffect(() => {
    const onStatusChange = async () => {
      if (!csrfToken) return;

      try {
        setIsLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/account/updateStatus`,
          {
            credentials: "include",
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify({ status: restaurantStatus }),
          },
        );

        if (!res.ok) {
          console.error("Failed to update restaurant status" + res.status);
        }
      } catch (err) {
        console.error("Failed to update restaurant status" + err);
      } finally {
        setIsLoading(false);
        router.refresh();
      }
    };

    onStatusChange();
  }, [restaurantStatus]);

  if (user?.role === "RestaurantOwner" && user?.restaurantId === id) {
    return (
      <Select
        value={restaurantStatus}
        onValueChange={setRestaurantStatus}
        disabled={isLoading}
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
          <SelectValue placeholder="สถานะ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Open">เปิด</SelectItem>
          <SelectItem value="Closed">ปิด</SelectItem>
          <SelectItem value="Temporarily_Closed">ปิดชั่วคราว</SelectItem>
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
      <span>
        {restaurantStatus === "Open"
          ? "เปิด"
          : restaurantStatus === "Closed"
            ? "ปิด"
            : "ปิดชั่วคราว"}
      </span>
    </div>
  );
};
export default RestaurantStatus;
