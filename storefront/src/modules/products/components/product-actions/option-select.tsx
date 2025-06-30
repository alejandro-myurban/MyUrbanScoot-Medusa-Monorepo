import { HttpTypes, StoreProduct } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"
import { useTranslation } from "react-i18next"
import { useColorContext } from "@lib/context/color-content-provider"
import { PlusCircle, MinusCircle, Star } from "lucide-react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption & {
    values?: Array<{
      value: string
      label?: string
      popular?: boolean // Nuevo campo para marcar como popular
    }>
  }
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
  product: StoreProduct
  selectedOptions?: Record<string, string> // Opciones actualmente seleccionadas
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  product,
  selectedOptions = {},
}) => {
  const { t } = useTranslation()
  const { optionTitle } = useColorContext()
  const [showInfo, setShowInfo] = React.useState<boolean>(false)

  // Función para obtener el precio de una variante específica
  const getVariantPrice = (optionValue: string): number | null => {
    if (!product.variants) return null

    // Crear un objeto con las opciones que tendría la variante si seleccionamos este valor
    const potentialOptions = {
      ...selectedOptions,
      [option.title]: optionValue,
    }

    // Buscar la variante que coincida con estas opciones
    const matchingVariant = product.variants.find((variant) => {
      if (!variant.options) return false

      // Verificar si todas las opciones coinciden
      return Object.entries(potentialOptions).every(
        ([optionTitle, optionValue]) => {
          const variantOption = variant.options?.find(
            (opt) => opt.option?.title === optionTitle
          )
          return variantOption?.value === optionValue
        }
      )
    })

    return matchingVariant?.calculated_price?.calculated_amount || null
  }

  // Función para formatear el precio
  const formatPrice = (price: number): string => {
    return `€${price.toFixed(2)}`
  }

  // Información específica según el tipo de opción
  const getInfoContent = (optionTitle: string) => {
    switch (optionTitle.toLowerCase()) {
      case "base":
        return {
          title: "¿Qué es base antideslizante?",
          content:
            "La base antideslizante es un material especial que se adhiere al suelo para evitar que el producto se deslice. Proporciona mayor seguridad y estabilidad durante el uso.",
        }
      case "modelo":
        return {
          title: "¿No sabes qué modelo elegir?",
          content:
            "Si no sabes que modelo tienes no te preocupes, nosotros te ayudamos. Puedes contactarnos por Whatsapp o Email y te asesoraremos encantados.",
        }
      case "tamaño":
      case "size":
        return {
          title: "¿Cómo elegir el tamaño?",
          content:
            "Mide el espacio disponible y consulta nuestra guía de tallas para encontrar el tamaño perfecto para tus necesidades.",
        }
      default:
        return {
          title: `¿Qué es ${title}?`,
          content:
            "Esta opción te permite personalizar el producto según tus preferencias. Cada variante tiene características específicas.",
        }
    }
  }

  const getSelectText = (optionTitle: string) => {
    switch (optionTitle.toLowerCase()) {
      case "base":
      case "base":
        return `${t("actions.select")} ${optionTitle}` // "Seleccionar" (traducido)
      case "modelo":
      case "model":
        return `Elige tu ${title}`
      case "color":
        return `Escoge el ${title}`
      case "tamaño":
      case "size":
        return `Selecciona el ${title}`
      default:
        return t("actions.select") + ` ${title}` // Fallback por defecto
    }
  }

  // Función para verificar si un valor es popular (también puede venir de metadata del producto)
  const isPopular = (value: string) => {
    // Método 1: Desde el array de values
    //@ts-ignore
    if (option.values?.find((v) => v.value === value)?.popular) {
      return true
    }

    // Método 2: Hardcodeado para ciertos valores comunes
    const popularValues = [
      "con base",
      "with base",
      "l",
      "large",
      "negro",
      "black",
    ]
    return popularValues.includes(value.toLowerCase())
  }

  const shouldShowPrice = (optionTitle: string) => {
    return optionTitle.toLowerCase() === "base"
  }

  const infoContent = getInfoContent(title)

  return (
    <div className="flex flex-col gap-y-3">
      <span className="font-semibold flex font-archivoBlack uppercase flex-col sm:flex-row items-start sm:items-center justify-between text-xl sm:text-2xl">
        {getSelectText(title)}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="font-normal text-left font-dmSans cursor-pointer  text-sm flex justify-center items-center gap-1 underline hover:text-gray-600 transition-colors"
        >
          {infoContent.title}
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
            {infoContent.content}
          </p>
        </div>
      </div>

      <div
        className="flex flex-col sm:flex-row flex-wrap justify-between gap-2"
        data-testid={dataTestId}
      >
        {option.values?.map((v) => {
          // Usa label si está disponible, si no usa value
          //@ts-ignore
          const displayValue = v.translations?.value || v.value
          const showPopularBadge = isPopular(v.value)
          const variantPrice = getVariantPrice(v.value)

          return (
            <button
              onClick={() => updateOption(option.title, v.value)}
              key={v.value}
              className={clx(
                "relative border-gray-300 flex flex-col justify-center bg-ui-bg-subtle  py-6 sm:py-0 border-2 font-semibold rounded-md px-4 h-20 flex-1 transition-all duration-200 overflow-visible",
                {
                  "border-black text-ui-fg-base": current === v.value,
                  "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                    current !== v.value,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {/* Badge Popular */}
              {showPopularBadge && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-mysGreen-100 text-black px-2 py-1 border border-black rounded-md text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Star size={12} fill="currentColor" />
                    Popular
                  </div>
                </div>
              )}

              {/* Contenido del botón */}
              <div className="w-full flex justify-between items-center text-left">
                <div className="font-semibold">{displayValue}</div>
                {/* Solo mostrar precio para opciones de tipo "base" */}
                {shouldShowPrice(option.title) && variantPrice && (
                  <div className="text-sm font-bold text-gray-500 mt-1">
                    {formatPrice(variantPrice)}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
