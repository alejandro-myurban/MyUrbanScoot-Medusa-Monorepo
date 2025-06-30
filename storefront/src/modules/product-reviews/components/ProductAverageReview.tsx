"use client"
import React from "react"
import { useProductReviews } from "../hooks/useProductReviews"
import { StarRating } from "./StarRating"

interface ProductAverageReviewProps {
  productId: string
}

export const ProductAverageReview = ({
  productId,
}: ProductAverageReviewProps) => {
  const { averageRating, reviews } = useProductReviews(productId)

  const totalReviews = reviews?.product_reviews?.length ?? 0

  const hasRating = typeof averageRating === "number" && averageRating > 0

  const scrollToReviews = () => {
    const element = document.getElementById("product-reviews-section")
    if (element) {
      // Calcular offset para header fijo (ajusta según tu diseño)
      const headerHeight = 80
      const elementPosition = element.offsetTop - headerHeight

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Siempre dibujo las 5 estrellas; si no hay rating, rating=0 y color gris */}
      {hasRating ? (
        <StarRating
          rating={averageRating ?? 0}
          size={16}
          color={hasRating ? "#ff2c46" : "#ccc"}
        />
      ) : (
        ""
      )}

      {hasRating ? (
        <span className="text-sm font-semibold text-ui-fg-base">
          {averageRating!.toFixed(1)}
          <span className="ml-1 ">
            ({" "}
            <button
              onClick={scrollToReviews}
              className="underline hover:text-mysRed-100 transition-colors cursor-pointer"
            >
              {totalReviews} opiniones
            </button>{" "}
            )
          </span>
        </span>
      ) : (
        " "
      )}
    </div>
  )
}
