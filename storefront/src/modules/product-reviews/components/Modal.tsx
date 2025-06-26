// src/modules/product-reviews/components/ProductReviewModal.tsx
"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@lib/config"
import { X } from "lucide-react"
import { toast } from "@medusajs/ui"

interface Props {
  product: HttpTypes.StoreProduct
  isOpen: boolean
  onClose: () => void
}

export default function ProductReviewModal({
  product,
  isOpen,
  onClose,
}: Props) {
  const router = useRouter()

  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>("")
  const [name, setName] = useState<string>("") // Nuevo estado para el nombre
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      console.log("🔥 MODAL: Enviando a /store/anonymous-reviews")
      // Usar nuestro endpoint personalizado en lugar del SDK
      const response = await sdk.client.fetch("/store/anon-reviews", {
        method: "POST",
        body: {
          product_id: product.id,
          rating,
          content: comment,
          name: name.trim() || undefined, // Enviar el nombre si no está vacío
        },
      })

      console.log("Review created:", response)

      // Limpiar formulario y cerrar modal
      toast.success("Reseña creada con éxito")
      setComment("")
      setName("") // Limpiar también el nombre
      setRating(5)
      onClose()

      // Refrescar para mostrar la nueva reseña
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Error enviando la reseña")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Reseña: {product.title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de nombre */}
          <label className="block">
            <span className="font-medium">Tu nombre</span>
            <input
              type="text"
              className="mt-1 block w-full rounded border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre (opcional)"
              maxLength={50}
            />
          </label>

          {/* Rating con estrellas visuales */}
          <label className="block">
            <span className="font-medium">Puntuación</span>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? "text-yellow-400" : "text-gray-300"
                  } hover:text-yellow-400 transition-colors`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating} de 5 estrellas
              </span>
            </div>
          </label>

          {/* Comentario */}
          <label className="block">
            <span className="font-medium">Tu opinión</span>
            <textarea
              className="mt-1 block w-full rounded border px-3 py-2 resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Cuéntanos qué te pareció este producto..."
              required
            />
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {submitting ? "Enviando…" : "Enviar reseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}