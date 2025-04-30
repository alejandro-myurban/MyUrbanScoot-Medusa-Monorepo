"use client"
import React from "react"
import { useProductReviews } from "../hooks/useProductReviews"
import { StarRating } from "./StarRating"

interface ProductAverageReviewProps {
  productId: string
}

export const ProductAverageReview = ({ productId }: ProductAverageReviewProps) => {
  const { averageRating, reviews } = useProductReviews(productId)

  const totalReviews = reviews?.product_reviews
  return (
    <>
      <div className="flex items-center gap-2">
        {averageRating ? (
          <>
            <StarRating rating={averageRating} size={16} />
            <span className="text-sm text-gray-600">
              {averageRating.toFixed(1)} ({totalReviews?.length ?? 0})
            </span>
          </>
        ) : (
          <span className="text-sm text-gray-500">No reviews yet</span>
        )}
      </div>
    </>
  )
}