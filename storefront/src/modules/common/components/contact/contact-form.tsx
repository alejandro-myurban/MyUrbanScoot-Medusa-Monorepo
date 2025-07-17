"use client";

import React from "react";
import { SubmitButton } from "@/modules/checkout/components/submit-button"; // Asegúrate de que esta ruta sea correcta

interface ContactFormProps {
  formData: {
    fullName: string;
    email: string;
    subject: string;
    phone: string;
    message: string;
  };
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  loading: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({
  formData,
  handleChange,
  handleSubmit,
  loading,
}) => {
  return (
    <div className="bg-gray-50 p-6 sm:p-8 rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
        ENVÍANOS UN MENSAJE
      </h2>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fullName" className="sr-only">
            Nombre completo
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            placeholder="Nombre completo"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 text-gray-800"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 text-gray-800"
            required
          />
        </div>
        <div>
          <label htmlFor="subject" className="sr-only">
            Asunto
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            placeholder="Asunto"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 text-gray-800"
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="sr-only">
            Teléfono
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="Teléfono"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 text-gray-800"
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
            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 resize-y text-gray-800"
            required
          ></textarea>
        </div>
        <SubmitButton data-testid="send-mail"className="w-full bg-gradient-to-r from-gray-800 to-gray-700 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:from-gray-700 hover:to-gray-600 transition duration-300 shadow-lg uppercase font-dmSans">
          Enviar Mensaje
        </SubmitButton>
      </form>
    </div>
  );
};

export default ContactForm;