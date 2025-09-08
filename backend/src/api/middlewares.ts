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
    fileSize: 5 * 1024 * 1024, // 5MB límite
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

// 🔥 NUEVO: Middleware CORS para rutas públicas - CORREGIDO
const corsMiddleware = (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  const allowedOrigins = [
    "http://localhost:8000",
    "http://localhost:3000",
    "http://localhost:9000"
  ];
  
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // Para desarrollo, puedes permitir todos los orígenes
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  
  // 🔥 CORRECIÓN: Agregar x-publishable-api-key a los headers permitidos
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-publishable-api-key");
  
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  // Manejar preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  
  next();
};

export default defineMiddlewares({
  routes: [
    // 🔥 AGREGAR CORS A TUS RUTAS PÚBLICAS
    {
      matcher: "/appointments*",
      method: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      middlewares: [corsMiddleware],
    },
    {
      matcher: "/workshops*", 
      method: ["GET", "POST", "OPTIONS"],
      middlewares: [corsMiddleware],
    },
    {
      matcher: "/workshops/*/slots*",
      method: ["GET", "OPTIONS"],
      middlewares: [corsMiddleware],
    },
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
      matcher: "/store/document-verification",
      method: ["POST"],
      bodyParser: { sizeLimit: "5mb" },
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