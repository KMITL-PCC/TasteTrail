import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const PrimaryRestaurantCardSkeleton = () => {
  return (
    <Card className="gap-2">
      <CardHeader className="flex flex-col gap-2">
        {/* Image skeletons - 3 images in a row */}
        <div className="flex items-center justify-between w-full gap-2">
          <div className="relative w-full border border-border h-45 rounded-xl md:h-55">
            <Skeleton className="size-full rounded-xl" />
          </div>
          <div className="relative w-full border border-border h-45 rounded-xl md:h-55">
            <Skeleton className="size-full rounded-xl" />
          </div>
          <div className="relative hidden w-full border border-border h-45 rounded-xl md:h-55 lg:block">
            <Skeleton className="size-full rounded-xl" />
          </div>
        </div>

        {/* Title skeleton */}
        <Skeleton className="w-3/4 h-6" />
      </CardHeader>

      <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
        {/* Rating skeleton */}
        <div className="flex items-center gap-1 rounded-md px-1.5 py-0.5">
          <Skeleton className="w-8 h-5" />
        </div>

        {/* Reviews count skeleton */}
        <Skeleton className="w-16 h-4" />

        {/* Status skeleton */}
        <Skeleton className="w-12 h-4" />
      </CardContent>
    </Card>
  );
};

export default PrimaryRestaurantCardSkeleton;
