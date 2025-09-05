import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading, Button, Text, Badge } from "@medusajs/ui"
import { ExternalLink, Eye } from "lucide-react"

const STOREFRONT_BASE_URL = "https://storefront-production-e469.up.railway.app"

const ProductFrontendLinkWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const handle = data?.handle
  const title = data?.title
  const thumbnail = data?.thumbnail
  const status = data?.status

  if (!handle) return null

  const productUrl = `${STOREFRONT_BASE_URL}/es/producto/${handle}`

  return (
    <Container className="divide-y divide-ui-border-base mb-4 overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-x-4 px-6 py-4">
        {thumbnail && (
          <div className="relative group">
            <img
              src={thumbnail}
              alt={title ?? "Imagen del producto"}
              className="w-20 h-20 rounded-lg object-cover border border-ui-border-base transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 rounded-lg bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
        
        <div className="flex-1 space-y-2">
          <div>
            <Text className="font-medium text-ui-fg-base">{title}</Text>
            <Text className="text-ui-fg-subtle text-xs">
              {STOREFRONT_BASE_URL}/es/producto/{handle}
            </Text>
          </div>
          
          <div className="flex items-center gap-x-2">
            <a
              href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button 
                size="small"
                variant="secondary"
                className="group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-x-2">
                  <ExternalLink className="h-4 w-4" />
                  Ver en tienda
                </span>
                <div className="absolute inset-0 bg-ui-bg-base-hover transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Button>
            </a>
            
            <Button
              size="small"
              variant="transparent"
              onClick={() => navigator.clipboard.writeText(productUrl)}
              className="text-ui-fg-subtle hover:text-ui-fg-base"
            >
              Copiar enlace
            </Button>
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default ProductFrontendLinkWidget
