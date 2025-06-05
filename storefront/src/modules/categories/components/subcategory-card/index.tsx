import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const SubcategoryCard = ({
  category,
}: {
  category: HttpTypes.StoreProductCategory
}) => {
  return (
    <LocalizedClientLink
      href={`/categories/${category.handle}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1">
        {/* Card principal con bordes y sombras mejoradas */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl hover:border-mysGreen-100/50 hover:shadow-2xl hover:shadow-mysGreen-100/20 transition-all duration-300">
          
          {/* Contenedor de imagen con fondo oscuro y patrón */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-black">
            {/* Patrón de fondo decorativo */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgb(156 255 0 / 0.3) 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
              }} />
            </div>
            
            {/* Efectos de luz en las esquinas */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-mysGreen-100/10 blur-3xl rounded-full transform -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-mysGreen-100/10 blur-3xl rounded-full transform translate-x-16 translate-y-16" />
            
            {/* Imagen del producto */}
            <div className="relative h-full flex items-center justify-center p-6">
              {category.metadata?.image ? (
                <img 
                  className="w-full h-full object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-300" 
                  src={category.metadata.image as string}
                  alt={category.name}
                />
              ) : (
                <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Overlay con gradiente en la parte inferior */}
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
          </div>
          
          {/* Contenido de la card */}
          <div className="p-5">
            <h3 className="text-lg font-semibold text-white group-hover:text-mysGreen-100 transition-colors duration-200 mb-2">
              {category.name}
            </h3>
            
            {category.description && (
              <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                {category.description}
              </p>
            )}
            
            {/* Indicador de acción con animación */}
            <div className="flex items-center text-sm text-gray-500 group-hover:text-mysGreen-100 transition-colors duration-200">
              <span>Ver productos</span>
              <svg
                className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Efecto de brillo en hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>
    </LocalizedClientLink>
  )
}

// Versión alternativa con tema claro si prefieres mantener fondos blancos
export const SubcategoryCardLight = ({
  category,
}: {
  category: HttpTypes.StoreProductCategory
}) => {
  return (
    <LocalizedClientLink
      href={`/categories/${category.handle}`}
      className="group block"
    >
      <div className="bg-white rounded-xl border border-gray-300  shadow-sm hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-1 overflow-hidden">
        {/* Contenedor de imagen con fondo neutro */}
        <div className="relative h-48  bg-white overflow-hidden">
          {/* Patrón decorativo sutil */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(229 231 235) 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }} />
          </div>
          
          {/* Imagen con sombra para mejor contraste */}
          <div className="relative h-full flex items-center justify-center p-6">
            {category.metadata?.image ? (
              <img 
                className="w-full h-full object-contain filter drop-shadow-lg group-hover:scale-105 transition-transform duration-300" 
                src={category.metadata.image as string}
                alt={category.name}
                style={{
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06))'
                }}
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>
        
        {/* Contenido */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-black  transition-colors duration-200 mb-2">
            {category.name}
          </h3>
          
          {category.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {category.description}
            </p>
          )}
          
          <div className="flex items-center text-sm text-gray-500 group-hover:text-black transition-colors duration-200">
            <span>Ver productos</span>
            <svg
              className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}