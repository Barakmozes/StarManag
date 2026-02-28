export default function Loading() {
  return (
    <div className="flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-gray-200" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
