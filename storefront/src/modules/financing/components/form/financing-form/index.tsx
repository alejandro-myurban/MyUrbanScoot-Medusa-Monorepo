"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "@medusajs/ui"
import { LoaderCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { sdk } from "@lib/config"
import WhatsApp from "@modules/common/icons/whatsapp"

// Hooks personalizados
import { useFinancingForm } from "@/modules/financing/hooks/use-financing-form"
import { useFormValidation } from "@/modules/financing/hooks/use-form-validation"
import { usePhoneValidation } from "@/modules/financing/hooks/use-phone-validation"

// Secciones de preguntas
import { PersonalInfoSection } from "@modules/financing/components/sections/personal-info-section"
import { AddressSection } from "@modules/financing/components/sections/address-section"
import { IncomeSection } from "@modules/financing/components/sections/income-section"
import { EmployeeSection } from "@modules/financing/components/sections/employee-section"
import { FreelanceSection } from "@modules/financing/components/sections/freelance-section"
import { PensionerSection } from "@modules/financing/components/sections/pensioner-section"
import { BankSection } from "@modules/financing/components/sections/bank-section"
import { FinancingSection } from "@modules/financing/components/sections/financing-section"
import { CommentsSection } from "@modules/financing/components/sections/comments-section"

// Utilidades y constantes
import { formSchema } from "@modules/financing/utils/validation"
import {
  WHATSAPP_CONFIG,
  REDIRECT_URLS,
  FILE_MAPPING,
  API_ENDPOINTS,
} from "@modules/financing/utils/constants"

export const FinancingForm = () => {
  const router = useRouter()

  // Hook principal del formulario
  const formHook = useFinancingForm()
  const {
    formData,
    files,
    submitting,
    submitted,
    isUnemployed,
    error,
    documentVerifications,
    visibleQuestions,
    setFormData,
    setSubmitted,
    handleInputChange,
    handleFileChange,
    removeFile,
    handleVerificationComplete,
    // Métodos anti-double-submit
    lockSubmit,
    unlockSubmit,
    canSubmit,
  } = formHook

  // Hook de validación
  const validationHook = useFormValidation(formData, files, isUnemployed)
  const {
    fieldErrors,
    validateField,
    validateFieldImmediate,
    getFieldError,
    validateRequiredDocuments,
    getMissingDocuments,
    isFormValid,
  } = validationHook

  // Hook de validación de teléfono
  const phoneHook = usePhoneValidation(
    formData,
    setFormData,
    validateFieldImmediate
  )
  const {
    phoneValidation,
    phoneValidationError,
    handlePhoneBlur,
    handleFieldBlur,
    handlePhoneInputChange,
  } = phoneHook

  // Manejador de cambios de input mejorado con lógica de teléfono
  const enhancedInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target

    // Llamar al handler base
    handleInputChange(e)

    // Si es teléfono, manejar validación especial
    if (name === "phone_mumber") {
      handlePhoneInputChange(value)
    } else {
      // Para otros campos, validar con debounce
      validateField(name, value, { ...formData, [name]: value })
    }
  }

  // Función para subir archivo (extraída del original)
  const uploadFile = async (file: File): Promise<string> => {
    const uploadToast = toast.loading(`Subiendo ${file.name}...`)
    try {
      const formData = new FormData()
      formData.append("files", file)

      const response = await fetch(API_ENDPOINTS.UPLOAD_FILE, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Error en la subida del archivo.")
      }

      const fileUrl = result.files?.[0]?.url
      if (!fileUrl) {
        throw new Error(
          "La respuesta del servidor no contenía la URL del archivo."
        )
      }

      toast.success(`${file.name} subido con éxito.`, { id: uploadToast })
      return fileUrl
    } catch (err: any) {
      console.error("Error al subir el archivo:", err)
      toast.error(`Error al subir ${file.name}: ${err.message}`, {
        id: uploadToast,
      })
      throw err
    }
  }

  // Función de envío del formulario con protección anti-double-submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log("🚀 handleSubmit iniciado - verificando si se puede enviar...")

    // 🔒 PROTECCIÓN ANTI-DOUBLE-SUBMIT - PRIMERA LÍNEA DE DEFENSA
    const submitCheck = canSubmit()
    if (!submitCheck.allowed) {
      console.log("❌ Submit bloqueado:", submitCheck.reason)
      toast.error(submitCheck.reason || "No se puede enviar en este momento")
      return
    }

    // 🔒 BLOQUEAR SUBMIT INMEDIATAMENTE (antes de cualquier validación)
    console.log("🔒 Bloqueando submit para prevenir duplicados...")
    lockSubmit()

    try {
      // VALIDACIÓN DE USUARIO DESEMPLEADO
      if (isUnemployed) {
        toast.error(
          "La financiación no está disponible para personas en situación de desempleo"
        )
        unlockSubmit() // Desbloquear para permitir cambios
        return
      }

      // VALIDACIÓN DE DOCUMENTOS REQUERIDOS
      if (!isFormValid) {
        const missing = getMissingDocuments()
        const missingText =
          missing.length > 1
            ? `${missing.slice(0, -1).join(", ")} y ${missing.slice(-1)}`
            : missing[0]
        toast.error(`Faltan documentos requeridos: ${missingText}`)
        unlockSubmit() // Desbloquear para permitir cargar documentos
        return
      }

      // VALIDACIÓN COMPREHENSIVA CON ZOD
      const formValidation = formSchema.safeParse(formData)
      if (!formValidation.success) {
        const errors = formValidation.error.errors
        const firstError = errors[0]
        console.log("❌ Errores de validación:", errors)

        if (firstError.path.length > 0) {
          const fieldName = firstError.path[0]
          const fieldLabels: Record<string, string> = {
            email: "Email",
            phone_mumber: "Teléfono",
            address: "Dirección",
            postal_code: "Código postal",
            city: "Ciudad",
            province: "Provincia",
            income: "Ingresos",
            contract_type: "Tipo de contrato",
            civil_status: "Estado civil",
            housing_type: "Tipo de vivienda",
            financing_installment_count: "Plazos de financiación",
            company_position: "Cargo en la empresa",
            company_start_date: "Fecha de inicio en la empresa",
            freelance_start_date: "Fecha de alta como autónomo",
            marital_status_details: "Detalles del estado civil",
            housing_type_details: "Detalles del tipo de vivienda",
          }

          const fieldLabel = fieldLabels[fieldName as string] || fieldName
          toast.error(`${fieldLabel}: ${firstError.message}`)
        } else {
          toast.error(`Error de validación: ${firstError.message}`)
        }
        unlockSubmit() // Desbloquear para permitir corregir errores
        return
      }

      // VALIDACIÓN DE TELÉFONO
      if (phoneValidation.exists) {
        toast.error(
          "Ya existe una solicitud con este número de teléfono. Por favor, usa un número diferente."
        )
        unlockSubmit() // Desbloquear para permitir cambiar teléfono
        return
      }

      if (phoneValidation.isChecking) {
        toast.error(
          "Espera un momento mientras verificamos el número de teléfono..."
        )
        unlockSubmit() // Desbloquear para permitir reintento
        return
      }

      // 🎯 TODAS LAS VALIDACIONES PASARON - PROCEDER CON ENVÍO
      console.log("✅ Todas las validaciones pasaron, procediendo con envío...")
      const toastId = toast.loading("Enviando solicitud...")

      const uploadedFileIds: Partial<Record<string, string>> = {}

      // Subir archivos normales
      for (const [fileKey, targetField] of Object.entries(FILE_MAPPING)) {
        const file = files[fileKey as keyof typeof files]
        if (file) {
          const fileUrl = await uploadFile(file)
          uploadedFileIds[targetField] = fileUrl
        }
      }

      // Manejar nóminas especialmente (concatenar URLs si hay dos)
      const payrollUrls: string[] = []
      if (files.paysheet_file) {
        const url1 = await uploadFile(files.paysheet_file)
        payrollUrls.push(url1)
      }
      if (files.paysheet_file_2) {
        const url2 = await uploadFile(files.paysheet_file_2)
        payrollUrls.push(url2)
      }

      if (payrollUrls.length > 0) {
        uploadedFileIds["paysheet_file_id"] = payrollUrls.join("|")
      }

      // Combinar verificaciones de nóminas si hay dos
      let combinedPayrollVerification = null
      if (documentVerifications.payroll || documentVerifications.payroll_2) {
        combinedPayrollVerification = {
          primary: documentVerifications.payroll || null,
          secondary: documentVerifications.payroll_2 || null,
          combined: true,
        }
      }

      const finalPayload = {
        ...formData,
        ...uploadedFileIds,
        dni_front_verification: documentVerifications.front || null,
        dni_back_verification: documentVerifications.back || null,
        payroll_verification: combinedPayrollVerification,
        bank_verification: documentVerifications.bank || null,
        requested_at: new Date().toISOString(),
      }

      console.log("📡 Enviando payload al servidor...", { 
        email: finalPayload.email, 
        phone: finalPayload.phone_mumber 
      })

      const response = await sdk.client.fetch(API_ENDPOINTS.SUBMIT_FORM, {
        method: "POST",
        body: finalPayload,
      })

      console.log("✅ Solicitud enviada exitosamente!")
      
      // Marcar como completado ANTES del toast de éxito
      setSubmitted(true)
      
      toast.success("¡Solicitud de financiación enviada con éxito!", {
        id: toastId,
      })

      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push(REDIRECT_URLS.SUCCESS)
      }, 2000)
      
    } catch (err: any) {
      console.error("❌ Error en el envío:", err)
      toast.error(`Error: ${err.message}`)
      
      // 🔓 IMPORTANTE: Desbloquear en caso de error para permitir reintento
      unlockSubmit()
    }
  }

  // Props comunes para todas las secciones
  const sectionProps = {
    formData,
    files,
    fieldErrors,
    documentVerifications,
    phoneValidation,
    phoneValidationError,
    submitting,
    onInputChange: enhancedInputChange,
    onFieldBlur: handleFieldBlur,
    onPhoneBlur: handlePhoneBlur,
    onFileChange: handleFileChange,
    onRemoveFile: removeFile,
    onVerificationComplete: handleVerificationComplete,
    getFieldError,
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-gray-400 via-white to-gray-600 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header mejorado - EXACTO DEL ORIGINAL */}
          <div className="text-center flex flex-col justify-center items-center mb-12">
            <div className="items-center justify-center hidden lg:block rounded-2xl mb-10">
              <img className="max-w-[500px]" src="/logomys.png" />
            </div>
            <div className="items-center justify-center block lg:hidden rounded-2xl mb-10">
              <img className="max-w-[300px]" src="/logomyswide.png" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 font-archivoBlack uppercase">
              Solicitud de Financiación
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl font-archivo mx-auto">
              Completa el siguiente formulario para iniciar tu solicitud de
              financiación. Te guiaremos paso a paso para que sea rápido y
              sencillo.
            </p>
          </div>

          {/* Formulario con nuevo diseño */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-4 sm:p-12 space-y-10">
              {/* Renderizar secciones según visibilidad */}
              {visibleQuestions.includes(1) && (
                <PersonalInfoSection {...sectionProps} />
              )}
              {visibleQuestions.includes(2) && (
                <AddressSection {...sectionProps} />
              )}
              {visibleQuestions.includes(3) && (
                <IncomeSection {...sectionProps} isUnemployed={isUnemployed} />
              )}
              {visibleQuestions.includes(4) && (
                <EmployeeSection {...sectionProps} />
              )}
              {visibleQuestions.includes(7) && (
                <FreelanceSection {...sectionProps} />
              )}
              {visibleQuestions.includes(10) && (
                <PensionerSection {...sectionProps} />
              )}
              {visibleQuestions.includes(11) && (
                <BankSection {...sectionProps} />
              )}
              {visibleQuestions.includes(12) && (
                <FinancingSection {...sectionProps} />
              )}
              {visibleQuestions.includes(13) && (
                <CommentsSection {...sectionProps} />
              )}

              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 border-t pt-10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 mb-1">
                        Error en el envío
                      </h4>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón de envío y documentos faltantes - EXACTO DEL ORIGINAL */}
              <div className="border-t border-gray-100 pt-10">
                {!isFormValid && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-800 mb-2">
                          Documentos requeridos pendientes
                        </h4>
                        <ul className="text-sm text-amber-700 space-y-1">
                          {getMissingDocuments().map((doc, index) => (
                            <li key={index}>• {doc}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || submitted || !isFormValid}
                  className={`w-full flex justify-center items-center py-4 px-8 font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 ${
                    submitted
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                      : submitting
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white cursor-wait"
                      : !isFormValid
                      ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  }`}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
                      <span className="animate-pulse">Procesando solicitud...</span>
                    </>
                  ) : submitted ? (
                    <>
                      <CheckCircle2 className="mr-3 h-6 w-6" />
                      ¡Enviado con éxito!
                    </>
                  ) : isUnemployed ? (
                    <>
                      <AlertCircle className="mr-3 h-6 w-6" />
                      Financiación no disponible
                    </>
                  ) : !isFormValid ? (
                    <>
                      <AlertCircle className="mr-3 h-6 w-6" />
                      Faltan {getMissingDocuments().length} documento
                      {getMissingDocuments().length === 1 ? "" : "s"}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-3 h-6 w-6" />
                      Enviar Solicitud
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  {submitted
                    ? "Redirigiendo a la página de confirmación..."
                    : submitting
                    ? "🔒 Solicitud en proceso. Por favor espera..."
                    : isUnemployed
                    ? "La financiación requiere ingresos regulares demostrables."
                    : !isFormValid
                    ? "Completa todos los documentos requeridos para continuar."
                    : "Al enviar esta solicitud, aceptas nuestros términos y condiciones de financiación."}
                </p>
              </div>
            </form>
          </div>

          {/* Botón flotante de WhatsApp - EXACTO DEL ORIGINAL */}
          <a
            href={`https://wa.me/${WHATSAPP_CONFIG.PHONE_GENERAL}?text=${WHATSAPP_CONFIG.MESSAGE_GENERAL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
            title="¿Necesitas ayuda? Contáctanos"
          >
            <WhatsApp className="w-6 h-6" />
            <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              ¿Necesitas ayuda?
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-300 border-2 border-white rounded-full animate-pulse"></div>
          </a>
        </div>
      </div>
    </>
  )
}
