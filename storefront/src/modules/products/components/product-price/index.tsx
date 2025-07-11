import { clx } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

type CustomizationDetails = {
  customName: string | null
  customNumber: string | null
  totalPrice: number
}

export default function ProductPrice({
  product,
  variant,
  additionalPriceCustom = 0,
  additionalPriceBoughtTogether = 0,
  customizationDetails,
  boughtTogetherNames,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  additionalPriceCustom?: number
  additionalPriceBoughtTogether?: number
  customizationDetails?: CustomizationDetails
  boughtTogetherNames?: Record<string, string>
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }
  
  // Calcular el precio total incluyendo personalización Y productos combinados
  const totalPrice =
    selectedPrice.calculated_price_number +
    additionalPriceCustom +
    additionalPriceBoughtTogether
  const totalPriceFormatted = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: selectedPrice.currency_code || "EUR",
  }).format(totalPrice)

  // Formatear precios adicionales
  const additionalCustomFormatted = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: selectedPrice.currency_code || "EUR",
  }).format(additionalPriceCustom)

  const additionalBoughtTogetherFormatted = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: selectedPrice.currency_code || "EUR",
  }).format(additionalPriceBoughtTogether)

  // Verificar si hay algún precio adicional
  const hasAdditionalPrices =
    additionalPriceCustom > 0 || additionalPriceBoughtTogether > 0

  // 👈 NUEVA: Función para generar el texto de personalización
  const getCustomizationText = () => {
    if (
      !customizationDetails ||
      (!customizationDetails.customName && !customizationDetails.customNumber)
    ) {
      return "Personalización"
    }

    const parts = []

    if (customizationDetails.customName) {
      parts.push(`Nombre: ${customizationDetails.customName}`)
    }

    if (customizationDetails.customNumber) {
      parts.push(`Número: ${customizationDetails.customNumber}`)
    }

    return `Personalización - ${parts.join(", ")}`
  }

  const getBoughtTogetherText = () => {
    if (!boughtTogetherNames || Object.keys(boughtTogetherNames).length === 0) {
      return "Productos combinados"
    }

    const productNames = Object.values(boughtTogetherNames)

    if (productNames.length === 1) {
      return `Producto combinado: ${productNames[0]}`
    }

    if (productNames.length === 2) {
      return `Productos combinados: ${productNames.join(" y ")}`
    }

    // Para 3 o más productos
    const lastProduct = productNames[productNames.length - 1]
    const otherProducts = productNames.slice(0, -1)
    return `Productos combinados: ${otherProducts.join(", ")} y ${lastProduct}`
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Precio base */}
      <div className="flex gap-4 items-center text-ui-fg-base font-archivoBlack">
        <span
          className={clx("text-xl-semi ", {
            "text-gray-900 text-2xl font-semibold":
              selectedPrice.price_type === "sale",
          })}
        >
          {!variant && "From "}
          <span
            className="flex flex-col "
            data-testid="product-price"
            data-value={selectedPrice.calculated_price_number}
          >
            {selectedPrice.calculated_price}{" "}
            <span className="text-sm">IVA incluido*</span>
          </span>
        </span>
        {selectedPrice.price_type === "sale" && (
          <>
            <p>
              <span
                className="line-through font-archiveBlack text-ui-fg-muted text-2xl"
                data-testid="original-product-price"
                data-value={selectedPrice.original_price_number}
              >
                {selectedPrice.original_price}
              </span>
            </p>
            <div>
              <span className="bg-mysRed-100 text-white text-xs font-semibold px-2 py-1 rounded">
                -{selectedPrice.percentage_diff}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Mostrar precios adicionales si existen */}
      {hasAdditionalPrices && (
        <div className="space-y-2">
          {additionalPriceCustom > 0 && (
            <div className="flex justify-between items-center text-sm text-gray-600 py-2 rounded-md">
              <span className="flex-1 text-left">{getCustomizationText()}</span>
              <span className="font-semibold ml-2">
                +{additionalCustomFormatted}
              </span>
            </div>
          )}

          {/* Precio productos combinados */}
         {additionalPriceBoughtTogether > 0 && (
            <div className="flex justify-between items-center text-sm text-gray-600 py-2 rounded-md">
              <span className="flex-1 text-left">
                {getBoughtTogetherText()}
              </span>
              <span className="font-semibold ml-2">+{additionalBoughtTogetherFormatted}</span>
            </div>
          )}

          {/* Precio total */}
          <div className="flex justify-between items-center text-lg font-archivoBlack font-semibold border-t pt-3 mt-3">
            <span className="font-archivoBlack text-2xl uppercase">
              Subtotal:
            </span>
            <span
              className="text-2xl"
              data-testid="total-product-price"
              data-value={totalPrice}
            >
              {totalPriceFormatted}
              <span className="text-sm font-normal block">IVA incluido*</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
