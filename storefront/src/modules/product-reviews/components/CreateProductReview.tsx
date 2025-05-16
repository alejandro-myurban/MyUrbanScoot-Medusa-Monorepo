"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { StoreOrder } from "@medusajs/types"
import { useProductReviews } from "../hooks/useProductReviews"

interface Props {
  order: StoreOrder
  countryCode: string
}

export default function CreateProductReview({ order, countryCode }: Props) {
  const router = useRouter()

  // Usamos el hook refactorizado (no necesitamos productId aquí)
  const { createReview, submitting, submitError } = useProductReviews()

  const lineItems = order.items || []
  const [orderLineItemId, setOrderLineItemId] = useState(
    lineItems.length > 0 ? lineItems[0].id : ""
  )
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const success = await createReview({
      order_id: order.id,
      order_line_item_id: orderLineItemId,
      rating,
      content: comment,
      images: [],
    })

    if (success) {
      router.push(`/${countryCode}`)
    }
  }

  return (
    <div className="content-container max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Añade una reseña</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selección de ítem de orden */}
        <label className="block">
          <span className="font-medium">Artículo</span>
          <select
            className="mt-1 block w-full rounded border px-3 py-2"
            value={orderLineItemId}
            onChange={(e) => setOrderLineItemId(e.target.value)}
            required
          >
            {lineItems.map((li) => (
              <option key={li.id} value={li.id}>
                {li.title} ({li.quantity})
              </option>
            ))}
          </select>
        </label>

        {/* Rating */}
        <label className="block">
          <span className="font-medium">Puntuación</span>
          <select
            className="mt-1 block w-full rounded border px-3 py-2"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            required
          >
            <option value={5}>5 estrellas</option>
            <option value={4}>4 estrellas</option>
            <option value={3}>3 estrellas</option>
            <option value={2}>2 estrellas</option>
            <option value={1}>1 estrella</option>
          </select>
        </label>

        {/* Comentario */}
        <label className="block">
          <span className="font-medium">Tu opinión</span>
          <textarea
            className="mt-1 block w-full rounded border px-3 py-2"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            required
          />
        </label>

        {submitError && <p className="text-red-600">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Enviando…" : "Enviar reseña"}
        </button>
      </form>
    </div>
  )
}
