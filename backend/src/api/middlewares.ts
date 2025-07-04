import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { SearchSchema } from "./store/products/search/route";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
    files: 3, // Máximo 3 archivos
  },
  fileFilter: (req, file, cb) => {
    console.log("🔍 Multer fileFilter:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    // Solo permitir imágenes
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      console.log("❌ Archivo rechazado:", file.mimetype);
      cb(new Error("Solo se permiten archivos de imagen"));
    }
  },
});

// Middleware con logging
const uploadMiddleware = (req, res, next) => {
  console.log("🔧 Middleware upload ejecutándose");
  console.log("📦 Content-Type:", req.headers['content-type']);
  
  upload.array('files', 3)(req, res, (err) => {
    if (err) {
      console.log("❌ Error en multer:", err.message);
      return res.status(400).json({
        error: "Error procesando archivos",
        details: err.message
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
  ],
});