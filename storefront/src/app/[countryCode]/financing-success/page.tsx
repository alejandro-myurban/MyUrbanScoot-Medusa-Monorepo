"use client"

import { CheckCircle2, Home, Mail, Phone } from "lucide-react"
import { useRouter } from "next/navigation"

export default function FinancingSuccessPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-400 via-white to-gray-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header con logo */}
        <div className="text-center flex flex-col justify-center items-center mb-12">
          <div className="items-center justify-center hidden lg:block rounded-2xl mb-10">
            <img className="max-w-[500px]" src="/logomys.png" alt="MYS Logo" />
          </div>
          <div className="items-center justify-center block lg:hidden rounded-2xl mb-10">
            <img
              className="max-w-[300px]"
              src="/logomyswide.png"
              alt="MYS Logo"
            />
          </div>
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-12 text-center space-y-8">
            {/* Icono de éxito */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </div>

            {/* Título principal */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900 font-archivoBlack uppercase">
                ¡Solicitud Enviada!
              </h1>
              <h2 className="text-2xl font-semibold text-green-600">
                Tu solicitud de financiación ha sido recibida con éxito
              </h2>
            </div>

            {/* Mensaje informativo */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 font-archivo leading-relaxed">
                Hemos recibido tu solicitud de financiación correctamente.
                Nuestro equipo la revisará y se pondrá en contacto contigo en un
                plazo máximo de{" "}
                <span className="font-semibold text-green-700">
                  24-48 horas
                </span>
                .
              </p>
            </div>

            {/* Próximos pasos */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                ¿Qué ocurre ahora?
              </h3>
              <div className="text-left space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-blue-600">1</span>
                  </div>
                  <p className="text-gray-700">
                    Revisaremos tu documentación y datos proporcionados
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-blue-600">2</span>
                  </div>
                  <p className="text-gray-700">
                    Evaluaremos tu solicitud de financiación
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-blue-600">3</span>
                  </div>
                  <p className="text-gray-700">
                    Te contactaremos con la respuesta y siguientes pasos
                  </p>
                </div>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                ¿Necesitas ayuda?
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-5 h-5" />
                  <span className="text-sm">info@mys.com</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <span className="text-sm">+34 600 000 000</span>
                </div>
              </div>
            </div>

            {/* Botón de vuelta al inicio */}
            <div className="pt-8">
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <Home className="w-5 h-5" />
                Volver al Inicio
              </button>
            </div>

            {/* Número de referencia (opcional) */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Número de referencia:{" "}
                <span className="font-mono font-semibold">
                  #MYS-{Date.now().toString().slice(-6)}
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Guarda este número para futuras consultas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
