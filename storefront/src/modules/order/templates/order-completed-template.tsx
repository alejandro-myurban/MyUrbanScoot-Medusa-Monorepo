import { Heading } from "@medusajs/ui"
import { cookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const isOnboarding = cookies().get("_medusa_onboarding")?.value === "true"

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}

        <div
          className="flex flex-col gap-6 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          {/* Header de confirmación */}
          <div className="text-center pb-6">
            <Heading
              level="h1"
              className="text-ui-fg-base text-3xl mb-2 font-archivoBlack uppercase font-bold"
            >
              ¡Gracias por tu compra!
            </Heading>
            <p className="text-ui-fg-subtle text-lg font-archivoBlack">
              Tu pedido ha sido procesado exitosamente.
            </p>
          </div>

          {/* Detalles del pedido */}
          <section className="space-y-4">
            <OrderDetails order={order} />
          </section>

          {/* Resumen del pedido */}
          <section className="space-y-4">
            <Heading
              level="h2"
              className="text-2xl text-black/90  font-archivoBlack uppercase font-bold"
            >
              Resumen del pedido
            </Heading>
            <Items items={order.items} />
            <CartTotals totals={order} />
          </section>

          {/* Información de envío */}
          <section className="space-y-4">
            <ShippingDetails order={order} />
          </section>

          {/* Información de pago */}
          <section className="space-y-4">
            <PaymentDetails order={order} />
          </section>

          {/* Ayuda */}
          <section className="pt-6">
            <Help />
          </section>
        </div>
      </div>
    </div>
  )
}
