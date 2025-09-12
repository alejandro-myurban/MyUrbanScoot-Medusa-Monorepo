import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { SearchSchema } from "./store/products/search/route";
import multer from "multer";
import type {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB límite
    files: 3, // Máximo 3 archivos
  },
  fileFilter: (req, file, cb) => {
    console.log("🔍 Multer fileFilter:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });

    // Solo permitir imágenes

    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("application/pdf")
    ) {
      cb(null, true);
    } else {
      console.log("❌ Archivo rechazado:", file.mimetype);
      cb(new Error("Solo se permiten archivos de imagen y PDF"));
    }
  },
});

// Middleware con logging
const uploadMiddleware = (req, res, next) => {
  console.log("🔧 Middleware upload ejecutándose");
  console.log("📦 Content-Type:", req.headers["content-type"]);

  upload.array("files", 3)(req, res, (err) => {
    if (err) {
      console.log("❌ Error en multer:", err.message);
      return res.status(400).json({
        error: "Error procesando archivos",
        details: err.message,
      });
    }

    console.log("✅ Multer procesado, archivos:", req.files?.length || 0);
    next();
  });
};

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/products/search",
      method: ["POST"],
      middlewares: [validateAndTransformBody(SearchSchema)],
    },
    {
      matcher: "/store/upload-image",
      method: ["POST"],
      middlewares: [uploadMiddleware],
    },
    {
      matcher: "/admin/financing/*/replace-document",
      method: ["POST"],
      middlewares: [uploadMiddleware],
    },
    {
      matcher: "/store/document-verification", // Cambia esto por la ruta que necesites
      method: ["POST"],
      bodyParser: { sizeLimit: "8mb" },
    },
    {
      matcher: "/store/carts/*", 
      middlewares: [
        (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          console.log("Request body to calculated-fulfillment:", req.body)
          next()
        },
      ],
    },
  ],
});
