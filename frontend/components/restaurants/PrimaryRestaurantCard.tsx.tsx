import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { RestaurantProps } from "@/types";
import { Skeleton } from "../ui/skeleton";

import Image from "next/image";

const PrimaryRestaurantCard = ({
  restaurant,
}: {
  restaurant: RestaurantProps;
}) => {
  return (
    <Card className="gap-2">
      <CardHeader className="flex flex-col gap-2">
        {restaurant.images.length > 0 ? (
          <div className="flex w-full items-center justify-between gap-2">
            <div className="border-border relative h-45 w-full rounded-xl border md:h-55">
              <Image
                src={restaurant.images[0]}
                alt={restaurant.name}
                fill
                className="rounded-xl object-cover"
              />
            </div>
            <div className="border-border relative h-45 w-full rounded-xl border md:h-55">
              <Image
                src={restaurant.images[1]}
                alt={restaurant.name}
                fill
                className="rounded-xl object-cover"
              />
            </div>
            <div className="border-border relative hidden h-45 w-full rounded-xl border md:h-55 lg:block">
              <Image
                src={restaurant.images[2]}
                alt={restaurant.name}
                fill
                className="rounded-xl object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-2">
            <div className="border-border relative h-45 w-full rounded-xl border md:h-55">
              <Skeleton className="size-full" />
            </div>
            <div className="border-border relative h-45 w-full rounded-xl border md:h-55">
              <Skeleton className="size-full" />
            </div>
            <div className="border-border relative hidden h-45 w-full rounded-xl border md:h-55 lg:block">
              <Skeleton className="size-full" />
            </div>
          </div>
        )}
        <CardTitle className="text-base font-medium">
          {restaurant.name}
        </CardTitle>
        <CardDescription>{restaurant.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-between gap-2 text-sm">
        <p>{restaurant.avgRating} ⭐</p>
        <p>{restaurant.totalReviews} reviews</p>
      </CardContent>
    </Card>
  );
};
export default PrimaryRestaurantCard;
