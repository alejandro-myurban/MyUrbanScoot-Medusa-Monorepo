"use client"
import React from "react"
import { useProductReviews } from "../hooks/useProductReviews"
import { StarRating } from "./StarRating"

interface ProductAverageReviewProps {
  productId: string
}

export const ProductAverageReview = ({ productId }: { productId: string }) => {
  const { averageRating, totalApprovedReviews, loading } =
    useProductReviews(productId)

  const hasRating = !loading && averageRating > 0

  return (
    <div className="flex items-center gap-2">
      <StarRating
        rating={averageRating}
        size={16}
        color={hasRating ? "#FFD700" : "#ccc"}
      />
      {hasRating ? (
        <span className="text-sm text-gray-600">
          {averageRating.toFixed(1)} ({totalApprovedReviews})
        </span>
      ) : (
        <span className="text-sm text-gray-500">
          {loading ? "Cargando..." : "No reviews yet"}
        </span>
      )}
    </div>
  )
}
