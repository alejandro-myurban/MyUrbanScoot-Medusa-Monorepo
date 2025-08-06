// modules/financing/components/file-input-enhanced.tsx
"use client"

import React, { useState } from 'react'
import { CheckCircle2, Trash2, Upload, Loader2, AlertCircle, Eye } from "lucide-react"
import { toast } from "@medusajs/ui"

export interface FileStates {
  identity_front_file_id: File | null
  identity_back_file_id: File | null
  paysheet_file: File | null
  paysheet_file_2: File | null
  freelance_rental_file: File | null
  freelance_quote_file: File | null
  pensioner_proof_file: File | null
  bank_account_proof_file: File | null
}

// ✅ INTERFAZ ACTUALIZADA con campos bancarios
interface VerificationResult {
  isValid: boolean
  extractedData: {
    // Para DNI
    fullName?: string
    documentNumber?: string
    birthDate?: string
    expirationDate?: string
    nationality?: string
    
    // Para documentos bancarios ✅ NUEVO
    bankName?: string
    accountHolder?: string
    iban?: string
    accountNumber?: string
    documentType?: string
    issueDate?: string
    balance?: string
  }
  confidence: number
  issues: string[]
  imageQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

// ✅ PROPS ACTUALIZADAS
interface FileInputProps {
  id: keyof FileStates
  label: string
  file: File | null
  onRemove: (id: keyof FileStates) => void
  required?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  multiple?: boolean
  documentType?: 'dni_front' | 'dni_back' | 'bank_certificate' | 'bank_statement' | 'payroll' // ✅ CAMBIO
  onVerificationComplete?: (result: VerificationResult) => void
}

export const FileInputEnhanced = ({
  id,
  label,
  file,
  onRemove,
  required = false,
  onChange,
  disabled = false,
  multiple = false,
  documentType, 
  onVerificationComplete
}: FileInputProps) => {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // ✅ LÓGICA ACTUALIZADA para decidir qué verificar
  const shouldVerify = documentType && [
    'dni_front', 
    'dni_back', 
    'bank_certificate', 
    'bank_statement',
    'payroll'
  ].includes(documentType)

  const convertToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        const [header, base64] = result.split(',')
        const mimeType = header.match(/data:([^;]+)/)?.[1] || 'application/octet-stream'
        resolve({ base64, mimeType })
      }
      reader.onerror = reject
    })
  }

  const verifyDocument = async (file: File) => {
    if (!shouldVerify || !documentType) return

    setIsVerifying(true)
    const verifyToast = toast.loading('Verificando documento...')

    try {
      const { base64, mimeType } = await convertToBase64(file)
      
      console.log(`📄 Enviando documento: ${documentType}, MIME: ${mimeType}`)
      
      const response = await fetch('/api/verify-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          documentType,
          mimeType // ✅ NUEVO: enviar el MIME type
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al verificar documento')
      }

      const result = await response.json()
      setVerificationResult(result.data)
      onVerificationComplete?.(result.data)

      // ✅ MENSAJES ESPECÍFICOS por tipo de documento
      if (result.data.isValid && result.data.confidence > 70) {
        const messages: Record<string, string> = {
          dni_front: '✅ DNI frontal verificado correctamente',
          dni_back: '✅ DNI trasero verificado correctamente',
          bank_certificate: '✅ Certificado bancario verificado correctamente',
          bank_statement: '✅ Extracto bancario verificado correctamente',
          payroll: '✅ Nómina verificada correctamente'
        }
        toast.success(messages[documentType] || '✅ Documento verificado correctamente', { id: verifyToast })
      } else if (result.data.confidence < 50) {
        const messages: Record<string, string> = {
          dni_front: '❌ DNI frontal no válido o de baja calidad',
          dni_back: '❌ DNI trasero no válido o de baja calidad',
          bank_certificate: '❌ No es un certificado bancario válido',
          bank_statement: '❌ No es un extracto bancario válido',
          payroll: '❌ No es una nómina válida'
        }
        toast.error(messages[documentType] || '❌ Documento no válido', { id: verifyToast })
      } else {
        toast.warning('⚠️ Documento válido pero con algunas observaciones', { id: verifyToast })
      }

    } catch (error: any) {
      console.error('Error verificando documento:', error)
      toast.error(`Error al verificar el documento: ${error.message}`, { id: verifyToast })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e) // Llamar al onChange original
    
    const selectedFile = e.target.files?.[0]
    if (selectedFile && shouldVerify) {
      await verifyDocument(selectedFile)
    }
  }

  const getVerificationStatus = () => {
    if (!verificationResult) return null
    
    if (verificationResult.isValid && verificationResult.confidence > 70) {
      return { 
        color: 'border-green-200 bg-green-50', 
        textColor: 'text-green-800',
        icon: CheckCircle2, 
        iconColor: 'text-green-600',
        text: 'Verificado' 
      }
    } else if (verificationResult.confidence < 50) {
      return { 
        color: 'border-red-200 bg-red-50', 
        textColor: 'text-red-800',
        icon: AlertCircle, 
        iconColor: 'text-red-600',
        text: 'No válido' 
      }
    } else {
      return { 
        color: 'border-yellow-200 bg-yellow-50', 
        textColor: 'text-yellow-800',
        icon: AlertCircle, 
        iconColor: 'text-yellow-600',
        text: 'Con observaciones' 
      }
    }
  }

  const status = getVerificationStatus()

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-800">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {file ? (
        <div className={`flex flex-col p-4 border rounded-xl shadow-[0px_1px_1px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.02)] transition-all duration-200 ${
          status ? status.color : 'border-green-200 bg-green-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                {isVerifying ? (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                ) : status ? (
                  React.createElement(status.icon, { 
                    className: `h-5 w-5 ${status.iconColor}` 
                  })
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${
                  status ? status.textColor : 'text-green-800'
                }`}>
                  {file.name}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {status && (
                    <span className={`text-xs font-medium ${status.iconColor}`}>
                      {status.text}
                    </span>
                  )}
                  {verificationResult && (
                    <span className="text-xs text-gray-500">
                      {verificationResult.confidence}% confianza
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Botón para ver detalles de verificación */}
              {verificationResult && (
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex-shrink-0 p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all duration-200"
                  title="Ver detalles de verificación"
                >
                  <Eye size={16} />
                </button>
              )}
              
              <button
                type="button"
                onClick={() => {
                  onRemove(id)
                  setVerificationResult(null)
                  setShowDetails(false)
                }}
                className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* ✅ DETALLES ACTUALIZADOS con datos bancarios */}
          {showDetails && verificationResult && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Información extraída del documento:
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
                {/* Datos de DNI */}
                {verificationResult.extractedData.fullName && (
                  <div>
                    <span className="font-medium text-gray-900">Nombre:</span>
                    <span className="ml-1">{verificationResult.extractedData.fullName}</span>
                  </div>
                )}
                {verificationResult.extractedData.documentNumber && (
                  <div>
                    <span className="font-medium text-gray-900">DNI:</span>
                    <span className="ml-1">{verificationResult.extractedData.documentNumber}</span>
                  </div>
                )}
                {verificationResult.extractedData.birthDate && (
                  <div>
                    <span className="font-medium text-gray-900">Fecha nac.:</span>
                    <span className="ml-1">{verificationResult.extractedData.birthDate}</span>
                  </div>
                )}
                {verificationResult.extractedData.expirationDate && (
                  <div>
                    <span className="font-medium text-gray-900">Fecha exp.:</span>
                    <span className="ml-1">{verificationResult.extractedData.expirationDate}</span>
                  </div>
                )}
                
                {/* ✅ DATOS BANCARIOS NUEVOS */}
                {verificationResult.extractedData.bankName && (
                  <div>
                    <span className="font-medium text-gray-900">Banco:</span>
                    <span className="ml-1">{verificationResult.extractedData.bankName}</span>
                  </div>
                )}
                {verificationResult.extractedData.accountHolder && (
                  <div>
                    <span className="font-medium text-gray-900">Titular:</span>
                    <span className="ml-1">{verificationResult.extractedData.accountHolder}</span>
                  </div>
                )}
                {verificationResult.extractedData.iban && (
                  <div>
                    <span className="font-medium text-gray-900">IBAN:</span>
                    <span className="ml-1">{verificationResult.extractedData.iban}</span>
                  </div>
                )}
                {verificationResult.extractedData.issueDate && (
                  <div>
                    <span className="font-medium text-gray-900">Fecha emisión:</span>
                    <span className="ml-1">{verificationResult.extractedData.issueDate}</span>
                  </div>
                )}
                {verificationResult.extractedData.balance && (
                  <div>
                    <span className="font-medium text-gray-900">Saldo:</span>
                    <span className="ml-1">{verificationResult.extractedData.balance}</span>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-900">Calidad:</span>
                  <span className="ml-1 capitalize">{verificationResult.imageQuality}</span>
                </div>
              </div>
              
              {verificationResult.issues.length > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-xs font-medium text-yellow-800 mb-1">Observaciones:</p>
                  <ul className="text-xs text-yellow-700 space-y-1 pl-2">
                    {verificationResult.issues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-1">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <label
          htmlFor={id}
          className="group relative flex flex-col items-center justify-center w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 bg-gray-50 transition-all duration-300 shadow-[0px_1px_1px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.02)]"
        >
          <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-blue-600 transition-colors duration-200">
            <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center">
              <Upload size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Seleccionar archivo</p>
              <p className="text-xs text-gray-400 mt-1">
                {shouldVerify ? 'JPG, PNG (máx. 10MB)' : 'PDF, JPG, PNG (máx. 10MB)'}
              </p>
              {shouldVerify && (
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  ✨ Se verificará automáticamente
                </p>
              )}
            </div>
          </div>
          <input
            id={id}
            name={id}
            type="file"
            accept={shouldVerify ? ".jpg,.jpeg,.png,.pdf" : ".pdf,.jpg,.jpeg,.png"}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={disabled}
            required={required}
            multiple={multiple}
          />
        </label>
      )}
    </div>
  )
}