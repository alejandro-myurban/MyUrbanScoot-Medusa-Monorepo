import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading, Button } from "@medusajs/ui"

const STOREFRONT_BASE_URL = "https://storefront-production-e469.up.railway.app"

const ProductFrontendLinkWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const handle = data?.handle
  const title = data?.title
  const thumbnail = data?.thumbnail

  if (!handle) return null

  const productUrl = `${STOREFRONT_BASE_URL}/es/producto/${handle}`

  return (
    <Container className="mb-4 flex flex-col gap-y-4">
      <Heading level="h2">Ver en la tienda</Heading>

      <div className="flex items-center gap-x-4">
        {thumbnail && (
          <img
            src={thumbnail}
            alt={title ?? "Imagen del producto"}
            className="w-16 h-16 rounded-md object-cover border"
          />
        )}
        <div className="flex-1">
          <p className="font-medium text-sm">{title}</p>
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="small" variant="secondary">
              Ver producto en tienda
            </Button>
          </a>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default ProductFrontendLinkWidget
