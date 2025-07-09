import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading } from "@medusajs/ui"
// import {STORE_CORS} from "../../lib/constants"

const ProductFrontendLinkWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const handle = data?.handle

  
  if (!handle) return null
  // console.log("storecors" ,STORE_CORS)

  const frontendUrl = `https://storefront-production-e469.up.railway.app/es/producto/${handle}`
  console.log(frontendUrl)

  return (
    <Container className="mb-4">
      <Heading level="h2" className="mb-2">Ver en la tienda</Heading>
      <a
        href={frontendUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ui-fg-interactive underline text-sm"
      >
        Ir al producto →
      </a>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before", 
})

export default ProductFrontendLinkWidget
