import { Skeleton } from "@/components/ui/skeleton";

const ReviewCardSkeleton = () => {
  return (
    <div className="flex items-start gap-3 max-[425px]:gap-2">
      {/* Avatar skeleton */}
      <div className="h-12 w-12 max-[425px]:h-10 max-[425px]:w-10">
        <Skeleton className="rounded-full size-full" />
      </div>

      <div className="flex-1">
        {/* User name skeleton */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-24 max-[425px]:h-4 max-[425px]:w-20" />
        </div>

        {/* Rating and date skeleton */}
        <div className="mb-2 flex items-center gap-2 max-[425px]:flex-wrap">
          {/* Star rating skeleton */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="w-4 h-4" />
            ))}
          </div>
          {/* Date skeleton */}
          <Skeleton className="h-4 w-16 max-[425px]:h-3 max-[425px]:w-12" />
        </div>

        {/* Review content skeleton */}
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-full max-[425px]:h-3" />
          <Skeleton className="h-4 w-3/4 max-[425px]:h-3" />
          <Skeleton className="h-4 w-1/2 max-[425px]:h-3" />
        </div>

        {/* Review images skeleton */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="rounded-lg size-full lg:size-40" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewCardSkeleton;
