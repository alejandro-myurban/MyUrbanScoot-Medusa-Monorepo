"use client"
import React, { useState, useEffect } from "react"
import { Input } from "@medusajs/ui"
import type { HttpTypes } from "@medusajs/types"
import { useCombinedCart } from "../bought-together/bt-context"
import { PlusCircle, MinusCircle } from "lucide-react"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
}

export default function CustomNameNumberForm({ product }: ProductActionsProps) {
  const [customName, setCustomName] = useState("")
  const [customNumber, setCustomNumber] = useState("")
  const [showNameForm, setShowNameForm] = useState<boolean>(false)
  const [showNumberForm, setShowNumberForm] = useState<boolean>(false)
  const [showInfo, setShowInfo] = useState<boolean>(false)
  const [showNumberInfo, setShowNumberInfo] = useState<boolean>(false)
  const { setCustomField } = useCombinedCart()

  const handleNameSelection = (hasName: boolean) => {
    if (hasName) {
      setShowNameForm(true)
    } else {
      setShowNameForm(false)
      setCustomName("")
      setCustomField("custom_name", "")
    }
  }

  const handleNumberSelection = (hasNumber: boolean) => {
    if (hasNumber) {
      setShowNumberForm(true)
    } else {
      setShowNumberForm(false)
      setCustomNumber("")
      setCustomField("custom_number", "")
    }
  }

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
    <div className="flex flex-col gap-y-3">
      {/* Sección Nombre Personalizado */}
      {product.metadata?.custom_name === "true" && (
        <div className="flex flex-col gap-y-3">
          <span className="font-semibold text-2xl flex justify-between items-center">
            Nombre personalizado
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="font-normal cursor-pointer text-sm flex justify-center items-center gap-1 underline hover:text-gray-600 transition-colors ml-4"
            >
              ¿Dónde irá mi nombre?
              {showInfo ? (
                <MinusCircle strokeWidth={1} size={16} />
              ) : (
                <PlusCircle strokeWidth={1} size={16} />
              )}
            </button>
          </span>

          {/* Acordeón con información */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showInfo ? "max-h-32 opacity-100 mb-2" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-sm text-gray-600 leading-relaxed">
                Personaliza tu producto con un nombre y número únicos. Los datos
                se imprimirán directamente en el producto con alta calidad y
                durabilidad.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <button
              onClick={() => handleNameSelection(false)}
              className={`border-black/80 flex items-center bg-ui-bg-subtle border-2 font-semibold rounded-md px-4 py-2 h-20 flex-1 ${
                !showNameForm
                  ? "border-black/80 bg-black/80 text-white"
                  : "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150"
              }`}
            >
              <div className="text-left w-full">
                <div className="font-semibold">Sin Nombre</div>
              </div>
            </button>

            <button
              onClick={() => handleNameSelection(true)}
              className={`border-black/80 flex items-center bg-ui-bg-subtle border-2 font-semibold rounded-md px-4 py-2 h-20 flex-1 ${
                showNameForm
                  ? "border-black/80 bg-black/80 text-white"
                  : "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150"
              }`}
            >
              <div className="text-center w-full flex justify-between">
                <div className="font-semibold">Añadir mi nombre</div>
                <div className="text-sm opacity-75">+5,00€</div>
              </div>
            </button>
          </div>

          {/* Input para el nombre */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showNameForm ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`}>
            <Input
              placeholder="Tu nombre, apodo o nick"
              value={customName}
              onChange={handleNameChange}
              className="w-full p-3 border font-dmSans border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mysGreen-100"
            />
          </div>
        </div>
      )}

      {/* Sección Número Personalizado */}
      {product.metadata?.custom_number === "true" && (
        <div className="flex flex-col gap-y-3">
          <span className="font-semibold text-2xl flex justify-between items-center">
            Número personalizado
            <button
              onClick={() => setShowNumberInfo(!showNumberInfo)}
              className="font-normal cursor-pointer text-sm flex justify-center items-center gap-1 underline hover:text-gray-600 transition-colors ml-4"
            >
              ¿Cómo funciona el número?
              {showNumberInfo ? (
                <MinusCircle strokeWidth={1} size={16} />
              ) : (
                <PlusCircle strokeWidth={1} size={16} />
              )}
            </button>
          </span>

          {/* Acordeón con información para número */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showNumberInfo ? "max-h-32 opacity-100 mb-2" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-sm text-gray-600 leading-relaxed">
                Elige tu número favorito (0-999) que se personalizará en el producto. 
                Ideal para números de la suerte, fechas especiales o simplemente tu número preferido.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <button
              onClick={() => handleNumberSelection(false)}
              className={`border-black/80 flex items-center bg-ui-bg-subtle border-2 font-semibold rounded-md px-4 py-2 h-20 flex-1 ${
                !showNumberForm
                  ? "border-black/80 bg-black/80 text-white"
                  : "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150"
              }`}
            >
              <div className="text-left w-full">
                <div className="font-semibold">Sin número</div>
              </div>
            </button>

            <button
              onClick={() => handleNumberSelection(true)}
              className={`border-black/80 flex items-center bg-ui-bg-subtle border-2 font-semibold rounded-md px-4 py-2 h-20 flex-1 ${
                showNumberForm
                  ? "border-black/80 bg-black/80 text-white"
                  : "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150"
              }`}
            >
              <div className="text-center w-full flex justify-between">
                <div className="font-semibold">Añadir número</div>
                <div className="text-sm opacity-75">+3,00€</div>
              </div>
            </button>
          </div>

          {/* Input para el número */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showNumberForm ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`}>
            <Input
              placeholder="Tu número favorito"
              value={customNumber}
              onChange={handleNumberChange}
              type="number"
              min="0"
              max="999"
              className="w-full p-3 border font-dmSans border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mysGreen-100"
            />
          </div>
        </div>
      )}
    </div>
  )
}