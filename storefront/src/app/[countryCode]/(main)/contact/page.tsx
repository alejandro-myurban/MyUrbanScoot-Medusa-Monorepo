"use client";

import React, { useState, useEffect } from "react";
import ContactForm from "../../../../modules/common/components/contact/contact-form";
import ContactInfoSection from "../../../../modules/common/components/contact/contact-info";
import SubmissionStatusDisplay from "../../../../modules/common/components/contact/contact-submission-status";
import InteractiveMap from "../../../../modules/common/components/contact/contact-map-holder";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    phone: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmissionStatus("idle");
    setErrorMessage("");

    console.log("📞 Enviando mensaje con datos:", formData);

    try {
      // CAMBIO CLAVE: Llama a tu nuevo API Route
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar el mensaje.');
      }

      console.log("✅ Mensaje enviado exitosamente");
      setSubmissionStatus("success");
      setFormData({
        fullName: "",
        email: "",
        subject: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      console.error("❌ Error en el envío del formulario:", error);
      setSubmissionStatus("error");
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Ocurrió un error desconocido al enviar el mensaje.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submissionStatus === "success") {
      const timer = setTimeout(() => {
        setSubmissionStatus("idle");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submissionStatus]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-12 font-inter">
      <div className="max-w-[90vw] w-full bg-white rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10">
        <div className="text-center font-archivoBlack mb-10">
          <h1
            className="
              text-3xl font-semibold uppercase mb-6 text-gray-900
              relative 
              w-max 
              mx-auto 
              after:content-['']
              after:absolute
              after:left-0 after:bottom-0
              after:w-full 
              after:h-1
              after:bg-mysGreen-100
            "
          >
            Contacta con nosotros
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-700">
            ¿Tienes alguna pregunta sobre nuestros patinetes eléctricos?{" "}
            Estamos aquí para ayudarte.
          </p>
        </div>

        <SubmissionStatusDisplay
          loading={loading}
          submissionStatus={submissionStatus}
          errorMessage={errorMessage}
          onTryAgain={() => setSubmissionStatus("idle")}
        />

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

        <InteractiveMap />
      </div>
    </div>
  );
}
