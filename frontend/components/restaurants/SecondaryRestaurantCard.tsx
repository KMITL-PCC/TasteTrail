import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/lib/utils";
import { RestaurantProps } from "@/types";

const SecondaryRestaurantCard = ({
  className,
  restaurant,
}: {
  className?: string;
  restaurant?: RestaurantProps;
}) => {
  return (
    <Card className={cn("gap-2 pt-0", className)}>
      <CardHeader className="flex flex-col gap-2 p-0">
        <div className="relative w-full h-30 md:h-40">
          <Image
            src={restaurant?.images[0] || ""}
            alt={restaurant?.name || ""}
            fill
            className="object-cover rounded-t-lg"
          />
        </div>
        <CardTitle className="px-6">{restaurant?.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2 px-6 text-sm">
        <p>Star {restaurant?.avgRating}</p>
        <p>Review {restaurant?.totalReviews}</p>
      </CardContent>
    </Card>
  );
};
export default SecondaryRestaurantCard;
