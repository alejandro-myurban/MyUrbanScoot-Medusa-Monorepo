'use client'

import { useEffect, useState, useRef } from 'react'
import { CheckCircle, Calendar, Clock, MapPin, Phone, User, ArrowLeft, Home, Download, Sparkles } from 'lucide-react'

interface AppointmentInfo {
  customerName: string
  customerPhone: string
  workshopName: string
  workshopAddress: string
  workshopPhone: string
  date: string
  time: string
  description: string
}

export default function AppointmentSuccessPage() {
  const [appointmentInfo, setAppointmentInfo] = useState<AppointmentInfo | null>(null)
  const comprobanteRef = useRef<HTMLDivElement>(null)

  // Use useEffect to read from sessionStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const storedInfo = sessionStorage.getItem('appointmentInfo');
      if (storedInfo) {
        try {
          const info = JSON.parse(storedInfo);
          setAppointmentInfo(info);
        } catch (error) {
          console.error("Failed to parse appointment info from sessionStorage", error);
        }
      }
    }
  }, []); // The empty dependency array ensures this runs only once

  const handleGoBack = () => {
    window.location.href = '/appointments'
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleDownloadPdf = async () => {
    if (!comprobanteRef.current) return

    const buttonsDiv = document.getElementById('action-buttons')
    const footerDiv = document.getElementById('contact-footer')
    if (buttonsDiv) buttonsDiv.style.display = 'none'
    if (footerDiv) footerDiv.style.display = 'none'

    try {
      // Importar dinámicamente para evitar errores de SSR
      const html2canvas = await import('html2canvas')
      const jsPDF = await import('jspdf')

      const canvas = await html2canvas.default(comprobanteRef.current, {
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f9fafb',
        width: comprobanteRef.current.scrollWidth,
        height: comprobanteRef.current.scrollHeight,
      })

      const imgData = canvas.toDataURL('image/png', 0.95)
      const pdf = new jsPDF.default('p', 'mm', 'a4')
      
      const pdfWidth = 210
      const pdfHeight = 297
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      
      // Calcular para que quepa en una página con márgenes
      const maxWidth = pdfWidth - 15
      const maxHeight = pdfHeight - 25
      
      const widthRatio = maxWidth / (canvasWidth * 0.264583)
      const heightRatio = maxHeight / (canvasHeight * 0.264583)
      const ratio = Math.min(widthRatio, heightRatio)
      
      const finalWidth = (canvasWidth * 0.264583) * ratio
      const finalHeight = (canvasHeight * 0.264583) * ratio
      
      const x = (pdfWidth - finalWidth) / 2
      const y = 12
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
      pdf.save('comprobante-cita-myurbanscoot.pdf')

    } catch (error) {
      console.error("Error al generar el PDF:", error)
      alert("Error al generar el PDF. Por favor, intenta nuevamente.")
    } finally {
      if (buttonsDiv) buttonsDiv.style.display = 'flex'
      if (footerDiv) footerDiv.style.display = 'block'
    }
  }

  if (!appointmentInfo) {
    return (
      <div className="min-h-screen bg-grey-5 flex items-center justify-center px-4">
        <div className="bg-grey-0 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-grey-50 mb-4">
            <Calendar className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-grey-70 mb-4">
            No se encontró información de la cita
          </h2>
          <button
            onClick={handleGoHome}
            className="bg-mysGreen-100 text-grey-90 px-6 py-2 rounded-base hover:bg-opacity-90 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-grey-5 flex items-start justify-center py-4 px-2 font-poppins">
      <div ref={comprobanteRef} className="w-full max-w-lg mx-auto">
        {/* Logo más pequeño */}
        <div className="flex justify-center mb-3">
          <div className="relative">
            <img
              className="w-[180px] sm:w-[220px] h-auto"
              src="/logomys.png"
              alt="Logo"
            />
            {/* Pequeño detalle decorativo */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-mysGreen-100 rounded-full opacity-20"></div>
          </div>
        </div>

        {/* Tarjeta principal de éxito */}
        <div className="bg-grey-0 rounded-lg shadow-lg border border-grey-20 overflow-hidden mb-3">
          {/* Header de éxito más compacto con pequeño detalle */}
          <div className="bg-gradient-to-r from-mysGreen-100 to-green-400 py-3 px-2 text-center relative overflow-hidden">
            {/* Pequeños detalles decorativos sutiles */}
            <div className="absolute top-1 left-4 w-2 h-2 bg-white bg-opacity-20 rounded-full"></div>
            <div className="absolute bottom-2 right-8 w-3 h-3 bg-white bg-opacity-15 rounded-full"></div>
            <div className="absolute top-2 right-16 w-1 h-1 bg-white bg-opacity-25 rounded-full"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="w-10 h-10 text-grey-90" />
                <Sparkles className="w-4 h-4 text-grey-90 opacity-70" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-grey-90 mb-1">
                ¡Cita Confirmada!
              </h1>
              <p className="text-grey-90 text-sm font-medium">
                Tu reserva ha sido procesada exitosamente
              </p>
            </div>
          </div>

          {/* Información de la cita */}
          <div className="p-3">
            <div className="bg-mysGreen-100 bg-opacity-10 border border-mysGreen-100 border-opacity-30 rounded-lg p-3 mb-3 relative">
              {/* Pequeño detalle en la esquina */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-mysGreen-100 bg-opacity-30 rounded-full"></div>
              
              <h2 className="text-sm font-semibold text-grey-90 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Detalles de tu Cita
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-mysGreen-100 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-grey-70">Cliente</p>
                    <p className="text-grey-90">{appointmentInfo.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-mysGreen-100 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-grey-70">Teléfono</p>
                    <p className="text-grey-90">{appointmentInfo.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-mysGreen-100 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-grey-70">Fecha</p>
                    <p className="text-grey-90">{appointmentInfo.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-mysGreen-100 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-grey-70">Horario</p>
                    <p className="text-grey-90">{appointmentInfo.time}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del taller */}
            <div className="bg-grey-5 rounded-lg p-3 mb-3 relative">
              {/* Pequeño detalle decorativo */}
              <div className="absolute top-2 right-2 w-1 h-1 bg-grey-40 rounded-full"></div>
              
              <h3 className="text-sm font-semibold text-grey-90 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Información del Taller
              </h3>
              <div className="space-y-1 text-xs">
                <div>
                  <p className="font-medium text-grey-70">Nombre</p>
                  <p className="text-grey-90">{appointmentInfo.workshopName}</p>
                </div>
                <div>
                  <p className="font-medium text-grey-70">Dirección</p>
                  <p className="text-grey-90">{appointmentInfo.workshopAddress}</p>
                </div>
                <div>
                  <p className="font-medium text-grey-70">Teléfono del Taller</p>
                  <p className="text-grey-90">{appointmentInfo.workshopPhone}</p>
                </div>
                {appointmentInfo.description && appointmentInfo.description !== "Cita agendada" && (
                  <div>
                    <p className="font-medium text-grey-70">Descripción del Servicio</p>
                    <p className="text-grey-90">{appointmentInfo.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Información importante y Recordatorio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 relative">
                {/* Pequeño detalle */}
                <div className="absolute top-1 right-1 w-1 h-1 bg-amber-300 rounded-full"></div>
                
                <h3 className="text-sm font-semibold text-amber-800 mb-2">
                  ⚠️ Info. Importante
                </h3>
                <div className="text-amber-700 space-y-1 text-xs">
                  <p>• El tiempo de reparación puede variar.</p>
                  <p>• Esta cita **no garantiza** que te lleves tu patinete el mismo día.</p>
                  <p>• Te contactaremos antes de la cita para confirmar.</p>
                  <p>• Por favor, llega puntual.</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 relative">
                {/* Pequeño detalle */}
                <div className="absolute top-1 right-1 w-1 h-1 bg-blue-300 rounded-full"></div>
                
                <h3 className="text-sm font-semibold text-blue-800 mb-2">
                  📝 Recordatorio
                </h3>
                <div className="text-blue-700 space-y-1 text-xs">
                  <p><strong>Fecha y hora:</strong> {appointmentInfo.date} a las {appointmentInfo.time}</p>
                  <p><strong>Ubicación:</strong> {appointmentInfo.workshopName}</p>
                  <p><strong>Dirección:</strong> {appointmentInfo.workshopAddress}</p>
                  <p><strong>Teléfono del taller:</strong> {appointmentInfo.workshopPhone}</p>
                  <p className="mt-1 font-medium">💡 Te recomendamos guardar esta info.</p>
                </div>
              </div>
            </div>

            {/* Botones de acción con pequeña mejora visual */}
            <div id="action-buttons" className="flex flex-col sm:flex-row gap-2 justify-center mt-3">
              <button
                onClick={handleDownloadPdf}
                className="flex items-cewnter justify-center gap-2 bg-mysGreen-100 text-grey-90 px-3 py-2 rounded-base hover:bg-opacity-90 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
              <button
                onClick={handleGoBack}
                className="flex items-center justify-center gap-2 bg-grey-20 text-grey-70 px-3 py-2 rounded-base hover:bg-grey-30 transition-colors font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Nueva Cita
              </button>
              <button
                onClick={handleGoHome}
                className="flex items-center justify-center gap-2 bg-grey-20 text-grey-70 px-3 py-2 rounded-base hover:bg-grey-30 transition-all duration-200 font-medium text-sm"
              >
                <Home className="w-4 h-4" />
                Inicio
              </button>
            </div>
          </div>
        </div>

        {/* Footer con contacto */}
        <div id="contact-footer" className="text-center text-xs text-grey-60 mt-2">
          <p>Si tienes alguna duda, contáctanos:</p>
          <p className="mt-1">
            📞 <strong>{appointmentInfo.workshopPhone}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}