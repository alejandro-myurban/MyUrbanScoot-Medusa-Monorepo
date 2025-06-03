import { notFound } from "next/navigation"
import CartDropdown from "../cart-dropdown"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import LanguageSwitcher from "../language-switcher"

const fetchCart = async () => {
  const cart = await retrieveCart()

  if (!cart) {
    return null
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart.items, cart.region_id!)
    cart.items = enrichedItems
  }

  return cart
}

export default async function CartButton({ dark = false }: { dark?: boolean }) {
  const cart = await fetchCart()

  return (
    <>
      <CartDropdown dark={dark} cart={cart} />
      <LanguageSwitcher />
    </>
  )
}
