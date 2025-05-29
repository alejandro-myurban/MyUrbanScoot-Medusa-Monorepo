// components/Nav.tsx
import { Suspense } from "react"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import NavClient from "./nav-client"
import VinylNavDropdown from "../footer/dropdown-test"
import { getCategoriesList } from "@lib/data/categories"

export default async function Nav() {
  const regions = await listRegions()
  const { product_categories } = await getCategoriesList(0, 6)
  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b bg-white border-ui-border-base">
        <nav className="content-container flex items-center justify-between w-full h-full">
          <div className="flex-1 flex items-center gap-5">
            <SideMenu regions={regions} />
            <LocalizedClientLink
              href="/category/noticias-patinete-electrico"
              className="hover:text-ui-fg-base"
            >
              Blog
            </LocalizedClientLink>
            <VinylNavDropdown categories={product_categories} />
            <LocalizedClientLink href="/spare-parts" className="hover:text-ui-fg-base">
              Recambios
            </LocalizedClientLink>
          </div>

          <LocalizedClientLink
            href="/"
            className="uppercase txt-compact-xlarge-plus hover:text-ui-fg-base"
          >
            <img
              className="w-40"
              style={{ width: "200px" }}
              src="https://myurbanscoot.com/wp-content/uploads/2025/05/cropped-logo-myurbanscoot-vertical-2025-05-382x101.png"
            />
          </LocalizedClientLink>

          <div className="flex-1 flex items-center justify-end gap-x-6">
            <NavClient />

            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
