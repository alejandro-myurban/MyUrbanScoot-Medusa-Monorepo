const SkeletonCompactItem = () => {
  return (
    <div className="flex gap-3 p-3 rounded-xl border border-gray-200/60 bg-white/70 backdrop-blur-sm animate-pulse">
      {/* Skeleton de imagen */}
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-lg bg-gray-200"></div>
      </div>

      {/* Skeleton de contenido */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Skeleton de título y precio */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="flex-shrink-0">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>

        {/* Skeleton de controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonCompactItem