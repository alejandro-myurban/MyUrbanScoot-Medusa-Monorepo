"use client"

import React, { useState, useEffect } from "react"
import ContactForm from "@/modules/common/components/contact/contact-form"
import ContactInfoSection from "@/modules/common/components/contact/contact-info"
import SubmissionStatusDisplay from "@/modules/common/components/contact/contact-submission-status"
import InteractiveMap from "@/modules/common/components/contact/contact-map-holder"
import { sdk } from "@/lib/config"
import { validateContactForm } from "@/lib/schemas/contact-form"
import i18n from "@/i18n/config"

// Define ContactFormData locally to ensure all fields are required strings
type ContactFormData = {
  fullName: string
  email: string
  subject: string
  phone: string
  message: string
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: "",
    email: "",
    subject: "",
    phone: "",
    message: "",
  })

  const [loading, setLoading] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "success" | "error"
  >("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))

    // Limpiar errores de validación del campo cuando el usuario empieza a escribir
    if (validationErrors?.[name]) {
      setValidationErrors((prev) => {
        if (!prev) return null
        const newErrors = { ...prev }
        delete newErrors[name]
        return Object.keys(newErrors).length > 0 ? newErrors : null
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setSubmissionStatus("idle")
    setErrorMessage("")
    setValidationErrors(null)

    console.log("📞 Enviando mensaje con datos:", formData)

    // Validación del frontend
    const validation = validateContactForm(formData)
    
    if (!validation.success) {
      console.log("❌ Errores de validación:", validation.errors)
      setValidationErrors(
        validation.errors
          ? Object.fromEntries(
              Object.entries(validation.errors).filter(
                ([, v]) => Array.isArray(v)
              ) as [string, string[]][]
            )
          : null
      )
      setLoading(false)
      return
    }

    try {
      // Llamada a tu backend de Medusa
      const response = await sdk.client.fetch(
        `/store/contact`,
        {
          method: "POST",
          body: validation.data, // Usar datos validados
        }
      )

      console.log("✅ Mensaje enviado exitosamente")
      setSubmissionStatus("success")
      setFormData({
        fullName: "",
        email: "",
        subject: "",
        phone: "",
        message: "",
      })
    } catch (error) {
      console.error("❌ Error en el envío del formulario:", error)
      setSubmissionStatus("error")
      
      // Manejar errores específicos del backend
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        // 🟢 Usar i18n para el mensaje de error
        setErrorMessage(i18n.t("contact_page.unknown_error"))
      }
    } finally {
      setLoading(false)
    }
  }

  // Auto reset después del éxito
  useEffect(() => {
    if (submissionStatus === "success") {
      const timer = setTimeout(() => {
        setSubmissionStatus("idle")
      }, 5000) // Restablece después de 5 segundos
      return () => clearTimeout(timer)
    }
  }, [submissionStatus])

  return (
    <div className="min-h-screen max-w-screen-large mx-auto text-white flex flex-col items-center py-12 font-inter">
      <div className="lg:max-w-[90vw] w-full bg-white rounded-3xl p-6 sm:p-8 lg:p-10">
        <div className="text-center font-archivoBlack mb-20">
          <h1
            className="
              text-4xl sm:text-5xl font-archivoBlack uppercase font-bold text-gray-800 mb-4
              relative 
              lg:w-max 
              mx-auto 
              lg:after:content-['']
              lg:after:absolute
                lg:after:left-0 after:bottom-0
                lg:after:w-full 
                lg:after:h-1
                lg:after:bg-mysGreen-100
            "
          >
            {/* 🟢 Reemplazar el texto fijo con la clave de traducción */}
            {i18n.t("contact_page.title")}
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-700 font-archivo">
            {/* 🟢 Reemplazar el texto fijo con la clave de traducción */}
            {i18n.t("contact_page.subtitle")}
          </p>
        </div>

        {/* Estado del envío */}
        <SubmissionStatusDisplay
          loading={loading}
          submissionStatus={submissionStatus}
          errorMessage={errorMessage}
          onTryAgain={() => setSubmissionStatus("idle")}
        />

        {/* Formulario y datos de contacto */}
        {submissionStatus === "idle" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-12 mb-24">
            <ContactForm
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              loading={loading}
              validationErrors={validationErrors}
            />
            <ContactInfoSection />
          </div>
        )}

        {/* Mapa interactivo */}
        <InteractiveMap />
      </div>
    </div>
  )
}
