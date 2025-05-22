// components/Nav.tsx
import { Suspense } from "react"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import NavClient from "./nav-client"

export default async function Nav() {
  const regions = await listRegions()

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b bg-white border-ui-border-base">
        <nav className="content-container flex items-center justify-between w-full h-full">
          <div className="flex-1 flex items-center">
            <SideMenu regions={regions} />
          </div>

          <LocalizedClientLink
            href="/"
            className="uppercase txt-compact-xlarge-plus hover:text-ui-fg-base"
          >
            MyUrbanScoot
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
