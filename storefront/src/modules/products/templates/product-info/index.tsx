import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ProductAverageReview } from "@modules/product-reviews/components/ProductAverageReview"
import ReviewButton from "@modules/product-reviews/components/ReviewButton"
import Accordion from "@modules/products/components/product-info-accordion"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const accordionItems = [
    {
      id: "modelos-compatibles",
      title: "MODELOS COMPATIBLES",
      content: (
        <div>
          <p>Compatible con los siguientes modelos:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Modelo A</li>
            <li>Modelo B</li>
            <li>Modelo C</li>
          </ul>
        </div>
      ),
    },
    {
      id: "ver-detalles",
      title: "VER DETALLES",
      content: (
        <div>
          <p>
            <strong>Especificaciones técnicas:</strong>
          </p>
          <ul className="mt-2 space-y-1">
            <li>• Medida: 10×2,75-6,5</li>
            <li>• Tipo: Tubeless Offroad</li>
            <li>• Material: Caucho reforzado</li>
            <li>• Peso: 2.5 kg</li>
          </ul>
        </div>
      ),
    },
    {
      id: "envio-devoluciones",
      title: "ENVÍO Y DEVOLUCIONES",
      content: (
        <div>
          <p>
            <strong>Información de envío:</strong>
          </p>
          <ul className="mt-2 space-y-1">
            <li>• Envío gratuito en pedidos superiores a 50€</li>
            <li>• Entrega en 24-48h</li>
            <li>• Devoluciones gratuitas hasta 30 días</li>
            <li>• Garantía de 2 años</li>
          </ul>
        </div>
      ),
    },
  ]
  // 1. Extraer los precios de las variantes (en céntimos) y filtrar los valores válidos.
  //    Si product.variants es undefined, rawPrices será [].
  const rawPrices: number[] =
    product.variants
      ?.map((v) => v.calculated_price?.calculated_amount)
      .filter(
        (amount): amount is number =>
          typeof amount === "number" && !isNaN(amount)
      ) ?? []

  // 2. Calcular precio mínimo y máximo (en la misma unidad).
  const minAmount = rawPrices.length > 0 ? Math.min(...rawPrices) : 0
  const maxAmount = rawPrices.length > 0 ? Math.max(...rawPrices) : 0

  // 3. Convertir a “euros” (aquí asumimos que calculated_amount ya está en la unidad final;
  //    si viene en céntimos, habría que dividir entre 100).
  const minPrice = minAmount.toFixed(2)
  const maxPrice = maxAmount.toFixed(2)

  const priceText =
    rawPrices.length === 0
      ? "Precio no disponible"
      : minAmount === maxAmount
      ? `${minPrice} €`
      : `${minPrice} € - ${maxPrice} €`

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}

        {/* Reseñas promedio */}
        <ProductAverageReview productId={product.id} />

        <Heading
          level="h2"
          className="text-3xl leading-10 font-archivoBlack text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {/* Precio mínimo/máximo */}
        <Text
          className="text-2xl font-semibold font-archivoBlack text-ui-fg-base"
          data-testid="product-price"
        >
          {priceText}
        </Text>

        <Accordion className="font-archivo  text-gray-500" items={accordionItems} />

        <ReviewButton product={product} className="text-sm" />

        {/* Descripción rica */}
        <Text
          className="text-medium text-ui-fg-subtle font-dmSans"
          data-testid="product-description"
          asChild
        >
          <div
            dangerouslySetInnerHTML={{ __html: product.description || "" }}
            className="whitespace-pre-line rich-text-content"
          />
        </Text>
      </div>
    </div>
  )
}

// Estilos globales para contenido HTML enriquecido
const RichTextStyles = `
  .rich-text-content {
    line-height: 1.6;
  }
  .rich-text-content p {
    margin-bottom: 1rem;
  }
  .rich-text-content h1,
  .rich-text-content h2,
  .rich-text-content h3,
  .rich-text-content h4,
  .rich-text-content h5,
  .rich-text-content h6 {
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  .rich-text-content a {
    color: #3182ce;
    text-decoration: underline;
  }
  .rich-text-content strong,
  .rich-text-content b {
    font-weight: bold;
  }
  .rich-text-content em,
  .rich-text-content i {
    font-style: italic;
  }
  .rich-text-content ul,
  .rich-text-content ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }
  .rich-text-content ul {
    list-style-type: disc;
  }
  .rich-text-content ol {
    list-style-type: decimal;
  }
  .rich-text-content code {
    background-color: #f1f1f1;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-family: monospace;
  }
  .rich-text-content blockquote {
    border-left: 4px solid #cbd5e0;
    padding-left: 1rem;
    font-style: italic;
    color: #4a5568;
  }
`

// Añade los estilos globales (solo si estamos en navegador)
if (typeof window !== "undefined") {
  const styleTag = document.createElement("style")
  styleTag.textContent = RichTextStyles
  document.head.appendChild(styleTag)
}

export default ProductInfo
