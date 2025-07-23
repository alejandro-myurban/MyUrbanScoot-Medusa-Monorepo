"use client"

import React from "react"
import type { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

interface CompatibleScootersClientProps {
  products: HttpTypes.StoreProduct[]
}

const CompatibleScootersClient: React.FC<CompatibleScootersClientProps> = ({ products }) => {
  if (!products?.length) {
    return (
      <div className="text-center text-gray-600 py-6 text-sm">
        No se encontraron modelos compatibles de patinetes.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => {
        const { id, handle, title, thumbnail } = product
        const fallbackImage = "https://placehold.co/500x500/E0E0E0/ADADAD?text=Sin+Imagen"

        return (
          <LocalizedClientLink
            key={id}
            href={`/producto/${handle || id}`}
            className="group block bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100"
          >
            <div className="relative w-full aspect-square bg-gray-100">
              <Image
                src={thumbnail || fallbackImage}
                alt={title || "Imagen del producto"}
                width={500}
                height={500}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (target.src !== fallbackImage) {
                    target.src = fallbackImage
                  }
                }}
                priority={false}
              />
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="text-sm sm:text-base font-medium text-gray-800 group-hover:text-mysGreen-100 transition-colors line-clamp-2">
                {title}
              </h3>
            </div>
          </LocalizedClientLink>
        )
      })}
    </div>
  )
}

export default CompatibleScootersClient
