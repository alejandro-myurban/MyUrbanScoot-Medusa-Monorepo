import { getBaseURL } from '@lib/util/env'
import { Metadata } from 'next'
import 'styles/globals.css'

import ClientProviders from '../modules/client-provider/index'

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        {/* aquí montamos el proveedor de i18n sólo en cliente */}
        <ClientProviders>
          <main className="relative">{props.children}</main>
        </ClientProviders>
      </body>
    </html>
  )
}
