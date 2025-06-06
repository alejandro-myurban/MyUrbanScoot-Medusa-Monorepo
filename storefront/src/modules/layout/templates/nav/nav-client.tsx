// components/NavClient.tsx
"use client"

import { useTranslation } from "react-i18next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import LanguageSwitcher from "@modules/layout/components/language-switcher"
import Login from "./google-login"
import { CircleUserRound, Search } from "lucide-react"
import { MagnifyingGlass } from "@medusajs/icons"

export default function NavClient({ dark = false }: { dark?: boolean }) {
  const { t } = useTranslation()

  return (
    <div className="hidden small:flex items-center gap-x-6 h-full">
      {process.env.NEXT_PUBLIC_FEATURE_SEARCH_ENABLED && (
        <LocalizedClientLink
          className="hover:text-ui-fg-base"
          href="/search"
          scroll={false}
          data-testid="nav-search-link"
        >
          <Search
            className={`hover:text-ui-fg-base ${
              dark ? "text-white/80 hover:text-white" : "text-black"
            }`}
          />
        </LocalizedClientLink>
      )}
      <LocalizedClientLink
        className="text-white/80 hover:text-white"
        href="/contact"
        scroll={false}
        data-testid="nav-search-link"
      >
        Contacto
      </LocalizedClientLink>
      <LocalizedClientLink
        className={`hover:text-ui-fg-base ${
          dark ? "text-white/80 hover:text-white" : "text-black"
        }`}
        href="/account"
        data-testid="nav-account-link"
      >
        <CircleUserRound
          className={`hover:text-ui-fg-base ${
            dark ? "text-white/80 hover:text-white" : "text-black"
          }`}
        />
      </LocalizedClientLink>
    </div>
  )
}
