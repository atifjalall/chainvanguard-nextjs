import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/_ui/card";
import { Skeleton } from "@/components/_ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Image Skeleton */}
      <div className="aspect-square">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Content Skeleton */}
      <CardHeader className="p-4 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      </CardHeader>

      {/* Footer Skeleton */}
      <CardFooter className="p-4 pt-2 flex flex-col gap-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

export function ProductCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
