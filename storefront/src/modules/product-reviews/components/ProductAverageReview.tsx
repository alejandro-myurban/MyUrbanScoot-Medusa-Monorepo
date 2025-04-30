"use client"
import React from "react"
import { useProductReviews } from "../hooks/useProductReviews"
import { StarRating } from "./StarRating"

interface ProductAverageReviewProps {
  productId: string
}

export const ProductAverageReview = ({ productId }: ProductAverageReviewProps) => {
  const { averageRating, reviews } = useProductReviews(productId)

  const totalReviews = reviews?.product_reviews?.length ?? 0

  const hasRating = typeof averageRating === "number" && averageRating > 0

  return (
    <div className="flex items-center gap-2">
      {/* Siempre dibujo las 5 estrellas; si no hay rating, rating=0 y color gris */}
      <StarRating
        rating={averageRating ?? 0}
        size={16}
        color={hasRating ? "#FFD700" : "#ccc"}
      />

      {hasRating ? (
        <span className="text-sm text-gray-600">
          {averageRating!.toFixed(1)} ({totalReviews})
        </span>
      ) : (
        <span className="text-sm text-gray-500">
          No reviews yet
        </span>
      )}
    </div>
  )
}
