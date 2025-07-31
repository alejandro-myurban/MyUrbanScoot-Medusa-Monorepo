import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { FINANCING_MODULE } from "modules/financing_data";
import FinancingModuleService from "modules/financing_data/service";

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
};

export const POST = async (
  req: MedusaRequest<FinancingRequestData>,
  res: MedusaResponse
) => {
  console.log("🚀 Datos recibidos en financing-data:", req.body);
  
  const requestData = req.body;

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
    requested_at: requestedAt
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