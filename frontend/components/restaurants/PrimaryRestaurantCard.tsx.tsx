import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Restaurant } from "@/types/restaurant";
import { Skeleton } from "../ui/skeleton";
import { Star } from "lucide-react";

import Image from "next/image";

const PrimaryRestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => {
  return (
    <Card className="gap-2">
      <CardHeader className="flex flex-col gap-2">
        {restaurant.images.length > 0 ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="relative w-full border border-border h-45 rounded-xl md:h-55">
              <Image
                src={restaurant.images[0]}
                alt={restaurant.name}
                fill
                className="object-cover rounded-xl"
              />
            </div>
            <div className="relative w-full border border-border h-45 rounded-xl md:h-55">
              <Image
                src={restaurant.images[1]}
                alt={restaurant.name}
                fill
                className="object-cover rounded-xl"
              />
            </div>
            <div className="relative hidden w-full border border-border h-45 rounded-xl md:h-55 lg:block">
              <Image
                src={restaurant.images[2]}
                alt={restaurant.name}
                fill
                className="object-cover rounded-xl"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="relative w-full border border-border h-35 rounded-xl md:h-45 lg:h-55">
              <Skeleton className="size-full" />
            </div>
            <div className="relative w-full border border-border h-35 rounded-xl md:h-45 lg:h-55">
              <Skeleton className="size-full" />
            </div>
            <div className="relative hidden w-full border border-border h-35 rounded-xl md:h-45 lg:block lg:h-55">
              <Skeleton className="size-full" />
            </div>
          </div>
        )}
        <CardTitle className="text-base font-medium">
          {restaurant.name}
        </CardTitle>
        <CardDescription>{restaurant.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
        <p className="bg-destructive text-card flex items-center gap-1 rounded-md px-1.5 py-0.5">
          {restaurant.avgRating}
          <Star className="fill-card size-3" />
        </p>
        <p>{restaurant.totalReviews} รีวิว</p>
        {restaurant.status === "Open" ? (
          <p className="text-green-500">เปิด</p>
        ) : restaurant.status === "Closed" ? (
          <p className="text-destructive">ปิด</p>
        ) : (
          <p className="text-yellow-500">ปิดชั่วคราว</p>
        )}
      </CardContent>
    </Card>
  );
};
export default PrimaryRestaurantCard;
