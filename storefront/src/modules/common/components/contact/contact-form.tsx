"use client"

import React from "react"
import { SubmitButton } from "@/modules/checkout/components/submit-button"
import Input from "../input"
import i18n from "@/i18n/config"

interface ContactFormProps {
  formData: {
    fullName: string
    email: string
    subject: string
    phone: string
    message: string
  }
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  loading: boolean
  validationErrors?: Record<string, string[]> | null
}

const ContactForm: React.FC<ContactFormProps> = ({
  formData,
  handleChange,
  handleSubmit,
  loading,
  validationErrors,
}) => {
  // Convertir validationErrors al formato que espera Input
  const errors = validationErrors
    ? Object.fromEntries(
        Object.entries(validationErrors).map(([key, errorArray]) => [
          key,
          errorArray[0], // Tomar solo el primer error
        ])
      )
    : {}

  // Marcar todos los campos como "touched" si hay errores
  const touched = validationErrors
    ? Object.fromEntries(
        Object.keys(validationErrors).map((key) => [key, true])
      )
    : {}

  console.log("Errors para Input:", errors)
  console.log("Touched para Input:", touched)

  // Función helper para obtener errores de textarea
  const getTextareaError = (fieldName: string): string | null => {
    const errorArray = validationErrors?.[fieldName]
    return errorArray && errorArray.length > 0 ? errorArray[0] : null
  }

  return (
    <div className="lg:bg-gray-50 text-black lg:p-6 sm:p-8 rounded-2xl lg:shadow-md lg:border border-gray-200">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 font-archivoBlack uppercase">
        {i18n.t("contact_form.title")} {/* Título traducido */}
      </h2>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Nombre completo */}
        <div>
          <label htmlFor="fullName" className="sr-only">
            {i18n.t("contact_form.full_name_label")}
          </label>
          <Input
            type="text"
            id="fullName"
            name="fullName"
            label={i18n.t("contact_form.full_name_label")}
            value={formData.fullName}
            onChange={handleChange}
            errors={errors}
            touched={touched}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="sr-only">
            {i18n.t("contact_form.email_label")}
          </label>
          <Input
            type="email"
            id="email"
            name="email"
            label={i18n.t("contact_form.email_label")}
            value={formData.email}
            onChange={handleChange}
            required
            errors={errors}
            touched={touched}
          />
        </div>

        {/* Asunto */}
        <div>
          <label htmlFor="subject" className="sr-only">
            {i18n.t("contact_form.subject_label")}
          </label>
          <Input
            type="text"
            id="subject"
            name="subject"
            label={i18n.t("contact_form.subject_label")} 
            value={formData.subject}
            onChange={handleChange}
            errors={errors}
            touched={touched}
          />
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="phone" className="sr-only">
            {i18n.t("contact_form.phone_label")}
          </label>
          <Input
            type="tel"
            id="phone"
            name="phone"
            label={i18n.t("contact_form.phone_label")} 
            value={formData.phone}
            onChange={handleChange}
            errors={errors}
            touched={touched}
          />
        </div>

        {/* Mensaje */}
        <div>
          <label htmlFor="message" className="sr-only">
            {i18n.t("contact_form.message_placeholder")} 
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder={i18n.t("contact_form.message_placeholder")} 
            value={formData.message}
            onChange={handleChange}
            className={`w-full px-5 py-3 border rounded-xl ring-0 transition duration-200 hover:bg-gray-100 resize-y text-gray-800 focus:ring-0 focus:outline-none active:ring-0 ${
              getTextareaError("message")
                ? "border-red-300 focus:border-red-300 active:border-red-300 bg-red-50"
                : "border-gray-300 focus:border-gray-300 active:border-gray-300"
            }`}
            required
          />
          {getTextareaError("message") && (
            <p className="mt-1 text-sm text-red-600">
              {getTextareaError("message")}
            </p>
          )}
        </div>

        <SubmitButton
          data-testid="send-mail"
          className="w-full bg-gradient-to-r bg-black/90 text-white py-3 px-6 rounded-xl font-bold uppercase font-archivoBlack text-lg hover:from-gray-700 hover:to-gray-600 transition duration-300 shadow-lg"
        >
          {loading ? i18n.t("contact_form.sending_button") : i18n.t("contact_form.send_button")} 
        </SubmitButton>
      </form>
    </div>
  )
}

export default ContactForm
