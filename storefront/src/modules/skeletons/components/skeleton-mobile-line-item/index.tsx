const SkeletonMobileLineItem = () => {
  return (
    <div className="border border-ui-border-base rounded-lg p-4 bg-ui-bg-subtle animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Thumbnail skeleton */}
        <div className="w-16 h-16 bg-ui-bg-base rounded flex-shrink-0"></div>

        {/* Content skeleton */}
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-ui-bg-base rounded mb-2"></div>
          <div className="h-3 bg-ui-bg-base rounded w-3/4"></div>
        </div>

        {/* Delete button skeleton */}
        <div className="w-6 h-6 bg-ui-bg-base rounded flex-shrink-0"></div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Quantity skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 bg-ui-bg-base rounded"></div>
          <div className="w-20 h-8 bg-ui-bg-base rounded"></div>
        </div>

        {/* Price skeleton */}
        <div className="text-right">
          <div className="h-4 w-16 bg-ui-bg-base rounded mb-1"></div>
          <div className="h-3 w-12 bg-ui-bg-base rounded"></div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonMobileLineItem
