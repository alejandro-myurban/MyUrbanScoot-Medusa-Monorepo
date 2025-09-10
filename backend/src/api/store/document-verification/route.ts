// src/api/admin/document-verification/route.ts
import type { 
  MedusaRequest, 
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { DocumentVerificationModuleService } from "../../../modules/document-verification/service"
import { 
  DocumentVerificationRequest,
  BothSidesVerificationRequest,
  DocumentType
} from "../../../modules/document-verification/types"

// ✅ INTERFAZ ACTUALIZADA
interface DocumentVerificationRequestUpdated {
  image: string
  documentType: DocumentType // ✅ CAMBIO: documentType en lugar de documentSide
  mimeType?: string // ✅ NUEVO: MIME type opcional
}

// Validar que la imagen base64 sea válida
function isValidBase64Image(base64String: string): boolean {
  if (!base64String || typeof base64String !== 'string') {
    return false
  }
  
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/
  return base64Pattern.test(base64String.replace(/^data:image\/[^;]+;base64,/, ''))
}


export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info("📨 Recibida solicitud de verificación de documento")

  try {
    // ✅ TIPADO ACTUALIZADO
    const body = req.body as DocumentVerificationRequestUpdated
    const { image, documentType, mimeType } = body

    logger.info(`📄 Documento recibido: tipo=${documentType}, MIME=${mimeType || 'no especificado'}`)

    // Validaciones de entrada
    if (!image) {
      logger.error("❌ Imagen no proporcionada")
      return res.status(400).json({
        success: false,
        error: "La imagen es requerida"
      })
    }

    // ✅ VALIDACIÓN ACTUALIZADA para todos los tipos de documento
    const validTypes: DocumentType[] = ['dni_front', 'dni_back', 'bank_certificate', 'bank_statement', 'payroll']
    if (!documentType || !validTypes.includes(documentType)) {
      logger.error(`❌ Tipo de documento inválido: ${documentType}`)
      return res.status(400).json({
        success: false,
        error: `El tipo de documento debe ser uno de: ${validTypes.join(', ')}`
      })
    }

    // Limpiar la imagen base64
    let cleanBase64 = image
    if (typeof image === 'string' && image.includes(',')) {
      cleanBase64 = image.split(',')[1]
    }

    // Validar formato base64
    if (!isValidBase64Image(cleanBase64)) {
      logger.error("❌ Formato base64 inválido")
      return res.status(400).json({
        success: false,
        error: "Formato de imagen inválido"
      })
    }

    // Verificar tamaño aproximado
    const approximateSize = (cleanBase64.length * 3) / 4
    const maxSize = 8 * 1024 * 1024 // 8MB
    
    if (approximateSize > maxSize) {
      logger.error(`❌ Imagen demasiado grande: ${approximateSize} bytes`)
      return res.status(400).json({
        success: false,
        error: "La imagen es demasiado grande (máximo 8MB)"
      })
    }

    logger.info(`🔍 Procesando documento ${documentType} (${(approximateSize / 1024).toFixed(1)} KB)`)

    // Resolver el servicio del módulo
    const documentVerificationModuleService = req.scope.resolve(
      "documentVerificationModuleService"
    ) as DocumentVerificationModuleService

    // ✅ USAR EL MÉTODO UNIVERSAL verifyDocument
    const result = await documentVerificationModuleService.verifyDocument(
      cleanBase64,
      documentType
    )

    logger.info(`✅ Verificación completada: ${result.isValid ? 'VÁLIDO' : 'INVÁLIDO'} (${result.confidence}% confianza)`)

    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    logger.error(`❌ Error en endpoint de verificación: ${error?.message}`)
    
    return res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined
    })
  }
}

// Endpoint GET para healthcheck
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const documentVerificationModuleService = req.scope.resolve(
      "documentVerificationModuleService"
    ) as DocumentVerificationModuleService
    
    const status = await documentVerificationModuleService.getServiceStatus()
    
    return res.status(200).json({
      success: true,
      ...status
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Service unavailable",
      message: error?.message
    })
  }
}

// Endpoint para verificar ambos lados (mantener para compatibilidad)
export const PUT = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info("📨 Recibida solicitud de verificación de ambos lados")

  try {
    const body = req.body as BothSidesVerificationRequest
    const { frontImage, backImage } = body

    if (!frontImage || !backImage) {
      return res.status(400).json({
        success: false,
        error: "Se requieren ambas imágenes (anverso y reverso)"
      })
    }

    // Limpiar las imágenes base64
    const cleanFrontBase64 = frontImage.includes(',') ? frontImage.split(',')[1] : frontImage
    const cleanBackBase64 = backImage.includes(',') ? backImage.split(',')[1] : backImage

    const documentVerificationModuleService = req.scope.resolve(
      "documentVerificationModuleService"  
    ) as DocumentVerificationModuleService

    const result = await documentVerificationModuleService.verifyBothSides(
      cleanFrontBase64,
      cleanBackBase64
    )

    logger.info("✅ Verificación de ambos lados completada")

    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    logger.error(`❌ Error en verificación de ambos lados: ${error?.message}`)
    
    return res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      message: error?.message
    })
  }
}