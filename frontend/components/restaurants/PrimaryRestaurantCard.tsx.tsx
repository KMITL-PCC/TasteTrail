import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { RestaurantProps } from "@/types";

import Image from "next/image";

const PrimaryRestaurantCard = ({
  restaurant,
}: {
  restaurant: RestaurantProps;
}) => {
  return (
    <Card className="gap-2">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="border-border relative h-30 w-full rounded-xl border md:h-40">
            <Image
              src={restaurant.images[0]}
              alt={restaurant.name}
              fill
              className="rounded-xl object-cover"
            />
          </div>
          <div className="border-border relative h-30 w-full rounded-xl border md:h-40">
            <Image
              src={restaurant.images[1]}
              alt={restaurant.name}
              fill
              className="rounded-xl object-cover"
            />
          </div>
          <div className="border-border relative hidden h-30 w-full rounded-xl border md:block md:h-40">
            <Image
              src={restaurant.images[2]}
              alt={restaurant.name}
              fill
              className="rounded-xl object-cover"
            />
          </div>
          <div className="border-border relative hidden h-30 w-full rounded-xl border md:h-40 lg:block">
            <Image
              src={restaurant.images[3]}
              alt={restaurant.name}
              fill
              className="rounded-xl object-cover"
            />
          </div>
        </div>
        <CardTitle>{restaurant.name}</CardTitle>
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
