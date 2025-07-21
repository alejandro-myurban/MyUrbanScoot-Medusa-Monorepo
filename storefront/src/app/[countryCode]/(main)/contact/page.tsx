"use client";

import React, { useState, useEffect } from "react";
// Asegúrate de que estas rutas sean correctas para tu proyecto
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
      // REVERTIDO: Simulación de llamada a la API (como estaba originalmente)
      const response = await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simula éxito o fallo
          const success = Math.random() > 0.1; // 90% de probabilidad de éxito
          if (success) {
            console.log("✅ Mensaje enviado exitosamente (simulado)");
            resolve({ status: 200, message: "Mensaje enviado con éxito" });
          } else {
            console.log("❌ Error al enviar mensaje (simulado)");
            reject(new Error("Error de red o servicio al enviar el mensaje."));
          }
        }, 2000); // Simula 2 segundos de retraso de red
      });

      setSubmissionStatus("success");
      setFormData({
        fullName: "",
        email: "",
        subject: "",
        phone: "",
        message: "",
      }); // Limpia el formulario en caso de éxito
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
      }, 5000); // Restablece después de 5 segundos
      return () => clearTimeout(timer);
    }
  }, [submissionStatus]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-12 font-inter">
      <div className="max-w-[90vw] w-full bg-white rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10">
        <div className="text-center font-archivoBlack mb-20">
          <h1
            className="
              text-4xl sm:text-5xl font-archivoBlack uppercase font-bold text-gray-800 mb-4
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
          <p className="mt-4 text-lg sm:text-xl text-gray-700 font-archivo">
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
