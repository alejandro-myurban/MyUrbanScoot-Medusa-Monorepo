"use client"
import React, { useState, useEffect } from "react"
import { Input } from "@medusajs/ui"
import type { HttpTypes } from "@medusajs/types"
import { useCombinedCart } from "../bought-together/bt-context"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
}

export default function CustomNameNumberForm({ product }: ProductActionsProps) {
  const [customName, setCustomName] = useState("")
  const [customNumber, setCustomNumber] = useState("")
  const { setCustomField } = useCombinedCart()

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomName(value)
    setCustomField("custom_name", value)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomNumber(value)
    setCustomField("custom_number", value)
  }

  // Cuando se desmonta el componente o cambia el producto, limpiamos el estado local
  useEffect(() => {
    setCustomField("product_id", product.id)
    return () => {
      setCustomName("")
      setCustomNumber("")
    }
  }, [product.id])

  // Solo mostrar si hay campos personalizados para este producto
  if (
    product.metadata?.custom_name !== "true" &&
    product.metadata?.custom_number !== "true"
  ) {
    return null
  }

  return (
    <>
      <div className="space-y-4 mb-4 p-4 border rounded-md bg-white">
        {product.metadata?.custom_name === "true" && (
          <>
            <div>
              <h3 className="text-lg font-semibold mb-4">Personalización</h3>
              <p className="text-sm text-gray-600">
                Personaliza tu producto con un nombre y número únicos.
              </p>
            </div>
            <div>
              <Input
                id="custom-name"
                placeholder="Nombre personalizado"
                value={customName}
                onChange={handleNameChange}
              />
            </div>
          </>
        )}

        {product.metadata?.custom_number === "true" && (
          <div>
            <label
              htmlFor="custom-number"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Número Personalizado
            </label>
            <Input
              id="custom-number"
              placeholder="Número personalizado"
              value={customNumber}
              onChange={handleNumberChange}
              type="number"
            />
          </div>
        )}
      </div>
    </>
  )
}
