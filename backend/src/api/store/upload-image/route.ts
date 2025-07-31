// src/api/store/upload-image/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows";
import { MedusaError } from "@medusajs/framework/utils";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("🔥 Endpoint upload-image llamado");

    const access = "public";
    let input: any[] = [];

    if (Array.isArray(req.files)) {
      input = req.files;
    } else if (req.files && typeof req.files === "object") {
      // Flatten all files from the object into a single array
      input = Object.values(req.files).flat();
    }

    if (!input?.length) {
      return res.status(400).json({
        error: "No se encontraron archivos",
        details: "Debes enviar archivos con el nombre 'files'",
      });
    }

    console.log(
      "📸 Archivos recibidos:",
      input.map((f) => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
      }))
    );

    // Validaciones
    for (const file of input) {
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
    }

    // Usar el workflow oficial de Medusa para subir archivos
    const { result } = await uploadFilesWorkflow(req.scope).run({
      input: {
        files: input.map((f) => ({
          filename: f.originalname,
          mimeType: f.mimetype,
          content: f.buffer.toString("binary"),
          access,
        })),
      },
    });

    console.log("✅ Archivos subidos:", result);

    // Transformar el resultado para que sea compatible con el frontend
    const uploadedFiles = result.map((file) => ({
      url: file.url,
      //@ts-ignore
      filename: file.filename,
      //@ts-ignore

      originalName: file.filename,
      //@ts-ignore

      size: file.size || 0,
    }));

    return res.status(200).json({
      success: true,
      files: uploadedFiles,
      // Para compatibilidad con código que espera una sola imagen
      url: uploadedFiles[0]?.url,
    });
  } catch (error) {
    console.error("❌ Error en upload-image:", error);

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
