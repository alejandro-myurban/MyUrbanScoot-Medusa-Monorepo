import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { FINANCING_MODULE } from "modules/financing_data";
import FinancingModuleService from "modules/financing_data/service";

// Función para normalizar el número de teléfono (misma que en route.ts)
const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return phone;
  
  // Limpiar espacios y caracteres especiales excepto +
  const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
  
  console.log(`📞 Normalizando teléfono para búsqueda: "${phone}" -> "${cleanPhone}"`);
  
  // Si ya tiene un prefijo internacional (empieza con +), dejarlo como está
  if (cleanPhone.startsWith('+')) {
    console.log(`✅ Teléfono ya tiene prefijo internacional: ${cleanPhone}`);
    return cleanPhone;
  }
  
  // Si empieza con 34 sin +, añadir el +
  if (cleanPhone.startsWith('34') && cleanPhone.length >= 11) {
    const normalized = `+${cleanPhone}`;
    console.log(`🔄 Añadiendo + a prefijo 34: ${normalized}`);
    return normalized;
  }
  
  // Si no tiene prefijo y tiene 9 dígitos (típico español), añadir +34
  if (cleanPhone.length === 9 && /^[67]/.test(cleanPhone)) {
    const normalized = `+34${cleanPhone}`;
    console.log(`🇪🇸 Añadiendo prefijo español +34: ${normalized}`);
    return normalized;
  }
  
  // Si no cumple ninguna condición anterior, devolver tal como está
  console.log(`⚠️ Teléfono no normalizado (formato no reconocido): ${cleanPhone}`);
  return cleanPhone;
};

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    console.log("🔥 Backend API /store/financing-data/check-phone called");
    console.log("📋 Request body:", JSON.stringify(req.body, null, 2));
    
    const { phone_number } = req.body;

    console.log(`🔍 Checking phone number existence: "${phone_number}"`);
    console.log(`📏 Phone number length: ${phone_number?.length}`);
    console.log(`📞 Phone number type: ${typeof phone_number}`);

    // Validar que el número de teléfono esté presente
    if (!phone_number || phone_number.trim() === "") {
      console.log("❌ Número de teléfono vacío o no proporcionado");
      return res.status(400).json({
        message: "Número de teléfono requerido",
        exists: false
      });
    }

    // Normalizar el número de teléfono para búsqueda consistente
    const normalizedPhoneNumber = normalizePhoneNumber(phone_number);
    console.log(`📞 Teléfono normalizado para búsqueda: "${phone_number}" -> "${normalizedPhoneNumber}"`)

    console.log("📡 Resolviendo financing module service...");
    const financingDataModule: FinancingModuleService =
      req.scope.resolve(FINANCING_MODULE);
    console.log("✅ Financing module service resuelto");

    console.log(`🔎 Buscando solicitudes con phone_mumber: "${normalizedPhoneNumber}"`);
    
    // Buscar si existe alguna solicitud con este número de teléfono normalizado
    const existingRequestsNormalized = await financingDataModule.listFinancingData({
      phone_mumber: normalizedPhoneNumber
    });

    console.log(`📊 Solicitudes encontradas con número normalizado:`, existingRequestsNormalized?.length || 0);
    
    // También buscar sin el prefijo +34 para datos antiguos
    let existingRequestsWithoutPrefix = [];
    if (normalizedPhoneNumber.startsWith('+34')) {
      const phoneWithoutPrefix = normalizedPhoneNumber.replace('+34', '');
      console.log(`🔎 Buscando también solicitudes sin prefijo: "${phoneWithoutPrefix}"`);
      
      existingRequestsWithoutPrefix = await financingDataModule.listFinancingData({
        phone_mumber: phoneWithoutPrefix
      });
      
      console.log(`📊 Solicitudes encontradas sin prefijo:`, existingRequestsWithoutPrefix?.length || 0);
    }
    
    // Combinar ambos resultados
    const allExistingRequests = [
      ...(existingRequestsNormalized || []),
      ...(existingRequestsWithoutPrefix || [])
    ];
    
    console.log(`📊 Total solicitudes encontradas:`, allExistingRequests?.length || 0);
    if (allExistingRequests && allExistingRequests.length > 0) {
      console.log(`📋 Detalles de solicitudes encontradas:`, allExistingRequests.map(req => ({ 
        id: req.id, 
        phone_mumber: req.phone_mumber,
        email: req.email,
        created_at: req.created_at 
      })));
    }

    const exists = allExistingRequests && allExistingRequests.length > 0;

    console.log(`🎯 RESULTADO FINAL - Phone number ${normalizedPhoneNumber} exists: ${exists}`);

    res.status(200).json({
      exists,
      message: exists 
        ? "Ya existe una solicitud con este número de teléfono" 
        : "Número de teléfono disponible",
      count: allExistingRequests?.length || 0,
      normalized_phone: normalizedPhoneNumber // Devolver el teléfono normalizado
    });

  } catch (error) {
    console.error("❌ Error checking phone number:", error);
    console.error("📊 Error stack:", error.stack);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    res.status(500).json({
      message: "Error al verificar el número de teléfono",
      error: errorMessage,
      exists: false
    });
  }
};