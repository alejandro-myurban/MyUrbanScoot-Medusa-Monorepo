import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import I18nProvider from "../i18n/I18nProvider"
import { Poppins } from "next/font/google"
import { DM_Sans } from "next/font/google"
import { Archivo_Black } from "next/font/google"
import { Archivo } from "next/font/google"
import '@fortawesome/fontawesome-svg-core/styles.css'; // Importa los estilos CSS de Font Awesome
import { config } from '@fortawesome/fontawesome-svg-core';
import "styles/globals.css"

config.autoAddCss = false; // Desactiva la adición automática de CSS para Next.js


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

export const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  variable: "--font-archivoBlack", //
  weight: "400",
  display: "swap", //
})

export const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo", //
  weight: "400",
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
      <body className={`${poppins.variable} ${dmSans.variable} ${archivoBlack.variable} ${archivo.variable} font-archivo`}>
        <I18nProvider countryCode={countryCode}>
          <main className="relative">{props.children}</main>
        </I18nProvider>
      </body>
    </html>
  )
}