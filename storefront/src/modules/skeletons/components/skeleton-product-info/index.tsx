const ProductInfoSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      {/* Título del producto skeleton */}
      <div className="h-8 bg-gray-200 rounded-md mb-4 w-3/4"></div>
      
      {/* Precio skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-4"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
      
      {/* Descripción skeleton - múltiples líneas */}
      <div className="space-y-3 mb-6">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-11/12"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-11/12"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
      
      {/* Selector de opciones skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded-full w-4"></div>
        </div>
        
        {/* Botones de opciones skeleton */}
        <div className="flex gap-3">
          <div className="h-12 bg-gray-200 rounded-md w-24"></div>
          <div className="h-12 bg-gray-200 rounded-md w-24"></div>
        </div>
      </div>
      
      {/* Precio final skeleton */}
      <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
      
      {/* Botón de añadir al carro skeleton */}
      <div className="h-12 bg-gray-200 rounded-md w-full"></div>
    </div>
  )
}

export default ProductInfoSkeleton