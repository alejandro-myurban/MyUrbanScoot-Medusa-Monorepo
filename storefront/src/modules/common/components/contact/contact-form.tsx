"use client"

import React from "react"
import { SubmitButton } from "@/modules/checkout/components/submit-button" // Asegúrate de que esta ruta sea correcta
import Input from "../input"

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
}

const ContactForm: React.FC<ContactFormProps> = ({
  formData,
  handleChange,
  handleSubmit,
  loading,
}) => {
  return (
    <div className="lg:bg-gray-50 lg:p-6 sm:p-8 rounded-2xl lg:shadow-md lg:border border-gray-200">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 font-archivoBlack uppercase ">
        ENVÍANOS UN MENSAJE
      </h2>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fullName" className="sr-only">
            Nombre completo
          </label>
          <Input
            type="text"
            id="fullName"
            name="fullName"
            label="Nombre completo"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <Input
            type="email"
            id="email"
            name="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="subject" className="sr-only">
            Asunto
          </label>
          <Input
            type="text"
            id="subject"
            name="subject"
            label="Asunto"
            value={formData.subject}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="sr-only">
            Teléfono
          </label>
          <Input
            type="tel"
            id="phone"
            name="phone"
            label="Teléfono"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="message" className="sr-only">
            Escribe tu mensaje aquí...
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Escribe tu mensaje aquí..."
            value={formData.message}
            onChange={handleChange}
            className="w-full px-5 py-3 border border-gray-300 rounded-xl ring-0 transition duration-200 hover:bg-gray-100 resize-y text-gray-800 focus:ring-0 focus:outline-none active:ring-0 focus:border-gray-300 active:border-gray-300"
            required
          ></textarea>
        </div>
        <SubmitButton
          data-testid="send-mail"
          className="w-full bg-gradient-to-r bg-black/90 text-white py-3 px-6 rounded-xl font-bold  uppercase font-archivoBlack text-lg hover:from-gray-700 hover:to-gray-600 transition duration-300 shadow-lg"
        >
          Enviar
        </SubmitButton>
      </form>
    </div>
  )
}

export default ContactForm
