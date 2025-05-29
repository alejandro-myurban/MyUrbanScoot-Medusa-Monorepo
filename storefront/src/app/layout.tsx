import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import I18nProvider from "../i18n/I18nProvider"
import { Poppins } from "next/font/google"
import "styles/globals.css"

export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins", // ✅ Cambiado de --font-roboto a --font-poppins
  weight: ["400", "500"],
  display: "swap", // ✅ Añadido para mejor rendimiento
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: {
  children: React.ReactNode
  params?: { countryCode?: string }
}) {
  const countryCode = props.params?.countryCode || "es"

  return (
    <html lang={countryCode} data-mode="light">
      <body className={`${poppins.variable} font-poppins`}> {/* ✅ Añadida clase font-poppins */}
        <I18nProvider countryCode={countryCode}>
          <main className="relative">{props.children}</main>
        </I18nProvider>
      </body>
    </html>
  )
}