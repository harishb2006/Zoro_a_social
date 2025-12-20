export function PostCardSkeleton() {
  return (
    <div className="bg-white border border-gray-300 rounded-sm mb-6 animate-pulse">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gray-300 rounded-full"></div>
          <div>
            <div className="h-4 w-24 bg-gray-300 rounded mb-1"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-4 w-4 bg-gray-300 rounded"></div>
      </div>
      <div className="w-full bg-gray-300" style={{ aspectRatio: '1/1' }}></div>
      <div className="px-4 py-2 flex items-center gap-4">
        <div className="h-6 w-6 bg-gray-300 rounded"></div>
        <div className="h-6 w-6 bg-gray-300 rounded"></div>
        <div className="h-6 w-6 bg-gray-300 rounded"></div>
        <div className="h-6 w-6 bg-gray-300 rounded ml-auto"></div>
      </div>
      <div className="px-4 pb-2">
        <div className="h-4 w-20 bg-gray-300 rounded"></div>
      </div>
      <div className="px-4 pb-2">
        <div className="h-4 w-full bg-gray-300 rounded mb-1"></div>
        <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        <div className="h-4 w-24 bg-gray-300 rounded"></div>
      </div>
      <div className="h-8 w-20 bg-gray-300 rounded-full"></div>
    </div>
  );
}
