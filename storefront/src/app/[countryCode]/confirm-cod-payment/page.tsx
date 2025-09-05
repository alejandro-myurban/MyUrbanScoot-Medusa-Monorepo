"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { sdk } from "@lib/config"

export default function ConfirmCodPayment() {
  const { t } = useTranslation("confirmation")
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState("processing")
  const [message, setMessage] = useState(
    t("processing_message") 
  )

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage(t("error_no_token"))
      return
    }

    fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/admin/confirm-cod-payment?token=${token}`
    )
      .then(async (response) => {
        const data = await response.json()
        if (response.ok) {
          setStatus("success")
          setMessage(t("success_message")) 
          setStatus("error")
          setMessage(
            data.message || t("error_generic") 
          )
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        setStatus("error")
        setMessage(t("error_server_communication")) 
      })
  }, [token, t]) 
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {status === "success"
            ? t("title_success")
            : status === "error"
            ? t("title_error")
            : t("title_processing")}
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
            {t("back_to_shop_button")}
          </button>
        )}

        {status === "error" && (
          <button
            onClick={() => (window.location.href = "/contact")}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition"
          >
            {t("contact_support_button")}
          </button>
        )}
      </div>
    </div>
  )
}