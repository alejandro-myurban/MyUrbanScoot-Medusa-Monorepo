"use client"

import { useEffect, useState } from "react"

interface PayPalDebugProps {
  cart: any
}

const PayPalDebug: React.FC<PayPalDebugProps> = ({ cart }) => {
  const [envVars, setEnvVars] = useState<any>({})
  const [paypalAvailable, setPaypalAvailable] = useState(false)

  useEffect(() => {
    // Verificar variables de entorno del cliente
    setEnvVars({
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    })

    // Verificar si PayPal está disponible globalmente
    const checkPaypal = () => {
      if (typeof window !== 'undefined') {
        setPaypalAvailable(!!window.paypal)
        console.log("🔍 Window PayPal:", {
          available: !!window.paypal,
          buttons: !!window.paypal?.Buttons,
          version: window.paypal?.version
        })
      }
    }

    checkPaypal()
    
    // Verificar cada segundo durante 10 segundos
    const interval = setInterval(checkPaypal, 1000)
    setTimeout(() => clearInterval(interval), 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 mb-4">
      <h3 className="font-medium text-blue-900 mb-2">🔍 PayPal Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Variables de entorno:</strong>
          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </div>

        <div>
          <strong>PayPal Global:</strong>
          <span className={paypalAvailable ? "text-green-600" : "text-red-600"}>
            {paypalAvailable ? " ✅ Disponible" : " ❌ No disponible"}
          </span>
        </div>

        <div>
          <strong>Cart Payment Collection:</strong>
          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify({
              hasCollection: !!cart.payment_collection,
              sessions: cart.payment_collection?.payment_sessions?.map((s: any) => ({
                provider_id: s.provider_id,
                status: s.status,
                hasData: !!s.data,
                paypalOrderId: s.data?.paypalOrderId
              })) || []
            }, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Configuración recomendada:</strong>
          <div className="text-xs bg-white p-2 rounded mt-1">
            <div>1. Verifica que NEXT_PUBLIC_PAYPAL_CLIENT_ID esté en .env.local</div>
            <div>2. Reinicia el servidor de desarrollo después de añadir variables</div>
            <div>3. Verifica que el plugin de PayPal esté activo en medusa-config.js</div>
            <div>4. Asegúrate de que PayPalScriptProvider esté en el nivel superior</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PayPalDebug