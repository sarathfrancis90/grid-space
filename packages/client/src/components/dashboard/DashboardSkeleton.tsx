interface DashboardSkeletonProps {
  viewMode: "grid" | "list";
}

export function DashboardSkeleton({ viewMode }: DashboardSkeletonProps) {
  if (viewMode === "grid") {
    return (
      <div
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        data-testid="dashboard-skeleton"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-gray-200 bg-white"
          >
            <div className="h-36 rounded-t-xl bg-gray-100" />
            <div className="p-4">
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm"
      data-testid="dashboard-skeleton"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 px-4 py-3.5"
        >
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="h-4 flex-1 rounded bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
