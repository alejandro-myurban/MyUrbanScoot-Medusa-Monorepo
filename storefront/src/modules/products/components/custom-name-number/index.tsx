"use client"
import React, { useState, useEffect, useCallback } from "react"
import { Input } from "@medusajs/ui"
import type { HttpTypes } from "@medusajs/types"
import { useCombinedCart } from "../bought-together/bt-context"
import { PlusCircle, MinusCircle } from "lucide-react"

// 👈 NUEVO: Tipo para los detalles de personalización
type CustomizationDetails = {
  customName: string | null
  customNumber: string | null
  totalPrice: number
}

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  onPriceChange?: (additionalPrice: number) => void
  onCustomizationChange?: (details: CustomizationDetails) => void // 👈 NUEVA prop
}

export default function CustomNameNumberForm({
  product,
  onPriceChange,
  onCustomizationChange, // 👈 NUEVA prop
}: ProductActionsProps) {
  const [customName, setCustomName] = useState("")
  const [customNumber, setCustomNumber] = useState("")
  const [showNameForm, setShowNameForm] = useState<boolean>(false)
  const [showNumberForm, setShowNumberForm] = useState<boolean>(false)
  const [showInfo, setShowInfo] = useState<boolean>(false)
  const [showNumberInfo, setShowNumberInfo] = useState<boolean>(false)
  const { setCustomField } = useCombinedCart()

  // Precios de las opciones
  const NAME_PRICE = 5 // 5€ por nombre
  const NUMBER_PRICE = 3 // 3€ por número

  // 👈 NUEVA: Función para calcular y comunicar tanto precio como detalles
  const calculateAndNotifyChanges = useCallback((hasName: boolean, hasNumber: boolean, nameValue: string = "", numberValue: string = "") => {
    let additionalPrice = 0
    if (hasName) additionalPrice += NAME_PRICE
    if (hasNumber) additionalPrice += NUMBER_PRICE

    // Comunicar el precio al componente padre
    onPriceChange?.(additionalPrice)

    // 👈 NUEVO: Comunicar los detalles de personalización
    const customizationDetails: CustomizationDetails = {
      customName: hasName ? nameValue || customName : null,
      customNumber: hasNumber ? numberValue || customNumber : null,
      totalPrice: additionalPrice
    }
    
    onCustomizationChange?.(customizationDetails)
    
    console.log("📊 Customization details sent:", customizationDetails)
  }, [customName, customNumber, onPriceChange, onCustomizationChange])

  const handleNameSelection = (hasName: boolean) => {
    console.log("🎯 handleNameSelection called with:", hasName)
    
    if (hasName) {
      setShowNameForm(true)
    } else {
      setShowNameForm(false)
      setCustomName("")
      setCustomField("custom_name", "")
    }

    // 👈 ACTUALIZADO: Usar la nueva función
    calculateAndNotifyChanges(hasName, showNumberForm, customName, customNumber)
  }

  const handleNumberSelection = (hasNumber: boolean) => {
    console.log("🎯 handleNumberSelection called with:", hasNumber)
    
    if (hasNumber) {
      setShowNumberForm(true)
    } else {
      setShowNumberForm(false)
      setCustomNumber("")
      setCustomField("custom_number", "")
    }

    // 👈 ACTUALIZADO: Usar la nueva función
    calculateAndNotifyChanges(showNameForm, hasNumber, customName, customNumber)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log("🔤 handleNameChange called with:", value)

    setCustomName(value)
    setCustomField("custom_name", value)

    // 👈 NUEVO: Comunicar cambios inmediatamente
    calculateAndNotifyChanges(showNameForm, showNumberForm, value, customNumber)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log("🔢 handleNumberChange called with:", value)
    
    setCustomNumber(value)
    setCustomField("custom_number", value)
    
    // 👈 NUEVO: Comunicar cambios inmediatamente
    calculateAndNotifyChanges(showNameForm, showNumberForm, customName, value)
  }

  // Debug: mostrar estados actuales
  console.log("🐛 CustomNameNumberForm render:", {
    customName,
    customNumber,
    showNameForm,
    showNumberForm,
    product: product.id
  })

  // Cuando se desmonta el componente o cambia el producto, limpiamos el estado local
  useEffect(() => {
    console.log("🔄 useEffect - Setting product_id:", product.id)
    setCustomField("product_id", product.id)
    return () => {
      console.log("🧹 useEffect cleanup")
      setCustomName("")
      setCustomNumber("")
      // Reset precio y detalles cuando se desmonta
      onPriceChange?.(0)
      onCustomizationChange?.({
        customName: null,
        customNumber: null,
        totalPrice: 0
      })
    }
  }, [product.id]) // 👈 FIXED: Removidas las dependencias problemáticas

  // 👈 ACTUALIZADO: Notificar cambios iniciales cuando el componente se monta
  useEffect(() => {
    console.log("🎬 Initial calculation")
    calculateAndNotifyChanges(showNameForm, showNumberForm, customName, customNumber)
  }, [calculateAndNotifyChanges, showNameForm, showNumberForm, customName, customNumber]) // 👈 FIXED: Dependencias específicas

  // Solo mostrar si hay campos personalizados para este producto
  if (
    product.metadata?.custom_name !== "true" &&
    product.metadata?.custom_number !== "true"
  ) {
    console.log("❌ No custom fields for this product")
    return null
  }

  console.log("✅ Rendering custom fields form")

  return (
    <div className="flex flex-col gap-y-4">
      {/* Sección Nombre Personalizado */}
      {product.metadata?.custom_name === "true" && (
        <div className="flex flex-col gap-y-3">
          <span className="font-semibold font-archivoBlack uppercase text-xl sm:text-2xl flex flex-col sm:flex-row justify-between sm:items-center">
            Nombre personalizado
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="font-normal cursor-pointer font-archivo text-sm flex sm:justify-center items-center gap-1 underline hover:text-gray-600 transition-colors"
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
              <p className="text-sm text-gray-600 font-archivo leading-relaxed">
                Personaliza tu producto con un nombre y número únicos. Los datos
                se imprimirán directamente en el producto con alta calidad y
                durabilidad.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap flex-col sm:flex-row justify-between gap-2">
            <button
              onClick={() => handleNameSelection(false)}
              className={`flex items-center bg-ui-bg-subtle border-2 font-semibold rounded-md px-4 py-6 h-20 flex-1 transition-all duration-200 ${
                !showNameForm
                  ? "border-black bg-black text-ui-fg-base"
                  : "border-gray-300 hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150"
              }`}
            >
              <div className="text-left w-full">
                <div className="font-semibold">Sin Nombre</div>
              </div>
            </button>

            <button
              onClick={() => handleNameSelection(true)}
              className={`flex items-center bg-ui-bg-subtle border-2 font-semibold rounded-md px-4 py-6 h-20 flex-1 transition-all duration-200 ${
                showNameForm
                  ? "border-black bg-black text-ui-fg-base"
                  : "border-gray-300 hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150"
              }`}
            >
              <div className="text-center w-full flex justify-between">
                <div className="font-semibold">Añadir mi nombre</div>
                <div className="text-sm  text-gray-500">+{NAME_PRICE},00€</div>
              </div>
            </button>
          </div>

          {/* Input para el nombre */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showNameForm ? "max-h-20 opacity-100 mt-2" : "max-h-0 opacity-0"
            }`}
          >
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
          <span className="font-semibold font-archivoBlack uppercase text-xl sm:text-2xl flex flex-col sm:flex-row justify-between sm:items-center">
            Número personalizado
            <button
              onClick={() => setShowNumberInfo(!showNumberInfo)}
              className="font-normal cursor-pointer font-archivo text-sm flex sm:justify-center items-center gap-1 underline hover:text-gray-600 transition-colors "
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
              <p className="text-sm text-gray-600 leading-relaxed font-archivo">
                Elige tu número favorito (0-999) que se personalizará en el
                producto. Ideal para números de la suerte, fechas especiales o
                simplemente tu número preferido.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap flex-col sm:flex-row justify-between gap-2">
            <button
              onClick={() => handleNumberSelection(false)}
              className={`flex items-center bg-ui-bg-subtle border-2 font-semibold rounded-md px-4 py-6 h-20 flex-1 transition-all duration-200 ${
                !showNumberForm
                  ? "border-black bg-black text-ui-fg-base"
                  : "border-gray-300 hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150"
              }`}
            >
              <div className="text-left w-full">
                <div className="font-semibold">Sin número</div>
              </div>
            </button>

            <button
              onClick={() => handleNumberSelection(true)}
              className={`flex items-center bg-ui-bg-subtle border-2 font-semibold rounded-md px-4 py-6 h-20 flex-1 transition-all duration-200 ${
                showNumberForm
                  ? "border-black bg-black text-ui-fg-base"
                  : "border-gray-300 hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150"
              }`}
            >
              <div className="text-center w-full flex justify-between">
                <div className="font-semibold">Añadir número</div>
                <div className="text-sm  text-gray-500">
                  +{NUMBER_PRICE},00€
                </div>
              </div>
            </button>
          </div>

          {/* Input para el número */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showNumberForm ? "max-h-20 opacity-100 mt-2" : "max-h-0 opacity-0"
            }`}
          >
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