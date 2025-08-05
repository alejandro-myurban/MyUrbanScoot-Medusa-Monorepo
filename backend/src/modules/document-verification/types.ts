// src/modules/document-verification/types.ts
export interface VerificationResult {
  isValid: boolean;
  extractedData: {
    // Para DNI
    fullName?: string;
    documentNumber?: string;
    birthDate?: string;
    expirationDate?: string;
    nationality?: string;
    equipmentNumber?: string;
    addresses?: string[];
    birthPlace?: string;
    hasOfficialDesign?: boolean;
    

    // Para certificados bancarios
    bankName?: string;
    accountHolder?: string;
    iban?: string;
    accountNumber?: string;
    documentType?: string;
    issueDate?: string;
    balance?: string;

    // Para nóminas (payroll)
    employeeName?: string;
    employerName?: string;
    employerAddress?: string;
    payrollPeriod?: string;
    grossSalary?: string;
    netSalary?: string;
    socialSecurityNumber?: string;
    paymentDate?: string;
    workingHours?: string;
    jobTitle?: string;
    department?: string;
    taxWithholdings?: string;
    socialSecurityContributions?: string;
    hasOfficialPayrollFormat?: boolean;
  };
  confidence: number;
  issues: string[];
  imageQuality: "excellent" | "good" | "fair" | "poor";
}

export interface BothSidesVerificationResult {
  front: VerificationResult;
  back: VerificationResult;
  crossValidation: {
    isConsistent: boolean;
    issues: string[];
  };
}

export interface ServiceStatus {
  service: string;
  status: string;
  hasApiKey: boolean;
  timestamp: string;
}

// Request types para los endpoints
export interface DocumentVerificationRequest {
  image: string;
  documentType: DocumentType; 
}

export interface BothSidesVerificationRequest {
  frontImage: string;
  backImage: string;
}

export type DocumentType =
  | "dni_front"
  | "dni_back"
  | "bank_certificate"
  | "bank_statement"
  | "payroll";
