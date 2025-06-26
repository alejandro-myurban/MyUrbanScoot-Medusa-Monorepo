// src/modules/product-reviews/components/ReviewButton.tsx
"use client"

import React, { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { Star } from "lucide-react"
import ProductReviewModal from "./Modal"

interface Props {
  product: HttpTypes.StoreProduct
  className?: string
}

export default function ReviewButton({ product, className = "" }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md transition-colors
          bg-blue-600 text-white hover:bg-blue-700
          ${className}
        `}
      >
        <Star size={16} />
        Escribir reseña
      </button>

      <ProductReviewModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}