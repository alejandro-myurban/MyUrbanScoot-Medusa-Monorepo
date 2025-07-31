"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { toast, Toaster } from "@medusajs/ui"
import { FormInput } from "@/modules/financing/components/form-input"
import {
  FileInput,
  type FileStates,
} from "@/modules/financing/components/file-input"
import { FormSelect } from "@/modules/financing/components/select-input"
import { FormTextarea } from "@/modules/financing/components/textarea-input"
import { sdk } from "@/lib/config"
import WhatsApp from "@/modules/common/icons/whatsapp"

// --- Tipos de datos ---
interface FinancingFormData {
  email: string
  identity: string
  income: string
  paysheet_file_id: string | null
  contract_type: string
  company_position: string
  company_start_date: string
  freelance_rental_file_id: string | null
  freelance_quote_file_id: string | null
  pensioner_proof_file_id: string | null
  bank_account_proof_file_id: string | null
  financing_installment_count: string
  housing_type: string
  housing_type_details: string
  civil_status: string
  marital_status_details: string
  address: string
  postal_code: string
  city: string
  province: string
  phone_mumber: string
  doubts: string
}

export default function FinancingPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<FinancingFormData>({
    email: "",
    identity: "",
    income: "",
    paysheet_file_id: null,
    contract_type: "",
    company_position: "",
    company_start_date: "",
    freelance_rental_file_id: null,
    freelance_quote_file_id: null,
    pensioner_proof_file_id: null,
    bank_account_proof_file_id: null,
    financing_installment_count: "12",
    housing_type: "rent",
    housing_type_details: "",
    civil_status: "single",
    marital_status_details: "",
    address: "",
    postal_code: "",
    city: "",
    province: "",
    phone_mumber: "",
    doubts: "",
  })

  const [files, setFiles] = useState<FileStates>({
    identity_front_file_id: null,
    identity_back_file_id: null,
    paysheet_file: null,
    freelance_rental_file: null,
    freelance_quote_file: null,
    pensioner_proof_file: null,
    bank_account_proof_file: null,
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- Manejadores de eventos ---
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: inputFiles } = e.target
    if (inputFiles && inputFiles.length > 0) {
      const file = inputFiles[0]
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`El archivo ${file.name} es demasiado grande (máx 10MB).`)
        return
      }
      setFiles((prev) => ({ ...prev, [name]: file }))
    }
  }

  const removeFile = (fileName: keyof FileStates) => {
    setFiles((prev) => ({ ...prev, [fileName]: null }))
    setFormData((prev) => ({ ...prev, [`${fileName}_id`]: null }))
  }

  // --- Lógica de subida y envío ---
  const uploadFile = async (file: File): Promise<string> => {
    const uploadToast = toast.loading(`Subiendo ${file.name}...`)
    try {
      const formData = new FormData()
      formData.append("files", file)

      // Cambia la URL para usar tu API route
      const response = await fetch(`/api/upload-file`, {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSubmitted(false)
    const toastId = toast.loading("Enviando solicitud...")

    try {
      const uploadedFileIds: Partial<Record<string, string>> = {}

      const fileMapping: Record<string, string> = {
        identity_front_file_id: "identity_front_file_id",
        identity_back_file_id: "identity_back_file_id",
        paysheet_file: "paysheet_file_id",
        freelance_rental_file: "freelance_rental_file_id",
        freelance_quote_file: "freelance_quote_file_id",
        pensioner_proof_file: "pensioner_proof_file_id",
        bank_account_proof_file: "bank_account_proof_file_id",
      }

      for (const [fileKey, targetField] of Object.entries(fileMapping)) {
        const file = files[fileKey as keyof FileStates]
        if (file) {
          const fileUrl = await uploadFile(file)
          uploadedFileIds[targetField] = fileUrl
        }
      }

      const finalPayload = {
        ...formData,
        ...uploadedFileIds,
        requested_at: new Date().toISOString(),
      }

      console.log("🚀 Payload final a enviar:", finalPayload)

      const response = await sdk.client.fetch("/store/financing-data", {
        method: "POST",
        body: finalPayload,
      })

      setSubmitted(true) // ✅ Marcar como enviado exitosamente
      toast.success("¡Solicitud de financiación enviada con éxito!", {
        id: toastId,
      })

      // ✅ Redirigir después de 2 segundos para mostrar el estado de éxito
      setTimeout(() => {
        router.push("/financing-success")
      }, 2000)
    } catch (err: any) {
      console.error("❌ Error en el envío:", err)
      setError(err.message)
      toast.error(`Error: ${err.message}`, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  // --- Componente de input mejorado ---

  // --- Componente de select mejorado ---

  // --- Componente de textarea mejorado ---

  // --- Componente de input de archivo mejorado ---

  // --- Lógica para determinar qué preguntas mostrar ---
  const getVisibleQuestions = () => {
    const questions = []
    questions.push(1, 2, 3)

    if (formData.contract_type === "employee") {
      questions.push(4, 5, 6)
    } else if (formData.contract_type === "freelance") {
      questions.push(8, 9)
    } else if (formData.contract_type === "pensioner") {
      questions.push(10)
    }

    if (formData.contract_type) {
      questions.push(11)
    }

    questions.push(12, 13)
    return questions
  }

  const visibleQuestions = getVisibleQuestions()

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-gray-400 via-white to-gray-600 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header mejorado */}
          <div className="text-center flex flex-col justify-center items-center mb-12">
            <div className="items-center justify-center hidden lg:block  rounded-2xl mb-10">
              <img className="max-w-[500px]" src="/logomys.png" />
            </div>
            <div className="items-center justify-center block lg:hidden  rounded-2xl mb-10">
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
              {/* Pregunta 1: Datos Personales */}
              {visibleQuestions.includes(1) && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-xl font-bold text-lg">
                      1
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Datos Personales
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="Correo Electrónico"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="tu@email.com"
                    />

                    <FormInput
                      label="Teléfono"
                      name="phone_mumber"
                      type="tel"
                      required
                      value={formData.phone_mumber}
                      onChange={handleInputChange}
                      placeholder="+34 600 000 000"
                    />

                    <FileInput
                      id="identity_front_file_id"
                      label="Imagen del anverso del DNI"
                      file={files.identity_front_file_id}
                      onRemove={removeFile}
                      required={true}
                      onChange={handleFileChange}
                      disabled={submitting}
                      multiple={true}
                    />

                    <FileInput
                      id="identity_back_file_id"
                      label="Imagen del reverso del DNI"
                      file={files.identity_back_file_id}
                      onRemove={removeFile}
                      required={true}
                      onChange={handleFileChange}
                      disabled={submitting}
                      multiple={true}
                    />

                    <FormSelect
                      label="Estado Civil"
                      name="civil_status"
                      required
                      value={formData.civil_status}
                      onChange={handleInputChange}
                    >
                      <option value="single">Soltero/a</option>
                      <option value="married">Casado/a</option>
                      <option value="divorced">Divorciado/a</option>
                      <option value="widowed">Viudo/a</option>
                    </FormSelect>

                    <p className="text-gray-400">
                      Es importante que las imágenes del DNI sean perfectamente
                      visibles, sin reflejos y con buena luz, de lo contrario
                      podrían ser rechazadas.
                    </p>

                    {formData.civil_status === "married" && (
                      <div className="md:col-span-2">
                        <FormInput
                          label="Régimen matrimonial"
                          name="marital_status_details"
                          value={formData.marital_status_details}
                          onChange={handleInputChange}
                          placeholder="Ej: Gananciales, Separación de bienes..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pregunta 2: Domicilio */}
              {visibleQuestions.includes(2) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-xl font-bold text-lg">
                      2
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Domicilio Actual
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <FormInput
                        label="Dirección"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Calle, número, piso, puerta..."
                      />
                    </div>

                    <FormInput
                      label="Código Postal"
                      name="postal_code"
                      required
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      placeholder="28001"
                    />

                    <FormInput
                      label="Ciudad"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Madrid"
                    />

                    <FormInput
                      label="Provincia"
                      name="province"
                      required
                      value={formData.province}
                      onChange={handleInputChange}
                      placeholder="Madrid"
                    />

                    <FormSelect
                      label="Tipo de Vivienda"
                      name="housing_type"
                      required
                      value={formData.housing_type}
                      onChange={handleInputChange}
                    >
                      <option value="rent">Alquiler</option>
                      <option value="owned">Propia (con hipoteca)</option>
                      <option value="owned_free">Propia (sin hipoteca)</option>
                      <option value="family">Familiar</option>
                      <option value="other">Otra</option>
                    </FormSelect>

                    {formData.housing_type === "other" && (
                      <FormInput
                        label="Especifique el tipo de vivienda"
                        name="housing_type_details"
                        value={formData.housing_type_details}
                        onChange={handleInputChange}
                        placeholder="Describe tu situación de vivienda"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Pregunta 3: Tipo de Ingresos */}
              {visibleQuestions.includes(3) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-xl font-bold text-lg">
                      3
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Tipo de Ingresos
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="Ingresos Mensuales (€)"
                      name="income"
                      type="number"
                      required
                      value={formData.income}
                      onChange={handleInputChange}
                      placeholder="1800"
                    />

                    <FormSelect
                      label="Tipo de Contrato"
                      name="contract_type"
                      required
                      value={formData.contract_type}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="employee">Cuenta ajena (nómina)</option>
                      <option value="freelance">Autónomo</option>
                      <option value="pensioner">Pensionista</option>
                      <option value="unemployed">Desempleado</option>
                    </FormSelect>
                  </div>
                </div>
              )}

              {/* Preguntas 4-6: Empleados */}
              {visibleQuestions.includes(4) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-xl font-bold text-lg">
                      4
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Información Laboral
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="Cargo en la empresa"
                      name="company_position"
                      required
                      value={formData.company_position}
                      onChange={handleInputChange}
                      placeholder="Desarrollador, Administrativo, etc."
                    />

                    <FormInput
                      label="Fecha de inicio en la empresa"
                      name="company_start_date"
                      type="date"
                      required
                      value={formData.company_start_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {visibleQuestions.includes(5) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-xl font-bold text-lg">
                      5
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Documentación Laboral
                    </h3>
                  </div>

                  <FileInput
                    id="paysheet_file"
                    label="Última nómina"
                    file={files.paysheet_file}
                    onRemove={removeFile}
                    required={true}
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </div>
              )}

              {/* Preguntas 8-9: Autónomos */}
              {visibleQuestions.includes(8) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-100 text-orange-600 rounded-xl font-bold text-lg">
                      8
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Documentación de Autónomo
                    </h3>
                  </div>

                  <FileInput
                    id="freelance_rental_file"
                    label="Última declaración de la renta"
                    file={files.freelance_rental_file}
                    onRemove={removeFile}
                    required={true}
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </div>
              )}

              {visibleQuestions.includes(9) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-teal-100 text-teal-600 rounded-xl font-bold text-lg">
                      9
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Cuota de Autónomos
                    </h3>
                  </div>

                  <FileInput
                    id="freelance_quote_file"
                    label="Última cuota de autónomos"
                    file={files.freelance_quote_file}
                    onRemove={removeFile}
                    required={true}
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </div>
              )}

              {/* Pregunta 10: Pensionistas */}
              {visibleQuestions.includes(10) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl font-bold text-lg">
                      10
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Documentación de Pensión
                    </h3>
                  </div>

                  <FileInput
                    id="pensioner_proof_file"
                    label="Justificante de pensión"
                    file={files.pensioner_proof_file}
                    onRemove={removeFile}
                    required={true}
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </div>
              )}

              {/* Pregunta 11: Justificante Bancario */}
              {visibleQuestions.includes(11) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl font-bold text-lg">
                      11
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Justificante Bancario
                    </h3>
                  </div>

                  <FileInput
                    id="bank_account_proof_file"
                    label="Justificante de titularidad bancaria"
                    file={files.bank_account_proof_file}
                    onRemove={removeFile}
                    required={true}
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </div>
              )}

              {/* Pregunta 12: Plazos de Financiación */}
              {visibleQuestions.includes(12) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-pink-100 text-pink-600 rounded-xl font-bold text-lg">
                      12
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Plazos de Financiación
                    </h3>
                  </div>

                  <div className="max-w-md">
                    <FormSelect
                      label="Plazos de financiación"
                      name="financing_installment_count"
                      required
                      value={formData.financing_installment_count}
                      onChange={handleInputChange}
                    >
                      <option value="12">12 meses</option>
                      <option value="24">24 meses</option>
                      <option value="36">36 meses</option>
                      <option value="48">48 meses</option>
                      <option value="60">60 meses</option>
                    </FormSelect>
                  </div>
                </div>
              )}

              {/* Pregunta 13: Comentarios */}
              {visibleQuestions.includes(13) && (
                <div className="space-y-6 border-t border-gray-100 pt-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-violet-100 text-violet-600 rounded-xl font-bold text-lg">
                      13
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Comentarios Adicionales
                    </h3>
                  </div>

                  <FormTextarea
                    label="¿Tienes alguna duda o comentario?"
                    name="doubts"
                    value={formData.doubts}
                    onChange={handleInputChange}
                    placeholder="Escribe aquí si necesitas aclarar algo o tienes alguna pregunta..."
                    rows={5}
                  />
                </div>
              )}

              {/* Mensaje de error mejorado */}
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

              {/* Botón de WhatsApp mejorado */}
              <div className="border-t border-gray-100 pt-10">
                <button
                  type="submit"
                  disabled={submitting || submitted}
                  className={`w-full flex justify-center items-center py-4 px-8 font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 ${
                    submitted
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  }`}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
                      Enviando solicitud...
                    </>
                  ) : submitted ? (
                    <>
                      <CheckCircle2 className="mr-3 h-6 w-6" />
                      ¡Enviado con éxito!
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
                    : "Al enviar esta solicitud, aceptas nuestros términos y condiciones de financiación."}
                </p>
              </div>
            </form>
          </div>
          <a
            href="https://wa.me/34633695703?text=Hola%20MyUrbanScoot.com"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
            title="¿Necesitas ayuda? Contáctanos"
          >
            <WhatsApp className="w-6 h-6" />

            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              ¿Necesitas ayuda?
            </div>

            {/* Indicador de disponibilidad */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-300 border-2 border-white rounded-full animate-pulse"></div>
          </a>
        </div>
      </div>
    </>
  )
}
