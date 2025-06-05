import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import I18nProvider from "../i18n/I18nProvider"
import { Poppins } from "next/font/google"
import { DM_Sans } from "next/font/google"
import "styles/globals.css"

export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins", // 
  weight: ["400", "500"],
  display: "swap", // 
})


export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmSans", //
  weight: ["400", "500"],
  display: "swap", //
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
      <body className={`${poppins.variable} ${dmSans.variable} font-dmSans`}>
        <I18nProvider countryCode={countryCode}>
          <main className="relative">{props.children}</main>
        </I18nProvider>
      </body>
    </html>
  )
}