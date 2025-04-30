"use client"

import React from "react"
import { useProductReviews } from "../hooks/useProductReviews"
import { StarRating } from "./StarRating"
import Link from "next/link"

interface ProductReviewsSummaryProps {
  productId: string
  productHandle: string
  className?: string
}

export const ProductReviewsSummary: React.FC<ProductReviewsSummaryProps> = ({
  productId,
  productHandle,
  className = "",
}) => {
  const { statsLoading, averageRating, reviews } =
    useProductReviews(productId)

  const totalReviews = reviews?.product_reviews

  console.log(averageRating)
  if (statsLoading) {
    return <div className="text-sm text-gray-500">Loading reviews...</div>
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Mapeo de todas las reseñas */}
      {totalReviews && totalReviews.length > 0 && (
        <div className="mt-4 space-y-4">
          {totalReviews.map((review) => (
            <div key={review.id} className="border p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <StarRating rating={review.rating} size={14} />
                <span className="ml-2 text-sm text-gray-600">
                  {review.rating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-700 italic">{review.name}</p>

              <p className="text-sm text-gray-700">{review.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
