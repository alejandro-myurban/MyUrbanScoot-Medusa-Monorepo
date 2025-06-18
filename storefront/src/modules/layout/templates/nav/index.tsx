// components/Nav.tsx (Server Component)
import { Suspense } from "react"
import { listRegions } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import NavClient from "./nav-client"
import VinylNavDropdown from "../footer/dropdown-test"
import { getCategoriesList } from "@lib/data/categories"
import NavConditional from "../../components/nav-conditional"
import DarkVinylNavDropdown from "../footer/dropdown-test-dark"
import MobileMenu from "../../components/mobile-nav"

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "../../../../src/components/ui/navigation-menu"
import ActiveNavItem from "./active"

export default async function Nav() {
  const regions = await listRegions()
  const { product_categories } = await getCategoriesList(0, 6)

  // --------------------------------------------------
  // Navbar principal (claro)
  // --------------------------------------------------
  const mainNavbar = (
    <header className="relative h-16 w-full bg-white/95 backdrop-blur-md shadow-sm z-50 ">
      <nav className="w-full max-w-screen-large mx-auto px-4 sm:px-6 flex items-center justify-between h-full lg:justify-between">
        {/* En móvil: hamburguesa a la izquierda */}
        <div className="lg:hidden">
          <MobileMenu categories={product_categories} isDark={false} />
        </div>

        {/* Logo - centrado en móvil, normal en desktop */}
        <div className="flex-1 flex justify-center lg:flex-none lg:justify-start lg:flex lg:items-center lg:gap-4">
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
              className="block sm:hidden transition-all duration-200 hover:scale-105"
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
              {/* <NavigationMenuItem>
                <LocalizedClientLink href="/category/noticias-patinete-electrico">
                  <NavigationMenuLink className="text-black/80 hover:text-black ">
                    <ActiveNavItem
                      href="/blog"
                      matchPatterns={["/category/"]}
                      className="text-black/80 hover:text-black"
                    >
                      Blog
                    </ActiveNavItem>
                  </NavigationMenuLink>
                </LocalizedClientLink>
              </NavigationMenuItem> */}

              <NavigationMenuItem>
                <DarkVinylNavDropdown
                  isDark={true}
                  categories={product_categories}
                />
              </NavigationMenuItem>

              <NavigationMenuItem>
                <LocalizedClientLink href="/spare-parts">
                  <NavigationMenuLink className="text-black/80 hover:text-black">
                      <ActiveNavItem
                      className="text-black/80 hover:text-black after:bg-mysGreen-100 after:absolute after:h-0.5 after:rounded-xl after:w-0 after:bottom-0.5 after:left-0 hover:after:w-full after:transition-all after:duration-300"
                      href="/spare_parts"
                      translationKey="navigation.spare_parts"
                    />
                  </NavigationMenuLink>
                </LocalizedClientLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <LocalizedClientLink href="/categories/patinetes-electricos">
                  <NavigationMenuLink className="text-white/80 hover:text-white">
                    <ActiveNavItem
                      className="text-black/80 hover:text-black after:bg-mysGreen-100 after:absolute after:h-0.5 after:rounded-xl after:w-0 after:bottom-0.5 after:left-0 hover:after:w-full after:transition-all after:duration-300"
                      href="/categories/patinetes-electricos"
                      translationKey="navigation.scoot"
                    />
                  </NavigationMenuLink>
                </LocalizedClientLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <LocalizedClientLink href="">
                  <NavigationMenuLink className="text-white/80 hover:text-white">
                    <ActiveNavItem
                      className="text-black/80 hover:text-black after:bg-mysGreen-100 after:absolute after:h-0.5 after:rounded-xl after:w-0 after:bottom-0.5 after:left-0 hover:after:w-full after:transition-all after:duration-300"
                      href=""
                      translationKey="navigation.circuit_zone"
                    />
                  </NavigationMenuLink>
                </LocalizedClientLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* DERECHA: NavClient + CartButton */}
        <div className="flex items-center gap-x-3 sm:gap-x-6">
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
    <header className="relative h-16 w-full bg-black/90 backdrop-blur-md z-50 shadow-lg">
      <nav className="w-full max-w-screen-large mx-auto px-4 sm:px-6 flex items-center justify-between h-full lg:justify-between">
        {/* En móvil: hamburguesa a la izquierda */}
        <div className="lg:hidden">
          <MobileMenu categories={product_categories} isDark={true} />
        </div>

        {/* Logo - centrado en móvil, normal en desktop */}
        <div className="flex-1 flex justify-center lg:flex-none lg:justify-start lg:flex lg:items-center lg:gap-4">
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
              className="block sm:hidden transition-all duration-200 hover:scale-105"
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
              {/* <NavigationMenuItem>
                <LocalizedClientLink href="/category/noticias-patinete-electrico">
                  <NavigationMenuLink className="text-white/80 hover:text-white ">
                    <ActiveNavItem
                      className="text-white/80 hover:text-white after:bg-mysGreen-100 after:absolute after:h-0.5 after:rounded-xl after:w-0 after:bottom-0.5 after:left-0 hover:after:w-full after:transition-all after:duration-300"
                      href="/blog"
                      translationKey="navigation.blog"
                    />
                  </NavigationMenuLink>
                </LocalizedClientLink>
              </NavigationMenuItem> */}

              <NavigationMenuItem>
                <DarkVinylNavDropdown
                  isDark={false}
                  categories={product_categories}
                />
              </NavigationMenuItem>

              <NavigationMenuItem>
                <LocalizedClientLink href="/spare-parts">
                  <NavigationMenuLink className="text-white/80 hover:text-white">
                    <ActiveNavItem
                      className="text-white/80 hover:text-white after:bg-mysGreen-100 after:absolute after:h-0.5 after:rounded-xl after:w-0 after:bottom-0.5 after:left-0 hover:after:w-full after:transition-all after:duration-300"
                      href="/spare_parts"
                      translationKey="navigation.spare_parts"
                    />
                  </NavigationMenuLink>
                </LocalizedClientLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <LocalizedClientLink href="/spare-parts">
                  <NavigationMenuLink className="text-white/80 hover:text-white">
                    <ActiveNavItem
                      className="text-white/80 hover:text-white after:bg-mysGreen-100 after:absolute after:h-0.5 after:rounded-xl after:w-0 after:bottom-0.5 after:left-0 hover:after:w-full after:transition-all after:duration-300"
                      href="/blog"
                      translationKey="navigation.scoot"
                    />
                  </NavigationMenuLink>
                </LocalizedClientLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <LocalizedClientLink href="/spare-parts">
                  <NavigationMenuLink className="text-white/80 hover:text-white">
                    <ActiveNavItem
                      className="text-white/80 hover:text-white after:bg-mysGreen-100 after:absolute after:h-0.5 after:rounded-xl after:w-0 after:bottom-0.5 after:left-0 hover:after:w-full after:transition-all after:duration-300"
                      href="/blog"
                      translationKey="navigation.circuit_zone"
                    />
                  </NavigationMenuLink>
                </LocalizedClientLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* DERECHA: NavClient + CartButton (dark) */}
        <div className="flex items-center gap-x-3 sm:gap-x-6">
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

  // Usar NavConditional para manejar la lógica de renderizado
  return <NavConditional mainNavbar={mainNavbar} darkNavbar={darkNavbar} />
}
