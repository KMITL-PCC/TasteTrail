import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/lib/utils";
import { PopularRestaurant } from "@/types/restaurant";
import { Skeleton } from "../ui/skeleton";
import { Star } from "lucide-react";

const SecondaryRestaurantCard = ({
  className,
  popularRestaurant,
}: {
  className?: string;
  popularRestaurant: PopularRestaurant;
}) => {
  return (
    <Card className={cn("h-full gap-4 pt-0 pb-4", className)}>
      <CardHeader className="flex flex-col flex-1 gap-2 p-0">
        <div className="relative w-full h-30 md:h-40">
          {popularRestaurant?.image_url ? (
            <Image
              src={popularRestaurant.image_url}
              alt={popularRestaurant.name}
              fill
              className="object-cover rounded-t-lg"
            />
          ) : (
            <Skeleton className="size-full" />
          )}
        </div>
        <CardTitle className="w-full px-6 text-base font-medium truncate">
          {popularRestaurant.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-2 px-6 text-sm text-muted-foreground text-start md:flex-row md:items-center">
        <p className="bg-destructive text-card flex items-center gap-1 rounded-md px-1.5 py-0.5">
          {popularRestaurant.avg_rating}
          <Star className="fill-card size-3" />
        </p>
        <p>{popularRestaurant.total_reviews} รีวิว</p>
      </CardContent>
    </Card>
  );
};
export default SecondaryRestaurantCard;
