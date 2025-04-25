"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { sdk } from "@lib/config" // Asegúrate de tener configurado el SDK de Medusa

export default function ConfirmCodPayment() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState("processing")
  const [message, setMessage] = useState(
    "Procesando tu confirmación de pago..."
  )
  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Token no proporcionado")
      return
    }

    // Enviar el token al backend para validación
    fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/admin/confirm-cod-payment?token=${token}`
    )
      .then(async (response) => {
        const data = await response.json()
        if (response.ok) {
          setStatus("success")
          setMessage(
            "¡Pago confirmado con éxito! Tu pedido está siendo procesado."
          )
        } else {
          setStatus("error")
          setMessage(
            data.message || "Ha ocurrido un error al confirmar el pago"
          )
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        setStatus("error")
        setMessage("Ha ocurrido un error al comunicarse con el servidor")
      })
  }, [token])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {status === "success"
            ? "¡Confirmación exitosa!"
            : status === "error"
            ? "Error en la confirmación"
            : "Confirmando pago"}
        </h1>

        {status === "processing" && (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        )}

        <p className="text-center mb-4">{message}</p>

        {status === "success" && (
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Volver a la tienda
          </button>
        )}

        {status === "error" && (
          <button
            onClick={() => (window.location.href = "/contact")}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition"
          >
            Contactar soporte
          </button>
        )}
      </div>
    </div>
  )
}
