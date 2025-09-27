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
          {/* <div className="relative hidden w-full border border-border h-30 rounded-xl md:h-40 lg:block">
            <Image
              src={restaurant.images[3]}
              alt={restaurant.name}
              fill
              className="object-cover rounded-xl"
            />
          </div> */}
        </div>
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
