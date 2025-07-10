import { Metadata } from "next"
import { notFound } from "next/navigation"
import Wrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Checkout",
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

export default async function Checkout() {
  const cart = await fetchCart()
  const customer = await getCustomer()
  
  // Obtener datos necesarios para el checkout
  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")
  
  if (!shippingMethods || !paymentMethods) {
    return <div>Error cargando métodos de envío o pago</div>
  }
  
  return (
    <div className="w-full">
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
      <div className="hidden small:block overflow-x-hidden">
        <div className="grid grid-cols-[1fr_600px] w-full max-w-screen-large pl-4 pr-4 mx-auto gap-x-8 py-4 sm:py-12">
          
          {/* Columna del formulario */}
          <div>
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
          <div className="relative">
            {/* Fondo gris que se extiende hasta el borde derecho */}
            <div className="absolute inset-y-0 left-0 right-0 bg-gray-200 -mr-[100vw]" />
            
            {/* Contenido del resumen - sticky en desktop */}
            <div className="sticky top-2 z-10">
              <CheckoutSummary cart={cart} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}