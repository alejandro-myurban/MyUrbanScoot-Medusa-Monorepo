"use client"

import { useEffect, useState } from "react"
import {
  ProductReview,
  ProductReviewCreateBody,
  ProductReviewStats,
} from "../types"
import { sdk } from "@lib/config"
import {
  StoreListProductReviewsResponse,
  StoreListProductReviewStatsQuery,
  StoreListProductReviewStatsResponse,
  StoreUpsertProductReviewsDTO,
} from "@lambdacurry/medusa-plugins-sdk"

const API_BASE = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "/api"

export function useProductReviews(productId: string) {
  const [reviews, setReviews] = useState<StoreListProductReviewsResponse>()
  const [stats, setStats] = useState<StoreListProductReviewStatsResponse>()
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = async () => {
    if (!productId) return

    setLoading(true)
    setError(null)

    try {
      const response = await sdk.store.productReviews.list({
        product_id: productId,
        offset: 0,
        limit: 10,
        status: "approved",
      })
      console.log(response)
      setReviews(response)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      )
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!productId) return

    setStatsLoading(true)

    try {
      const response = await sdk.store.productReviews.listStats({
        product_id: productId,
        offset: 0,
        limit: 10,
      })
      console.log("EEEEEEEEEEEEEEE", response)

      setStats(response)
    } catch (err) {
      console.error("Error fetching review stats:", err)
    } finally {
      setStatsLoading(false)
    }
  }

  /**
   * Envía una reseña de producto utilizando el SDK de LambdaCurry para Medusa
   */
  const submitReview = async (
    reviewData: Omit<
      StoreUpsertProductReviewsDTO["reviews"][number],
      "product_id"
    >,
    {
      productId,
      setSubmitting,
      setError,
      fetchReviews,
      fetchStats,
    }: {
      productId: string
      setSubmitting: (value: boolean) => void
      setError: (error: Error | null) => void
      fetchReviews: () => Promise<void>
      fetchStats: () => Promise<void>
    }
  ) => {
    if (!productId) return

    setSubmitting(true)
    setError(null)

    try {
      // Usando el cliente de LambdaCurry Medusa
      const { product_reviews } = await sdk.store.productReviews.upsert({
        reviews: [
          {
            order_id: "test_order_123",
            order_line_item_id: "test_line_item_123",
            rating: 5,
            content: "This is a test review content",
            images: [
              {
                url: "https://example.com/test-image.jpg",
              },
            ],
          },
        ],
      })

      if (error) {
        throw new Error(error.message || "Failed to submit review")
      }

      // Recargar reseñas y estadísticas después de enviar
      await Promise.all([fetchReviews(), fetchStats()])
      return true
    } catch (err) {
      console.error("Error submitting review:", err)
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      )
      return false
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (productId) {
      fetchReviews()
      fetchStats()
    }
  }, [productId])

  return {
    reviews,
    stats,
    loading,
    statsLoading,
    error,
    submitting,
    submitReview,
    refreshReviews: fetchReviews,
    refreshStats: fetchStats,
    averageRating: stats?.product_review_stats?.[0]?.average_rating ?? null,
    // ratingsDistribution: stats?.ratings_count || {},
  }
}
