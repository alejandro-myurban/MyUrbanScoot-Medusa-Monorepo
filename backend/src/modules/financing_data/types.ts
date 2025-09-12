// Tipos para el módulo de financing_data
export interface VerificationData {
  isValid?: boolean;
  confidence?: number;
  extractedData?: {
    // DNI front data
    fullName?: string;
    documentNumber?: string;
    birthDate?: string;
    sex?: string;
    nationality?: string;
    
    // DNI back data
    addresses?: string[];
    birthPlace?: string;
    
    // Payroll data
    grossSalary?: string | number;
    netSalary?: string | number;
    companyName?: string;
    companyActivity?: string;
    companyPhone?: string;
    contractType?: string;
    yearOfEntry?: string | number;
    period?: string;
    
    // Bank data
    accountNumber?: string;
    balance?: string | number;
    [key: string]: any;
  };
  issues?: string[];
  analysisDetails?: string;
}

export interface FinancingDataBase {
  id: string;
  email: string;
  identity_front_file_id: string;
  identity_back_file_id: string;
  income: string;
  paysheet_file_id?: string | null;
  contract_type?: string | null;
  company_position?: string | null;
  company_start_date?: Date | null;
  freelance_rental_file_id?: string | null;
  freelance_quote_file_id?: string | null;
  freelance_start_date?: Date | null;
  pensioner_proof_file_id?: string | null;
  bank_account_proof_file_id?: string | null;
  financing_installment_count: string;
  housing_type: string;
  housing_type_details?: string | null;
  civil_status: string;
  marital_status_details?: string | null;
  address: string;
  postal_code: string;
  city: string;
  province: string;
  phone_mumber: string;
  doubts?: string | null;
  requested_at: Date;
  dni_front_verification?: VerificationData | null;
  dni_back_verification?: VerificationData | null;
  payroll_verification?: VerificationData | null;
  bank_verification?: VerificationData | null;
  status: string;
  admin_notes?: string | null;
  contacted: boolean;
}

// Tipo para crear nuevos registros (sin id)
export type CreateFinancingDataInput = Omit<FinancingDataBase, 'id'>;

// Tipo para actualizar registros (id obligatorio, resto opcional)
export type UpdateFinancingDataInput = {
  id: string;
} & Partial<Omit<FinancingDataBase, 'id'>>;

// Tipos específicos para diferentes campos
export type ContractType = 
  | 'employee_permanent' 
  | 'employee_temporary' 
  | 'freelancer' 
  | 'pensioner' 
  | 'unemployed';

export type HousingType = 
  | 'own' 
  | 'rent' 
  | 'family' 
  | 'other' 
  | 'partner' 
  | 'leasing' 
  | 'usufruct';

export type CivilStatus = 
  | 'single' 
  | 'married' 
  | 'divorced' 
  | 'widowed' 
  | 'domestic_partnership';

export type FinancingStatus = 
  | 'pending' 
  | 'budgeted' 
  | 'missing_docs' 
  | 'denied' 
  | 'cancelled' 
  | 'pre_accepted' 
  | 'under_review' 
  | 'in_force' 
  | 'in_software' 
  | 'delivered';

// Tipo para campos específicos que se pueden actualizar
export interface FinancingDataUpdatableFields {
  // Información básica
  email?: string;
  income?: string;
  contract_type?: ContractType;
  company_position?: string;
  company_start_date?: Date;
  freelance_start_date?: Date;
  
  // Archivos
  identity_front_file_id?: string;
  identity_back_file_id?: string;
  paysheet_file_id?: string;
  freelance_rental_file_id?: string;
  freelance_quote_file_id?: string;
  pensioner_proof_file_id?: string;
  bank_account_proof_file_id?: string;
  
  // Financiación
  financing_installment_count?: string;
  
  // Vivienda
  housing_type?: HousingType;
  housing_type_details?: string;
  
  // Estado civil
  civil_status?: CivilStatus;
  marital_status_details?: string;
  
  // Dirección y contacto
  address?: string;
  postal_code?: string;
  city?: string;
  province?: string;
  phone_mumber?: string;
  doubts?: string;
  
  // Verificaciones
  dni_front_verification?: VerificationData;
  dni_back_verification?: VerificationData;
  payroll_verification?: VerificationData;
  bank_verification?: VerificationData;
  
  // Estado y administración
  status?: FinancingStatus;
  admin_notes?: string;
  contacted?: boolean;
}

// Tipo final para updateFinancingData con tipado robusto
export interface UpdateFinancingDataRequest {
  id: string;
  data?: FinancingDataUpdatableFields;
  // O también podemos usar esta sintaxis alternativa:
}

// Interfaz optimizada para el endpoint replace-document
export interface ReplaceDocumentUpdateData {
  id: string;
  identity_front_file_id?: string;
  identity_back_file_id?: string;
  paysheet_file_id?: string;
  bank_account_proof_file_id?: string;
  freelance_rental_file_id?: string;
  freelance_quote_file_id?: string;
  pensioner_proof_file_id?: string;
  dni_front_verification?: VerificationData;
  dni_back_verification?: VerificationData;
  payroll_verification?: VerificationData;
  bank_verification?: VerificationData;
}