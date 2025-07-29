import { Metadata } from "next"
import { notFound } from "next/navigation"
import Wrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import {
  listCartShippingMethods,
  listCartShippingMethodsWithTranslations,
} from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"
import { cookies } from "next/headers"

export const metadata: Metadata = {
  title: "Checkout",
}

type Props = {
  params: { countryCode: string }
}

const fetchCart = async () => {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id!)
    cart.items = enrichedItems as HttpTypes.StoreCartLineItem[]
  }

  return cart
}

export default async function Checkout({ params }: Props) {
  const cart = await fetchCart()
  const customer = await getCustomer()
  const cookieStore = cookies()
  const storedValue = cookieStore.get("i18next")?.value

  // Obtener datos necesarios para el checkout
  const shippingMethods = await listCartShippingMethodsWithTranslations(
    cart.id,
    storedValue
  )
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return <div>Error cargando métodos de envío o pago</div>
  }

  return (
      <div className="w-full min-h-screen">
        {/* Layout para mobile */}
        <div className="block small:hidden">
          {/* Resumen sticky en mobile */}
          <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
            <div className="px-4 py-2">
              <CheckoutSummary cart={cart} />
            </div>
          </div>

          {/* Formulario en mobile */}
          <div className="px-4 py-4">
            <Wrapper cart={cart}>
              <CheckoutForm
                initialCart={cart}
                customer={customer}
                initialShippingMethods={shippingMethods}
                initialPaymentMethods={paymentMethods}
              />
            </Wrapper>
          </div>
        </div>

        {/* Layout para desktop */}
        <div className="hidden small:block">
          <div className="grid grid-cols-[1fr_600px] w-full max-w-screen-large pl-4 pr-4 mx-auto gap-x-8 py-4 sm:py-12">
            {/* Columna del formulario */}
            <div className="min-h-0">
              {" "}
              {/* min-h-0 ayuda con el sticky */}
              <Wrapper cart={cart}>
                <CheckoutForm
                  initialCart={cart}
                  customer={customer}
                  initialShippingMethods={shippingMethods}
                  initialPaymentMethods={paymentMethods}
                />
              </Wrapper>
            </div>

            {/* Columna del resumen */}
            <div className="relative min-h-0">
              {" "}
              {/* min-h-0 ayuda con el sticky */}
              {/* Fondo gris que se extiende hasta el borde derecho */}
              <div className="absolute inset-y-0 left-0 right-0 bg-gray-200 -mr-[100vw]" />
              {/* Contenido del resumen - sticky en desktop */}
              <div
                className="sticky z-10"
                style={{
                  top: "1rem", // 16px from top
                  alignSelf: "flex-start", // Importante para grid/flex
                }}
              >
                <CheckoutSummary cart={cart} />
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
