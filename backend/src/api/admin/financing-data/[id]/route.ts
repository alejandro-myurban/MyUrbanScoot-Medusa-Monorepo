import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { FINANCING_MODULE } from "modules/financing_data";
import FinancingModuleService from "modules/financing_data/service";

// Configuración de campos editables con sus tipos y validaciones
const FIELD_CONFIG = {
  // Campos de texto básicos
  email: { type: 'email', required: true },
  address: { type: 'text', required: true },
  postal_code: { type: 'text', required: true },
  city: { type: 'text', required: true },
  province: { type: 'text', required: true },
  phone_mumber: { type: 'text', required: true },
  
  // Campos de ingresos y detalles
  income: { type: 'text', required: true },
  company_position: { type: 'text', required: false },
  housing_type_details: { type: 'text', required: false },
  marital_status_details: { type: 'text', required: false },
  doubts: { type: 'textarea', required: false },
  admin_notes: { type: 'textarea', required: false },

  // Campos de fechas
  company_start_date: { type: 'date', required: false },
  freelance_start_date: { type: 'date', required: false },

  // Campos con opciones predefinidas
  contract_type: { 
    type: 'select', 
    required: true,
    options: ['employee_permanent', 'employee_temporary', 'freelancer', 'pensioner', 'unemployed']
  },
  housing_type: { 
    type: 'select', 
    required: true,
    options: ['own', 'rent', 'family', 'other', 'partner', 'leasing', 'usufruct']
  },
  civil_status: { 
    type: 'select', 
    required: true,
    options: ['single', 'married', 'divorced', 'widowed', 'domestic_partnership']
  },
  financing_installment_count: { 
    type: 'select', 
    required: true,
    options: ['6', '12', '18', '24', '36', '48']
  },
  status: { 
    type: 'select', 
    required: true,
    options: ['pending', 'budgeted', 'missing_docs', 'denied', 'cancelled', 'pre_accepted', 'under_review', 'in_force', 'in_software', 'delivered']
  },

  // Campos booleanos
  contacted: { type: 'boolean', required: false },

  // Campos de archivos (solo lectura por ahora)
  identity_front_file_id: { type: 'readonly' },
  identity_back_file_id: { type: 'readonly' },
  paysheet_file_id: { type: 'readonly' },
  freelance_rental_file_id: { type: 'readonly' },
  freelance_quote_file_id: { type: 'readonly' },
  pensioner_proof_file_id: { type: 'readonly' },
  bank_account_proof_file_id: { type: 'readonly' },

  // Campos de verificación (editables como objetos JSON)
  dni_front_verification: { type: 'json-object' },
  dni_back_verification: { type: 'json-object' },
  payroll_verification: { type: 'json-object' },
  bank_verification: { type: 'json-object' },

  // Campos del sistema (solo lectura)
  id: { type: 'readonly' },
  created_at: { type: 'readonly' },
  requested_at: { type: 'readonly' },
};

// Función de validación dinámica
const validateField = (field: string, value: any) => {
  const config = FIELD_CONFIG[field as keyof typeof FIELD_CONFIG];
  if (!config) return { valid: false, error: `Campo '${field}' no es editable` };

  // Campo de solo lectura
  if (config.type === 'readonly') {
    return { valid: false, error: `Campo '${field}' es de solo lectura` };
  }

  // Validación requerido
  //@ts-ignore
  if (config.required && (!value || value.toString().trim() === '')) {
    return { valid: false, error: `Campo '${field}' es requerido` };
  }

  // Validación por tipo
  switch (config.type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        return { valid: false, error: `Email inválido` };
      }
      break;

    case 'select':
      if (value && 'options' in config && !config.options.includes(value)) {
        return { valid: false, error: `Valor inválido. Opciones válidas: ${config.options.join(', ')}` };
      }
      break;

    case 'date':
      if (value && isNaN(Date.parse(value))) {
        return { valid: false, error: `Fecha inválida` };
      }
      break;

    case 'boolean':
      if (value !== undefined && typeof value !== 'boolean') {
        return { valid: false, error: `Valor debe ser true o false` };
      }
      break;
  }

  return { valid: true };
};

export const PUT = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const updateData = req.body;

  console.log(`🔍 DEBUG API - Actualizando financing data ${id}:`, JSON.stringify(updateData, null, 2));

  // Validar que el ID esté presente
  if (!id || id.trim() === "") {
    return res.status(400).json({
      message: "ID de solicitud requerido",
    });
  }

  // Validar que haya datos para actualizar
  if (!updateData || Object.keys(updateData).length === 0) {
    return res.status(400).json({
      message: "No se proporcionaron datos para actualizar",
    });
  }

  // Validar cada campo
  const validationErrors: string[] = [];
  for (const [field, value] of Object.entries(updateData)) {
    const validation = validateField(field, value);
    if (!validation.valid) {
      validationErrors.push(`${field}: ${validation.error}`);
    }
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({
      message: "Errores de validación",
      errors: validationErrors,
    });
  }

  const financingDataModule: FinancingModuleService =
    req.scope.resolve(FINANCING_MODULE);

  try {
    // Usar el método updateFinancingData del MedusaService
    //@ts-ignore
    const updatedData = await financingDataModule.updateFinancingData({
      id,
        //@ts-ignore
      ...updateData,
    });

    console.log(`✅ Financing data actualizado para solicitud ${id}`);
    console.log(`📊 Campos actualizados:`, Object.keys(updateData));

    res.status(200).json({
      message: "Datos actualizados correctamente",
      data: updatedData,
      updated_fields: Object.keys(updateData),
    });
  } catch (error) {
    console.error("❌ Error actualizando financing data:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    res.status(500).json({
      message: "Error al actualizar los datos",
      error: errorMessage,
    });
  }
};

// Endpoint GET para obtener la configuración de campos (útil para el frontend)
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    return res.status(400).json({
      message: "ID de solicitud requerido",
    });
  }

  const financingDataModule: FinancingModuleService =
    req.scope.resolve(FINANCING_MODULE);

  try {
    // Obtener los datos actuales
      //@ts-ignore
    const financingData = await financingDataModule.listFinancingData({ id });
    
    if (!financingData || financingData.length === 0) {
      return res.status(404).json({
        message: "Solicitud no encontrada",
      });
    }

    res.status(200).json({
      data: financingData[0],
      field_config: FIELD_CONFIG,
    });
  } catch (error) {
    console.error("❌ Error obteniendo financing data:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    res.status(500).json({
      message: "Error al obtener los datos",
      error: errorMessage,
    });
  }
};