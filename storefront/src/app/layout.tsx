import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import I18nProvider from "../i18n/I18nProvider"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { 
  children: React.ReactNode,
  params?: { countryCode?: string }
}) {
  // El countryCode puede venir como undefined en la raíz, así que usamos 'en' por defecto
  const countryCode = props.params?.countryCode || 'en'
  
  return (
    <html lang={countryCode} data-mode="light">
      <body>
        <I18nProvider countryCode={countryCode}>
          <main className="relative">{props.children}</main>
        </I18nProvider>
      </body>
    </html>
  )
}