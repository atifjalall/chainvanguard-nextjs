export function LandingSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header Skeleton */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16 h-16 flex items-center justify-between">
          <div className="h-5 w-36 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <nav
            className="flex items-center gap-4"
            aria-label="Main navigation"
          />
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900" />

        <div className="relative z-10 max-w-[1600px] mx-auto px-12 lg:px-16 text-center">
          <div className="space-y-12">
            {/* Badge skeleton */}
            <div className="inline-block">
              <div className="h-px w-16 bg-gray-200 dark:bg-gray-800 mb-4 mx-auto animate-pulse" />
              <div className="h-2 w-56 bg-gray-200 dark:bg-gray-800 mx-auto rounded animate-pulse" />
            </div>

            {/* Headline skeleton - exact text size */}
            <div className="space-y-4">
              <div className="h-24 lg:h-32 w-[600px] max-w-full bg-gray-200 dark:bg-gray-800 mx-auto rounded animate-pulse" />
              <div className="h-20 lg:h-28 w-[500px] max-w-full bg-gray-200 dark:bg-gray-800 mx-auto rounded animate-pulse" />
            </div>

            {/* Subheadline skeleton */}
            <div className="space-y-2 max-w-2xl mx-auto">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-800 mx-auto rounded animate-pulse" />
            </div>

            {/* CTA Buttons skeleton - exact button size */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
              <div className="h-12 w-[200px] bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-12 w-[120px] bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <div className="h-2 w-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="w-px h-16 bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 dark:to-transparent" />
        </div>
      </section>

      {/* Features Section Skeleton */}
      <section className="py-32 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="mb-20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-2 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="h-14 w-80 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 dark:bg-gray-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-950 p-12">
                <div className="h-7 w-7 bg-gray-200 dark:bg-gray-800 rounded mb-8 animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-3 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section Skeleton */}
      <section className="py-32 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="mb-20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-2 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="h-14 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-8"
              >
                <div className="h-7 w-7 bg-gray-200 dark:bg-gray-800 rounded mb-8 animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded mb-3 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Skeleton */}
      <section className="py-32 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-16 bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="h-2 w-28 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
                <div className="h-11 w-80 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>

              <div className="space-y-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-6">
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-800 rounded flex-shrink-0 mt-1 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded mb-2 animate-pulse" />
                      <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative w-full max-w-[620px] mx-auto aspect-square">
              <div className="absolute inset-8 bg-gray-100 dark:bg-gray-900 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section Skeleton */}
      <section className="py-32 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-12 lg:px-16 text-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="h-14 w-3/4 bg-gray-200 dark:bg-gray-800 mx-auto rounded animate-pulse" />
              <div className="space-y-2 max-w-2xl mx-auto">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-800 mx-auto rounded animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-12 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Skeleton */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex flex-col items-center space-y-8">
            <div className="h-6 w-36 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="space-y-2 max-w-md mx-auto w-full">
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-800 mx-auto rounded animate-pulse" />
            </div>
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"
                />
              ))}
            </div>
            <div className="h-2 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse pt-8 border-t border-gray-200 dark:border-gray-800" />
          </div>
        </div>
      </footer>
    </div>
  );
}
