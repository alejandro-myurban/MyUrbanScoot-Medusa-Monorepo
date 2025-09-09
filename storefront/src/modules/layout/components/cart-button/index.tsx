import { notFound } from "next/navigation"
import CartDropdown from "../cart-dropdown"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import LanguageSwitcher from "../language-switcher"
import { CircleUserIcon, UserRound } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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
      <LocalizedClientLink href="/account">
        <UserRound className={dark ? "text-white/90 hover:text-white" : "text-black/90 hover:text-black "} />
      </LocalizedClientLink>
      <CartDropdown dark={dark} cart={cart} />
      <div className="hidden small:flex items-center gap-x-6 h-full">
        <LanguageSwitcher color={dark ? "text-white/90" : "text-black/90"} />
      </div>
    </>
  )
}
