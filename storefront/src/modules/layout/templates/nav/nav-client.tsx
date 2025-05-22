// components/NavClient.tsx
"use client"

import { useTranslation } from "react-i18next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import LanguageSwitcher from "@modules/layout/components/language-switcher"
import Login from "./google-login"

export default function NavClient() {
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
          Search
        </LocalizedClientLink>
      )}
      <LocalizedClientLink
        className="hover:text-ui-fg-base"
        href="/account"
        data-testid="nav-account-link"
      >
        {t("navigation.account")}
      </LocalizedClientLink>
      <LanguageSwitcher />
      <Login />
    </div>
  )
}
