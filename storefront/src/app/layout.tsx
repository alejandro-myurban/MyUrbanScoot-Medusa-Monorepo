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
  title: {
    template: '%s | MyUrbanScoot',
    default: 'MyUrbanScoot | Todo para tu patinete eléctrico'
  },
  description: 'Tu tienda online especializada en repuestos y accesorios para patinetes eléctricos. Encuentra piezas de calidad, ruedas, baterías y mucho más.',
  keywords: ['patinetes eléctricos', 'repuestos', 'accesorios', 'ruedas', 'baterías', 'scooter eléctrico'],
  authors: [{ name: 'MyUrbanScoot' }],
  creator: 'MyUrbanScoot',
  publisher: 'MyUrbanScoot',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'MyUrbanScoot',
    title: 'MyUrbanScoot | Todo para tu patinete eléctrico',
    description: 'Tu tienda online especializada en repuestos y accesorios para patinetes eléctricos.',
    url: getBaseURL(),
    locale: 'es_ES',
    images: [
      {
        url: 'https://myurbanscoot.com/wp-content/uploads/2025/05/cropped-logo-myurbanscoot-vertical-2025-05-382x101.png',
        width: 1200,
        height: 630,
        alt: 'MyUrbanScoot - Accesorios para patinetes eléctricos',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyUrbanScoot | Todo para tu patinete eléctrico',
    description: 'Tu tienda online especializada en repuestos y accesorios para patinetes eléctricos.',
    creator: '@myurbanscoot', // Ajusta según tu cuenta de Twitter
    images: ['https://myurbanscoot.com/wp-content/uploads/2025/05/cropped-logo-myurbanscoot-vertical-2025-05-382x101.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Añade aquí tus códigos de verificación cuando los tengas
    // google: 'tu-codigo-google',
    // yandex: 'tu-codigo-yandex',
    // bing: 'tu-codigo-bing',
  },
  category: 'technology',
}

export default function RootLayout(props: {
  children: React.ReactNode
  params?: { countryCode?: string }
}) {
  const countryCode = props.params?.countryCode || "es"

  return (
    <html lang={countryCode} data-mode="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${poppins.variable} ${dmSans.variable} ${archivoBlack.variable} ${archivo.variable} font-archivo`}>
        <I18nProvider countryCode={countryCode}>
          <main className="relative">{props.children}</main>
        </I18nProvider>
      </body>
    </html>
  )
}