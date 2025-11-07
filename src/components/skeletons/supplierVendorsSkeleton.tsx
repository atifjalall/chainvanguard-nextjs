import { Skeleton } from "@/components/_ui/skeleton";

const skeletonClass = "bg-gray-300 dark:bg-gray-700";

export default function SupplierVendorsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      <div className="relative z-10 p-6 space-y-6">
        {/* Header Skeleton */}
        <div>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <Skeleton className={`h-7 w-56 ${skeletonClass}`} />
              <Skeleton className={`h-5 w-80 ${skeletonClass}`} />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className={`h-10 w-24 rounded-md ${skeletonClass}`} />
              <Skeleton className={`h-10 w-24 rounded-md ${skeletonClass}`} />
            </div>
          </div>
        </div>

        {/* Statistics Cards Skeleton */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-lg p-4 h-40 flex flex-col justify-between space-y-3"
              >
                <div className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className={`h-4 w-24 ${skeletonClass}`} />
                  <Skeleton
                    className={`h-10 w-10 rounded-full ${skeletonClass}`}
                  />
                </div>
                <Skeleton className={`h-6 w-24 mb-1 ${skeletonClass}`} />
                <Skeleton className={`h-4 w-32 ${skeletonClass}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Filters Card Skeleton */}
        <div>
          <div className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className={`h-8 w-8 rounded-full ${skeletonClass}`} />
              <Skeleton className={`h-5 w-32 ${skeletonClass}`} />
            </div>
            <Skeleton className={`h-4 w-48 mb-4 ${skeletonClass}`} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Skeleton className={`h-12 w-full ${skeletonClass}`} />
              <Skeleton className={`h-12 w-full ${skeletonClass}`} />
              <Skeleton className={`h-12 w-full ${skeletonClass}`} />
            </div>
            <div className="flex gap-2 items-center">
              <Skeleton className={`h-6 w-24 rounded-full ${skeletonClass}`} />
              <Skeleton className={`h-6 w-24 rounded-full ${skeletonClass}`} />
              <Skeleton className={`h-4 w-32 ${skeletonClass}`} />
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex justify-center mt-6">
          <div className="grid max-w-2xl w-full grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className={`h-10 w-full rounded-md ${skeletonClass}`}
              />
            ))}
          </div>
        </div>

        {/* Vendor Grid Skeleton */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-lg p-6 flex flex-col gap-6"
              >
                <div className="flex items-start gap-4">
                  <Skeleton
                    className={`h-12 w-12 rounded-full ${skeletonClass}`}
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className={`h-4 w-32 ${skeletonClass}`} />
                    <Skeleton className={`h-3 w-40 ${skeletonClass}`} />
                    <Skeleton className={`h-4 w-24 ${skeletonClass}`} />
                  </div>
                </div>
                <div className="space-y-3">
                  <Skeleton className={`h-4 w-40 ${skeletonClass}`} />
                  <Skeleton className={`h-4 w-32 ${skeletonClass}`} />
                  <div className="flex gap-2">
                    <Skeleton
                      className={`h-4 w-16 rounded-full ${skeletonClass}`}
                    />
                    <Skeleton
                      className={`h-4 w-12 rounded-full ${skeletonClass}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton
                    className={`h-10 w-full rounded-lg ${skeletonClass}`}
                  />
                  <Skeleton
                    className={`h-10 w-full rounded-lg ${skeletonClass}`}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className={`h-4 w-32 ${skeletonClass}`} />
                  <Skeleton
                    className={`h-8 w-20 rounded-md ${skeletonClass}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
