// components/Nav.tsx (Server Component)
import { Suspense, useState } from "react"
import { listRegions } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import NavClient from "./nav-client"
import VinylNavDropdown from "../footer/dropdown-test"
import { getCategoriesList } from "@lib/data/categories"
import ScrollNavWrapper from "../../components/scroll-nav-wrapper"
import DarkVinylNavDropdown from "../footer/dropdown-test-dark"
import DarkSideMenu from "@modules/layout/components/side-menu/dark-menu"
import MobileMenu from "../../components/mobile-nav"

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "../../../../src/components/ui/navigation-menu"
import ActiveNavItem from "./active"

export default async function Nav() {
  const regions = await listRegions()
  const { product_categories } = await getCategoriesList(0, 6)

  // --------------------------------------------------
  // Navbar principal (claro)
  // --------------------------------------------------
  const mainNavbar = (
    <header className="relative h-16 w-full border-b bg-white/95 backdrop-blur-md border-ui-border-base shadow-sm">
      <nav className="content-container flex items-center justify-between h-full">
        {/* IZQUIERDA: Logo + Menu Móvil */}
        <div className="flex items-center gap-4">
          {/* Menú hamburguesa - solo visible en móvil */}
          <div className="lg:hidden">
            <MobileMenu categories={product_categories} isDark={false} />
          </div>

          <LocalizedClientLink
            href="/"
            className="uppercase txt-compact-xlarge-plus text-white hover:text-white/90 transition-all duration-200"
          >
            <img
              className="w-40 hidden sm:block transition-all duration-200 hover:scale-105 max-w-[200px] sm:max-w-[250px] lg:max-w-[300px]"
              style={{ width: "300px" }}
              src="/logomys.png"
              alt="MyUrbanScoot Logo"
            />
            <img
              className="w-40 block sm:hidden transition-all duration-200 hover:scale-105 max-w-[200px] sm:max-w-[250px] lg:max-w-[300px]"
              style={{ width: "150px" }}
              src="/logomyswide.png"
              alt="MyUrbanScoot Logo"
            />
          </LocalizedClientLink>
        </div>

        {/* CENTRO: NavigationMenu - Solo visible en desktop */}
        <div className="hidden lg:flex flex-1 justify-center">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-6">
              <NavigationMenuItem>
                <LocalizedClientLink href="/category/noticias-patinete-electrico">
                  <NavigationMenuLink className="text-black/80 hover:text-black">
                    <ActiveNavItem href="/blog">Blog</ActiveNavItem>
                  </NavigationMenuLink>
                </LocalizedClientLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <VinylNavDropdown categories={product_categories} />
              </NavigationMenuItem>

              <NavigationMenuItem>
                <LocalizedClientLink href="/spare-parts">
                  <NavigationMenuLink className="text-black/80 hover:text-black">
                    Recambios
                  </NavigationMenuLink>
                </LocalizedClientLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* DERECHA: NavClient + CartButton */}
        <div className="flex items-center gap-x-3 sm:gap-x-6">
          {/* NavClient - oculto en móvil muy pequeño si es necesario */}
          <div className="hidden sm:block">
            <NavClient />
          </div>

          <Suspense
            fallback={
              <LocalizedClientLink
                className="hover:text-ui-fg-base flex gap-2 transition-colors duration-200"
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
  )

  // --------------------------------------------------
  // Navbar alternativo (oscuro)
  // --------------------------------------------------
  const darkNavbar = (
    <header className="relative h-16 w-full border-b bg-black/90 backdrop-blur-md z-50 border-gray-800 shadow-lg">
      <nav className="content-container px-4 small:px-6 flex items-center justify-between h-full">
        {/* IZQUIERDA: Logo + Menu Móvil */}
        <div className="flex items-center gap-4">
          {/* Menú hamburguesa - solo visible en móvil */}
          <div className="lg:hidden">
            <MobileMenu categories={product_categories} isDark={true} />
          </div>

          <LocalizedClientLink
            href="/"
            className="uppercase txt-compact-xlarge-plus text-white hover:text-white/90 transition-all duration-200"
          >
            <img
              className="w-40 hidden sm:block transition-all duration-200 hover:scale-105 max-w-[200px] sm:max-w-[250px] lg:max-w-[300px]"
              style={{ width: "300px" }}
              src="/logomys.png"
              alt="MyUrbanScoot Logo"
            />
            <img
              className="w-40 block sm:hidden transition-all duration-200 hover:scale-105 max-w-[200px] sm:max-w-[250px] lg:max-w-[300px]"
              style={{ width: "150px" }}
              src="/logomyswide.png"
              alt="MyUrbanScoot Logo"
            />
          </LocalizedClientLink>
        </div>

        {/* CENTRO: NavigationMenu (dark) - Solo visible en desktop */}
        <div className="hidden lg:flex flex-1 justify-center">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-6">
              <NavigationMenuItem>
                <LocalizedClientLink href="/category/noticias-patinete-electrico">
                  <NavigationMenuLink className="text-white/80 hover:text-white">
                    <ActiveNavItem className="text-white" href="/blog">Blog</ActiveNavItem>
                  </NavigationMenuLink>
                </LocalizedClientLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <DarkVinylNavDropdown categories={product_categories} />
              </NavigationMenuItem>

              <NavigationMenuItem>
                <LocalizedClientLink href="/spare-parts">
                  <NavigationMenuLink className="text-white/80 hover:text-white">
                    <span className="text-white/80 hover:text-white">
                      Recambios
                    </span>
                  </NavigationMenuLink>
                </LocalizedClientLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* DERECHA: NavClient + CartButton (dark) */}
        <div className="flex items-center gap-x-3 sm:gap-x-6">
          {/* NavClient - oculto en móvil muy pequeño si es necesario */}
          <div className="hidden sm:block">
            <NavClient dark={true} />
          </div>

          <Suspense
            fallback={
              <LocalizedClientLink
                className="text-white/80 hover:text-white flex gap-2 transition-colors duration-200"
                href="/cart"
                data-testid="nav-cart-link"
              >
                Cart (0)
              </LocalizedClientLink>
            }
          >
            <CartButton dark={true} />
          </Suspense>
        </div>
      </nav>
    </header>
  )

  return (
    <ScrollNavWrapper alternativeNavbar={darkNavbar}>
      {mainNavbar}
    </ScrollNavWrapper>
  )
}
