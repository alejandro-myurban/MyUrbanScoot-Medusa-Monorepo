import { Metadata } from "next"
import CartTemplate from "@modules/cart/templates"

import { addCustomNameFee, enrichLineItems, retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

const fetchCart = async () => {
  try {
    await addCustomNameFee()
  } catch (err) {
    // aquí ya no debería reventar por undefined, pero capturamos cualquier otro fallo
    console.error("[fetchCart] addCustomNameFee failed:", err)
  }
  const cart = await retrieveCart()

  if (!cart) {
    return null
  }

  console.log("cart items and metadata:", cart.items?.map(item => ({ 
    id: item.id,
    title: item.title,
    metadata: item.metadata 
  })))

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id!)
    cart.items = enrichedItems as HttpTypes.StoreCartLineItem[]
  }

  return cart
}

export default async function Cart() {
  const cart = await fetchCart()
  const customer = await getCustomer()
  return <CartTemplate cart={cart} customer={customer} />
}
