import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

const SecondaryRestaurantCardSkeleton = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <Card className={cn("h-full gap-4 pt-0 pb-4", className)}>
      <CardHeader className="flex flex-1 flex-col gap-2 p-0">
        {/* Image skeleton */}
        <div className="relative h-30 w-full md:h-40">
          <Skeleton className="size-full rounded-t-lg" />
        </div>
        {/* Title skeleton */}
        <CardTitle className="w-full px-6 text-base font-medium">
          <Skeleton className="h-6 w-3/4" />
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground flex flex-col items-start gap-2 px-6 text-start text-sm md:flex-row md:items-center">
        {/* Rating skeleton */}
        <div className="flex items-center gap-1 rounded-md px-1.5 py-0.5">
          <Skeleton className="h-5 w-8" />
        </div>
        {/* Reviews count skeleton */}
        <Skeleton className="h-4 w-16" />
      </CardContent>
    </Card>
  );
};

export default SecondaryRestaurantCardSkeleton;
