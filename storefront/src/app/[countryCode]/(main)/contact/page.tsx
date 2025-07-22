"use client"

import React, { useState, useEffect, useCallback } from "react"
import ContactForm from "../../../../modules/common/components/contact/contact-form"
import ContactInfoSection from "../../../../modules/common/components/contact/contact-info"
import SubmissionStatusDisplay from "../../../../modules/common/components/contact/contact-submission-status"
import InteractiveMap from "../../../../modules/common/components/contact/contact-map-holder"

type SubmissionStatus = "idle" | "success" | "error"

const defaultFormData = {
  fullName: "",
  email: "",
  subject: "",
  phone: "",
  message: "",
}

export default function ContactPage() {
  const [formData, setFormData] = useState(defaultFormData)
  const [loading, setLoading] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
    },
    []
  )

  const simulateApiCall = () => {
    return new Promise<{ status: number; message: string }>((resolve, reject) => {
      setTimeout(() => {
        const success = Math.random() > 0.1
        success
          ? resolve({ status: 200, message: "Mensaje enviado con éxito" })
          : reject(new Error("Error de red o servicio al enviar el mensaje."))
      }, 2000)
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setSubmissionStatus("idle")
    setErrorMessage("")

    console.log("📞 Enviando mensaje con datos:", formData)

    try {
      await simulateApiCall()
      setSubmissionStatus("success")
      setFormData(defaultFormData)
    } catch (error) {
      console.error("❌ Error en el envío del formulario:", error)
      setSubmissionStatus("error")
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error desconocido al enviar el mensaje."
      )
    } finally {
      setLoading(false)
    }
  }

  // Auto reset después del éxito
  useEffect(() => {
    if (submissionStatus === "success") {
      const timer = setTimeout(() => {
        setSubmissionStatus("idle")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [submissionStatus])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-12 font-inter">
      <div className="max-w-[90vw] w-full bg-white rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10">
        {/* Título principal */}
        <div className="text-center font-archivoBlack mb-20">
          <h1 className="text-4xl sm:text-5xl font-bold uppercase text-gray-800 mb-4 relative w-max mx-auto after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-mysGreen-100">
            Contacta con nosotros
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-700 font-archivo">
            ¿Tienes alguna pregunta sobre nuestros patinetes eléctricos? Estamos aquí para ayudarte.
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
            <ContactForm
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              loading={loading}
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
