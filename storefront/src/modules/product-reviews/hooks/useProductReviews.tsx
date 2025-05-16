"use client"

import { useEffect, useMemo, useState } from "react"
import {
  StoreListProductReviewsResponse,
  StoreUpsertProductReviewsDTO,
} from "@lambdacurry/medusa-plugins-sdk"
import { sdk } from "@lib/config"

type CreateReviewData = {
  order_id: string
  order_line_item_id: string
  rating: number
  content: string
  images?: { url: string }[]
}

export function useProductReviews(productId?: string) {
  const [reviews, setReviews] = useState<StoreListProductReviewsResponse>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Función para crear una nueva reseña
  const createReview = async (reviewData: CreateReviewData) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const payload: StoreUpsertProductReviewsDTO = {
        reviews: [
          {
            order_id: reviewData.order_id,
            order_line_item_id: reviewData.order_line_item_id,
            rating: reviewData.rating,
            content: reviewData.content,
            images: reviewData.images || [],
          },
        ],
      }

      await sdk.store.productReviews.upsert(payload)

      // Si la reseña es para el producto actual, refrescamos las reseñas
      if (productId) {
        await fetchReviews()
      }

      return true
    } catch (err: any) {
      console.error(err)
      setSubmitError(err.message || "Error enviando la reseña")
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const fetchReviews = async () => {
    if (!productId) return

    setLoading(true)
    setError(null)
    try {
      const response = await sdk.store.productReviews.list({
        product_id: productId,
        offset: 0,
        limit: 100, // por si tienes muchas reseñas
        status: "approved", // solo traemos aprobadas
      })
      setReviews(response)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [productId])

  // Solo reviews aprobadas (aunque ya las filtramos en la API, lo reforzamos)
  const list = useMemo(() => reviews?.product_reviews ?? [], [reviews])

  // Media de ratings (0 si no hay ninguna)
  const averageRating = useMemo(() => {
    if (list.length === 0) return 0
    const sum = list.reduce((acc, r) => acc + r.rating, 0)
    return sum / list.length
  }, [list])
  return {
    reviews,
    loading,
    error,
    submitting,
    refreshReviews: fetchReviews,
    averageRating, // media real de aprobadas
    totalApprovedReviews: list.length,
    createReview,
    submitError,
  }
}
