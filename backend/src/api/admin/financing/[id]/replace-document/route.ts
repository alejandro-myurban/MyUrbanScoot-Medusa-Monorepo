import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows";
import { MedusaError } from "@medusajs/framework/utils";
import { FINANCING_MODULE } from "../../../../../modules/financing_data";
import { DOCUMENT_VERIFICATION_MODULE } from "../../../../../modules/document-verification";
import type {
  ReplaceDocumentUpdateData,
  VerificationData,
  FinancingDataUpdatableFields,
  UpdateFinancingDataInput,
} from "../../../../../modules/financing_data/types";

// Helper tipado para actualizar documentos específicos
const createDocumentUpdate = (
  documentType: string,
  fileUrl: string
): Partial<FinancingDataUpdatableFields> => {
  switch (documentType) {
    case "identity_front":
      return { identity_front_file_id: fileUrl };
    case "identity_back":
      return { identity_back_file_id: fileUrl };
    case "paysheet":
      return { paysheet_file_id: fileUrl };
    case "bank_account_proof":
      return { bank_account_proof_file_id: fileUrl };
    case "freelance_rental":
      return { freelance_rental_file_id: fileUrl };
    case "freelance_quote":
      return { freelance_quote_file_id: fileUrl };
    case "pensioner_proof":
      return { pensioner_proof_file_id: fileUrl };
    default:
      throw new Error(`Tipo de documento no soportado: ${documentType}`);
  }
};

// Helper tipado para actualizar verificaciones específicas
const createVerificationUpdate = (
  documentType: string,
  analysisResult: VerificationData
): Partial<FinancingDataUpdatableFields> => {
  if (documentType === "identity_front") {
    return { dni_front_verification: analysisResult };
  } else if (documentType === "identity_back") {
    return { dni_back_verification: analysisResult };
  } else if (documentType === "paysheet") {
    return { payroll_verification: analysisResult };
  }
  return {};
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("🔄 Endpoint replace-document llamado");
    console.log("📋 Params:", req.params);
    console.log("📦 Body:", req.body);
    console.log("🔍 Query:", req.query);
    console.log("📁 Files:", req.files);

    const { id } = req.params;
    const { document_type } = req.query;

    if (!id) {
      return res.status(400).json({
        error: "ID de financiación requerido",
      });
    }

    if (!document_type) {
      return res.status(400).json({
        error: "Tipo de documento requerido",
      });
    }

    // Validar tipo de documento permitido
    const allowedDocumentTypes = [
      "identity_front",
      "identity_back",
      "paysheet",
      "bank_account_proof",
      "freelance_rental",
      "freelance_quote",
      "pensioner_proof",
    ];

    //@ts-ignore
    if (!allowedDocumentTypes.includes(document_type)) {
      return res.status(400).json({
        error: "Tipo de documento no válido",
        allowed: allowedDocumentTypes,
      });
    }

    // Procesar archivo
    let file;
    if (Array.isArray(req.files)) {
      file = req.files[0];
    } else if (req.files && typeof req.files === "object") {
      const filesArray = Object.values(req.files).flat();
      file = filesArray[0];
    }

    if (!file) {
      return res.status(400).json({
        error: "No se encontró archivo para subir",
      });
    }

    console.log("📸 Archivo recibido:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    // Validar tipo de archivo
    const allowedMimes = ["image/", "application/pdf"];
    const isAllowed = allowedMimes.some((t) => file.mimetype.startsWith(t));

    if (!isAllowed) {
      return res.status(400).json({
        error: "Tipo de archivo no válido",
        details: `${file.originalname} no es una imagen o PDF válido`,
      });
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        error: "Archivo muy grande",
        details: `${file.originalname} es muy grande (máximo 5MB)`,
      });
    }

    // Obtener servicios
    const financingDataModule = req.scope.resolve(FINANCING_MODULE);

    // Obtener registro actual
    //@ts-ignore

    const currentRecords = await financingDataModule.listFinancingData({ id });
    const currentRecord = currentRecords?.[0];
    if (!currentRecord) {
      return res.status(404).json({
        error: "Solicitud de financiación no encontrada",
      });
    }

    // Obtener la URL del archivo actual de manera tipada
    const getCurrentFileUrl = (record: any, docType: string): string | null => {
      switch (docType) {
        case "identity_front":
          return record.identity_front_file_id;
        case "identity_back":
          return record.identity_back_file_id;
        case "paysheet":
          return record.paysheet_file_id;
        case "bank_account_proof":
          return record.bank_account_proof_file_id;
        case "freelance_rental":
          return record.freelance_rental_file_id;
        case "freelance_quote":
          return record.freelance_quote_file_id;
        case "pensioner_proof":
          return record.pensioner_proof_file_id;
        default:
          return null;
      }
    };

    const docTypeStr = Array.isArray(document_type)
      ? document_type[0]
      : typeof document_type === "string"
      ? document_type
      : "";
    const currentFileUrl = getCurrentFileUrl(currentRecord, String(docTypeStr));

    // Subir nuevo archivo usando el workflow oficial
    const { result } = await uploadFilesWorkflow(req.scope).run({
      input: {
        files: [
          {
            filename: file.originalname,
            mimeType: file.mimetype,
            content: file.buffer.toString("binary"),
            access: "public",
          },
        ],
      },
    });

    const newFile = result[0];
    console.log("✅ Nuevo archivo subido:", newFile);

    // TODO: Implementar eliminación de archivo anterior más adelante
    if (currentFileUrl) {
      console.log(`📝 Archivo anterior a reemplazar: ${currentFileUrl}`);
    }

    // Actualizar registro en base de datos con la URL del nuevo archivo
    //@ts-ignore

    const documentUpdateData = createDocumentUpdate(document_type, newFile.url);

    const updateInput: UpdateFinancingDataInput = {
      id,
      ...documentUpdateData,
    };

    //@ts-ignore

    await financingDataModule.updateFinancingData(updateInput);

    console.log(
      `✅ Campo ${document_type} actualizado con nuevo archivo: ${newFile.url}`
    );

    // Re-analizar documento automáticamente si es DNI o nómina
    let analysisResult;
    try {
      //@ts-ignore

      if (document_type.startsWith("identity_")) {
        // Re-analizar DNI
        const documentVerificationService = req.scope.resolve(
          DOCUMENT_VERIFICATION_MODULE
        );
        const isBack = document_type === "identity_back";

        // Convertir URL a base64 para el análisis
        const response = await fetch(newFile.url);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        //@ts-ignore
        analysisResult =
          //@ts-ignore

          await documentVerificationService.verifyIdentityDocument(
            base64,
            isBack ? "back" : "front"
          );

        // Actualizar datos de verificación
        const verificationUpdateData = createVerificationUpdate(
          //@ts-ignore

          document_type,
          analysisResult as VerificationData
        );

        const verificationUpdateInput: UpdateFinancingDataInput = {
          id,
          ...verificationUpdateData,
        };

        //@ts-ignore

        await financingDataModule.updateFinancingData(verificationUpdateInput);

        console.log(`🔍 DNI re-analizado automáticamente`);
      } else if (document_type === "paysheet") {
        // Re-analizar nómina
        const documentVerificationService = req.scope.resolve(
          DOCUMENT_VERIFICATION_MODULE
        );

        // Convertir URL a base64 para el análisis
        const response = await fetch(newFile.url);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        analysisResult =
          //@ts-ignore

          await documentVerificationService.verifyPayrollDocument(base64);

        // Actualizar datos de verificación
        const payrollUpdateData = createVerificationUpdate(
          document_type,
          analysisResult as VerificationData
        );

        const payrollUpdateInput: UpdateFinancingDataInput = {
          id,
          ...payrollUpdateData,
        };

        //@ts-ignore

        await financingDataModule.updateFinancingData(payrollUpdateInput);

        console.log(`🔍 Nómina re-analizada automáticamente`);
      }
    } catch (analysisError) {
      console.warn(
        `⚠️ Error en re-análisis automático: ${analysisError.message}`
      );
      // No fallar la operación completa por errores de análisis
    }

    return res.status(200).json({
      success: true,
      message: `${document_type} reemplazado exitosamente`,
      file: {
        url: newFile.url,
        filename: file.originalname,
        size: file.size,
      },
      analysisResult,
      previousFileUrl: currentFileUrl,
    });
  } catch (error) {
    console.error("❌ Error en replace-document:", error);

    if (error instanceof MedusaError) {
      return res.status(400).json({
        error: error.message,
        type: error.type,
      });
    }

    return res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};
