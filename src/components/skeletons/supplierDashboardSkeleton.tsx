import { Skeleton } from "@/components/_ui/skeleton";

const skeletonClass = "bg-gray-300 dark:bg-gray-700";

export default function SupplierDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      <div className="relative z-10 p-6 space-y-6">
        {/* Header Skeleton */}
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className={`h-8 w-56 ${skeletonClass}`} />
              <Skeleton className={`h-5 w-72 ${skeletonClass}`} />
              <div className="flex items-center gap-2 mt-2">
                <Skeleton
                  className={`h-6 w-32 rounded-full ${skeletonClass}`}
                />
                <Skeleton
                  className={`h-6 w-28 rounded-full ${skeletonClass}`}
                />
                <Skeleton
                  className={`h-6 w-40 rounded-full ${skeletonClass}`}
                />
              </div>
            </div>
            <Skeleton className={`h-10 w-44 rounded-md ${skeletonClass}`} />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-lg p-4 space-y-3 h-44 flex flex-col justify-between"
              >
                <div className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className={`h-4 w-24 ${skeletonClass}`} />
                  <Skeleton
                    className={`h-10 w-10 rounded-full ${skeletonClass}`}
                  />
                </div>
                <Skeleton className={`h-6 w-20 mb-1 ${skeletonClass}`} />
                <Skeleton className={`h-4 w-28 ${skeletonClass}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Activity Skeleton */}
            <div className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl xl:col-span-2 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className={`h-8 w-8 rounded-full ${skeletonClass}`} />
                <Skeleton className={`h-5 w-32 ${skeletonClass}`} />
              </div>
              <Skeleton className={`h-4 w-48 mb-4 ${skeletonClass}`} />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-gray-50/80 dark:bg-gray-800/60 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
                  >
                    <Skeleton
                      className={`h-10 w-10 rounded-full ${skeletonClass}`}
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className={`h-4 w-40 ${skeletonClass}`} />
                      <Skeleton className={`h-3 w-64 ${skeletonClass}`} />
                      <Skeleton className={`h-3 w-32 ${skeletonClass}`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Skeleton
                  className={`h-8 w-44 rounded-md mx-auto ${skeletonClass}`}
                />
              </div>
            </div>

            {/* Performance Overview Skeleton */}
            <div className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-lg p-4 space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <Skeleton className={`h-4 w-24 ${skeletonClass}`} />
                    <Skeleton className={`h-4 w-20 ${skeletonClass}`} />
                  </div>
                  <Skeleton className={`h-2 w-full ${skeletonClass}`} />
                  <Skeleton className={`h-3 w-32 mt-1 ${skeletonClass}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section Skeleton */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Vendors Skeleton */}
            <div className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className={`h-8 w-8 rounded-full ${skeletonClass}`} />
                <Skeleton className={`h-5 w-32 ${skeletonClass}`} />
              </div>
              <Skeleton className={`h-4 w-48 mb-4 ${skeletonClass}`} />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-gray-50/80 dark:bg-gray-800/60 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
                  >
                    <Skeleton
                      className={`h-12 w-12 rounded-full ${skeletonClass}`}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <Skeleton className={`h-4 w-32 ${skeletonClass}`} />
                        <Skeleton
                          className={`h-5 w-20 rounded-full ${skeletonClass}`}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <Skeleton className={`h-3 w-16 ${skeletonClass}`} />
                        <Skeleton className={`h-3 w-12 ${skeletonClass}`} />
                        <Skeleton className={`h-3 w-10 ${skeletonClass}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products Skeleton */}
            <div className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className={`h-8 w-8 rounded-full ${skeletonClass}`} />
                <Skeleton className={`h-5 w-32 ${skeletonClass}`} />
              </div>
              <Skeleton className={`h-4 w-48 mb-4 ${skeletonClass}`} />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-gray-50/80 dark:bg-gray-800/60 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
                  >
                    <Skeleton
                      className={`h-12 w-12 rounded-lg ${skeletonClass}`}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <Skeleton className={`h-4 w-32 ${skeletonClass}`} />
                        <Skeleton
                          className={`h-5 w-20 rounded-full ${skeletonClass}`}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <Skeleton className={`h-3 w-16 ${skeletonClass}`} />
                        <Skeleton className={`h-3 w-12 ${skeletonClass}`} />
                        <Skeleton className={`h-3 w-10 ${skeletonClass}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div>
          <div className="border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-lg mt-6 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className={`h-8 w-8 rounded-full ${skeletonClass}`} />
              <Skeleton className={`h-5 w-32 ${skeletonClass}`} />
            </div>
            <Skeleton className={`h-4 w-48 mb-4 ${skeletonClass}`} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 flex flex-col gap-3 items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <Skeleton
                    className={`h-12 w-12 rounded-full mb-2 ${skeletonClass}`}
                  />
                  <Skeleton className={`h-4 w-24 mb-1 ${skeletonClass}`} />
                  <Skeleton className={`h-3 w-20 ${skeletonClass}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
