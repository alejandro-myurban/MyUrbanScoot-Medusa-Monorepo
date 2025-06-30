"use client"

import React, { useState } from "react"
import { useProductReviews } from "../hooks/useProductReviews"
import { StarRating } from "./StarRating"
import Link from "next/link"

interface ProductReviewsSummaryProps {
  productId: string
  productHandle: string
  className?: string
  productTitle: string
}

export const ProductReviewsSummary: React.FC<ProductReviewsSummaryProps> = ({
  productId,
  productTitle,
  productHandle,
  className = "",
}) => {
  const { statsLoading, averageRating, reviews } = useProductReviews(productId)
  const [expandedImages, setExpandedImages] = useState<string | null>(null)

  const totalReviews = reviews?.product_reviews

  console.log(averageRating)

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">Cargando reseñas...</div>
      </div>
    )
  }

  const handleImageClick = (reviewId: string) => {
    setExpandedImages(expandedImages === reviewId ? null : reviewId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // Función para filtrar imágenes duplicadas por URL
  const getUniqueImages = (images: any[]) => {
    const uniqueUrls = new Set<string>()
    return images.filter((image) => {
      if (uniqueUrls.has(image.url)) {
        return false
      }
      uniqueUrls.add(image.url)
      return true
    })
  }

  return (
    <div id="product-reviews-section" className={`${className} flex flex-col gap-6`}>
      {/* Header con estadísticas */}
      {totalReviews && totalReviews.length > 0 && (
        <div className="mb-6">
          <div>
            <h3 className="text-xl small:text-2xl font-archivoBlack uppercase">Opiniones de clientes de {productTitle}</h3> 
          </div>
          <div className="flex items-center gap-3 mb-2">
            <StarRating rating={averageRating || 0} size={20} />
            <span className="text-lg font-medium">
              {averageRating?.toFixed(1)} de 5
            </span>
            <span className="text-sm text-gray-600">
              ({totalReviews.length}{" "}
              {totalReviews.length === 1 ? "reseña" : "reseñas"})
            </span>
          </div>
        </div>
      )}

      {/* Lista de reseñas */}
      {totalReviews && totalReviews.length > 0 ? (
        <div className="space-y-6">
          {totalReviews.map((review) => {
            // Filtrar imágenes únicas para esta reseña
            const uniqueImages = review.images
              ? getUniqueImages(review.images)
              : []

            return (
              <div
                key={review.id}
                className="border-b border-gray-200 pb-6 last:border-b-0"
              >
                {/* Header de la reseña */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar inicial */}
                    <div className="w-10 h-10 bg-gradient-to-br from-black/80 to-mysGreen-100 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {review.name ? review.name.charAt(0).toUpperCase() : "A"}
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">
                        {review.name || "Cliente anónimo"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size={16} />
                        <span className="text-sm font-medium">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className="text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </div>
                </div>

                {/* Contenido de la reseña */}
                <div className="mb-4">
                  <p className="text-gray-800 leading-relaxed">
                    {review.content}
                  </p>
                </div>

                {/* Imágenes de la reseña */}
                {uniqueImages.length > 0 && (
                  <div className="space-y-3">
                    {/* Grid de miniaturas */}
                    <div className="flex gap-2 flex-wrap">
                      {uniqueImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative cursor-pointer group"
                          onClick={() => handleImageClick(review.id)}
                        >
                          <img
                            src={image.url}
                            alt={`Imagen de reseña ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                          />
                          {/* Overlay de hover */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              Ver
                            </span>
                          </div>

                          {/* Indicador de múltiples imágenes */}
                          {index === 0 && uniqueImages.length > 1 && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {uniqueImages.length}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Imágenes expandidas */}
                    {expandedImages === review.id && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Imágenes de la reseña ({uniqueImages.length})
                          </span>
                          <button
                            onClick={() => setExpandedImages(null)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Ocultar
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {uniqueImages.map((image, index) => (
                            <div key={index} className="group">
                              <img
                                src={image.url}
                                alt={`Imagen de reseña ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => window.open(image.url, "_blank")}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            Aún no hay reseñas para este producto
          </div>
          <div className="text-sm text-gray-400">
            ¡Sé el primero en dejar una reseña!
          </div>
        </div>
      )}
    </div>
  )
}
