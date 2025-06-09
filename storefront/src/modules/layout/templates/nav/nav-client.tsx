// components/NavClient.tsx
"use client"

import { useTranslation } from "react-i18next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CircleUserRound, Search } from "lucide-react"
import SearchModal from "@modules/search-algolia/components/modal"

export default function NavClient({ dark = false }: { dark?: boolean }) {
  const { t } = useTranslation()

  return (
    <div className="hidden small:flex items-center gap-x-6 h-full">
      <SearchModal dark={dark} />
      <LocalizedClientLink
        className={`hover:text-ui-fg-base ${
          dark ? "text-white/80 hover:text-white" : "text-black"
        }`}
        href="/contact"
        scroll={false}
        data-testid="nav-search-link"
      >
        Contacto
      </LocalizedClientLink>
    </div>
  )
}
