import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { FINANCING_MODULE } from "modules/financing_data";
import FinancingModuleService from "modules/financing_data/service";

// Función para normalizar el número de teléfono
const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return phone;
  
  // Limpiar espacios y caracteres especiales excepto +
  const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
  
  console.log(`📞 Normalizando teléfono: "${phone}" -> "${cleanPhone}"`);
  
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

// Tipo actualizado que coincide con tu modelo y frontend
type FinancingRequestData = {
  email: string;
  identity_front_file_id: string;
  identity_back_file_id: string;
  income: string;
  paysheet_file_id?: string | null;
  contract_type: string;
  company_position?: string;
  company_start_date?: string;
  freelance_rental_file_id?: string | null;
  freelance_quote_file_id?: string | null;
  pensioner_proof_file_id?: string | null;
  bank_account_proof_file_id?: string | null;
  financing_installment_count: string;
  housing_type: string;
  housing_type_details?: string;
  civil_status: string;
  marital_status_details?: string;
  address: string;
  postal_code: string;
  city: string;
  province: string;
  phone_mumber: string; // Nota: mantuve el typo del modelo
  doubts?: string;
  requested_at?: string;
  dni_front_verification?: any;
  dni_back_verification?: any;
  payroll_verification?: any;
  bank_verification?: any;
  status?: string;
};

export const POST = async (
  req: MedusaRequest<FinancingRequestData>,
  res: MedusaResponse
) => {
  console.log("🚀 Datos recibidos en financing-data:", req.body);
  
  const requestData = req.body;

  // Normalizar el número de teléfono antes de procesar
  if (requestData.phone_mumber) {
    const originalPhone = requestData.phone_mumber;
    requestData.phone_mumber = normalizePhoneNumber(requestData.phone_mumber);
    console.log(`📞 Teléfono normalizado: "${originalPhone}" -> "${requestData.phone_mumber}"`);
  }

  // Validaciones básicas
  if (!requestData.email) {
    return res.status(400).json({
      message: "Email is required"
    });
  }

  if (!requestData.identity_front_file_id && !requestData.identity_back_file_id) {
    return res.status(400).json({
      message: "Identity (NIF/NIE) is required"
    });
  }

  // Convertir fecha si existe
  const requestedAt = requestData.requested_at 
    ? new Date(requestData.requested_at) 
    : new Date();

  // Convertir company_start_date si existe y es un string
  let companyStartDate = null;
  if (requestData.company_start_date) {
    companyStartDate = new Date(requestData.company_start_date);
  }

  // Mapear los datos del frontend al formato del modelo
  const financingData = {
    email: requestData.email,
    identity_front_file_id: requestData.identity_front_file_id,
    identity_back_file_id: requestData.identity_back_file_id,
    income: requestData.income,
    paysheet_file_id: requestData.paysheet_file_id || null,
    contract_type: requestData.contract_type,
    company_position: requestData.company_position || null,
    company_start_date: companyStartDate,
    freelance_rental_file_id: requestData.freelance_rental_file_id || null,
    freelance_quote_file_id: requestData.freelance_quote_file_id || null,
    pensioner_proof_file_id: requestData.pensioner_proof_file_id || null,
    bank_account_proof_file_id: requestData.bank_account_proof_file_id || null,
    financing_installment_count: requestData.financing_installment_count,
    housing_type: requestData.housing_type,
    housing_type_details: requestData.housing_type_details || null,
    civil_status: requestData.civil_status,
    marital_status_details: requestData.marital_status_details || null,
    address: requestData.address,
    postal_code: requestData.postal_code,
    city: requestData.city,
    province: requestData.province,
    phone_mumber: requestData.phone_mumber, // Mantuve el typo del modelo
    doubts: requestData.doubts || null,
    requested_at: requestedAt,
    dni_front_verification: requestData.dni_front_verification || null,
    dni_back_verification: requestData.dni_back_verification || null,
    payroll_verification: requestData.payroll_verification || null,
    bank_verification: requestData.bank_verification || null,
    status: requestData.status || "pending"
  };

  console.log("📦 Datos mapeados para guardar:", financingData);

  const financingDataModule: FinancingModuleService = req.scope.resolve(FINANCING_MODULE);

  try {
    //@ts-ignore
    const savedData = await financingDataModule.createFinancingData(financingData);

    console.log("✅ Datos guardados exitosamente:", savedData.id);

    res.status(201).json({
      message: "Financing data saved successfully",
      data: savedData
    });
  } catch (error) {
    console.error("❌ Error saving financing data:", error);
    
    // Error más detallado
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    res.status(500).json({
      message: "Error saving financing data",
      error: errorMessage,
      details: error
    });
  }
};