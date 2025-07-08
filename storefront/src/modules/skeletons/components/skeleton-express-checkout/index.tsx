// Skeleton mientras carga
export const ExpressCheckoutSkeleton = () => {
  return (
    <div className="mb-6">
      {/* Título Pago Express */}
      <div className="text-center py-4">
        <div className="h-4 w-24 mx-auto animate-pulse rounded bg-gray-200"></div>
      </div>

      {/* Botones de pago express */}
      <div className="py-4">
        <div className="grid grid-cols-2 gap-2">
          {/* Botón Apple Pay/Google Pay */}
          <div className="h-12 animate-pulse rounded-lg bg-gray-200 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gray-300"></div>
              <div className="h-3 w-16 rounded bg-gray-300"></div>
            </div>
          </div>
          
          {/* Botón Link/PayPal */}
          <div className="h-12 animate-pulse rounded-lg bg-gray-200 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gray-300"></div>
              <div className="h-3 w-12 rounded bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Divisor "O" */}
      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-gray-200 animate-pulse"></div>
        <div className="px-3">
          <div className="h-3 w-3 rounded bg-gray-200 animate-pulse"></div>
        </div>
        <div className="flex-1 h-px bg-gray-200 animate-pulse"></div>
      </div>
    </div>
  )
}