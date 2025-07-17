import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  console.log("ShippingDetails", order)
  return (
    <div>
      <Heading level="h2" className="flex flex-row text-2xl text-black/90  my-6 font-archivoBlack uppercase font-bold">
        Envío	
      </Heading>
      <div className="flex flex-col sm:flex-row items-start gap-y-6 gap-x-8">
        <div
          className="flex flex-col w-full sm:w-1/3"
          data-testid="shipping-address-summary"
        >
          <Text className="txt-medium-plus font-archivo text-ui-fg-base mb-1">
            Shipping Address
          </Text>
          <Text className="txt-medium text-ui-fg-subtle font-archivo">
            {order.shipping_address?.first_name}{" "}
            {order.shipping_address?.last_name}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle font-archivo">
            {order.shipping_address?.address_1}{" "}
            {order.shipping_address?.address_2}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle font-archivo">
            {order.shipping_address?.postal_code},{" "}
            {order.shipping_address?.city}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle font-archivo">
            {order.shipping_address?.country_code?.toUpperCase()}
          </Text>
        </div>

        <div
          className="flex flex-col w-full sm:w-1/3 "
          data-testid="shipping-contact-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1 font-archivo">Contact</Text>
          <Text className="txt-medium text-ui-fg-subtle font-archivo">
            {order.shipping_address?.phone}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle font-archivo">{order.email}</Text>
        </div>

        <div
          className="flex flex-col w-full sm:w-1/3"
          data-testid="shipping-method-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1 font-archivo">Method</Text>
          <Text className="txt-medium text-ui-fg-subtle font-archivo">
            {(order as any).shipping_methods[0]?.name} (
            {convertToLocale({
              amount: order.shipping_methods?.[0].total ?? 0,
              currency_code: order.currency_code,
            })}{" "}
            )
          </Text>
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default ShippingDetails
