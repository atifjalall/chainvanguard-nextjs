import { Skeleton } from "@/components/ui/skeleton";

const skeletonClass = "bg-gray-300 dark:bg-gray-700";

export default function SupplierInsightsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950 p-6 space-y-8">
      {/* Header Skeleton */}
      <div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <Skeleton className={`h-7 w-64 ${skeletonClass}`} />
            <Skeleton className={`h-5 w-96 mt-2 ${skeletonClass}`} />
            <div className="flex items-center gap-2 mt-3">
              <Skeleton className={`h-6 w-32 rounded-full ${skeletonClass}`} />
              <Skeleton className={`h-6 w-32 rounded-full ${skeletonClass}`} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className={`h-10 w-40 rounded-md ${skeletonClass}`} />
            <Skeleton className={`h-10 w-24 rounded-md ${skeletonClass}`} />
            <Skeleton className={`h-10 w-24 rounded-md ${skeletonClass}`} />
          </div>
        </div>
      </div>

      {/* Key Metrics Skeleton */}
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

      {/* Tabs Skeleton */}
      <div className="flex items-center justify-center">
        <div className="grid w-full max-w-2xl grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-10 w-full rounded-md ${skeletonClass}`}
            />
          ))}
        </div>
      </div>

      {/* Charts/Card Skeletons */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-lg p-4"
            >
              <Skeleton className={`h-6 w-48 mb-2 ${skeletonClass}`} />
              <Skeleton className={`h-4 w-64 mb-6 ${skeletonClass}`} />
              <Skeleton className={`h-72 w-full rounded-lg ${skeletonClass}`} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-lg p-4">
            <Skeleton className={`h-6 w-48 mb-2 ${skeletonClass}`} />
            <Skeleton className={`h-4 w-64 mb-6 ${skeletonClass}`} />
            <Skeleton className={`h-72 w-full rounded-lg ${skeletonClass}`} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-lg p-4">
            <Skeleton className={`h-6 w-48 mb-2 ${skeletonClass}`} />
            <Skeleton className={`h-4 w-64 mb-6 ${skeletonClass}`} />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={`h-16 w-full rounded-lg ${skeletonClass}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-lg p-4">
            <Skeleton className={`h-6 w-48 mb-2 ${skeletonClass}`} />
            <Skeleton className={`h-4 w-64 mb-6 ${skeletonClass}`} />
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className={`h-4 w-40 mb-2 ${skeletonClass}`} />
                  <Skeleton className={`h-4 w-64 mb-2 ${skeletonClass}`} />
                  <Skeleton
                    className={`h-2 w-full rounded-full ${skeletonClass}`}
                  />
                  <Skeleton className={`h-4 w-24 mt-2 ${skeletonClass}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
