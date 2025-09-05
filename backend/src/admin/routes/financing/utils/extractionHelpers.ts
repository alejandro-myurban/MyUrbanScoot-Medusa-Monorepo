import { FinancingData, ExtractedDniInfo } from '../types';

export const extractionHelpers = {
  // Extract DNI information from verification data (matching original structure)
  extractDniInfo: (request: FinancingData): any => {
    let dniData = {
      fullName: null as string | null,
      documentNumber: null as string | null,
      birthDate: null as string | null,
      nationality: null as string | null,
      sex: null as string | null,
      addresses: null as string | null,
    };

    // Intentar obtener datos del DNI frontal primero
    if (request.dni_front_verification?.extractedData) {
      const frontData = request.dni_front_verification.extractedData;
      dniData.fullName = frontData.fullName || null;
      dniData.documentNumber = frontData.documentNumber || null;
      dniData.birthDate = frontData.birthDate || null;
      dniData.nationality = frontData.nationality || null;
      dniData.sex = frontData.sex || null;
    }

    if (request.dni_back_verification?.extractedData) {
      const backData = request.dni_back_verification.extractedData;
      dniData.addresses = backData.addresses || dniData.addresses;
    }

    // Si no hay datos del frontal, intentar con el trasero
    if (!dniData.fullName && request.dni_back_verification?.extractedData) {
      const backData = request.dni_back_verification.extractedData;
      dniData.fullName = backData.fullName || dniData.fullName;
      dniData.documentNumber =
        backData.documentNumber || dniData.documentNumber;
      dniData.birthDate = backData.birthDate || dniData.birthDate;
      dniData.nationality = backData.nationality || dniData.nationality;
      dniData.sex = backData.sex || dniData.sex;
    }

    return dniData;
  },

  // Get confidence level of extraction
  getExtractionConfidence: (verification: any): number => {
    if (!verification) return 0;

    let totalConfidence = 0;
    let fieldCount = 0;

    // Check front verification confidence
    if (verification.front?.document_fields) {
      const fields = verification.front.document_fields;
      Object.values(fields).forEach((field: any) => {
        if (field?.confidence) {
          totalConfidence += field.confidence;
          fieldCount++;
        }
      });
    }

    // Check back verification confidence
    if (verification.back?.document_fields) {
      const fields = verification.back.document_fields;
      Object.values(fields).forEach((field: any) => {
        if (field?.confidence) {
          totalConfidence += field.confidence;
          fieldCount++;
        }
      });
    }

    return fieldCount > 0 ? totalConfidence / fieldCount : 0;
  },

  // Determine if manual mode should be shown
  shouldShowManualMode: (verification: any): boolean => {
    const confidence = extractionHelpers.getExtractionConfidence(verification);
    return confidence < 0.8; // Show manual mode if confidence is below 80%
  },

  // Combine front and back extraction data
  combineExtractionData: (front: any, back: any): any => {
    const combined: any = {};

    // Combine document fields
    if (front?.document_fields || back?.document_fields) {
      combined.document_fields = {
        ...(front?.document_fields || {}),
        ...(back?.document_fields || {})
      };
    }

    // Combine confidence scores
    const frontConfidence = extractionHelpers.getExtractionConfidence({ front });
    const backConfidence = extractionHelpers.getExtractionConfidence({ back });
    combined.overall_confidence = (frontConfidence + backConfidence) / 2;

    // Combine processing status
    combined.status = 'processed';
    if (front?.status === 'processing' || back?.status === 'processing') {
      combined.status = 'processing';
    }
    if (front?.status === 'error' || back?.status === 'error') {
      combined.status = 'error';
    }

    return combined;
  },

  // Extract payroll information (matching original structure)
  extractPayrollInfo: (request: FinancingData): any => {
    let payrollData = {
      employerName: null as string | null,
      employeeName: null as string | null,
      jobTitle: null as string | null,
      grossSalary: null as string | null,
      netSalary: null as string | null,
      payrollPeriod: null as string | null,
    };

    // Si hay verificación combinada de nóminas (nueva estructura)
    if (request.payroll_verification?.combined) {
      const primary = request.payroll_verification.primary?.extractedData;
      const secondary = request.payroll_verification.secondary?.extractedData;

      // Usar datos primarios primero, después secundarios como fallback
      payrollData.employerName =
        primary?.employerName || secondary?.employerName || null;
      payrollData.employeeName =
        primary?.employeeName || secondary?.employeeName || null;
      payrollData.jobTitle = primary?.jobTitle || secondary?.jobTitle || null;
      payrollData.grossSalary =
        primary?.grossSalary || secondary?.grossSalary || null;
      payrollData.netSalary =
        primary?.netSalary || secondary?.netSalary || null;
      payrollData.payrollPeriod =
        primary?.payrollPeriod || secondary?.payrollPeriod || null;
    }
    // Si hay verificación simple de nómina (estructura anterior)
    else if (request.payroll_verification?.extractedData) {
      const data = request.payroll_verification.extractedData;
      payrollData.employerName = data.employerName || null;
      payrollData.employeeName = data.employeeName || null;
      payrollData.jobTitle = data.jobTitle || null;
      payrollData.grossSalary = data.grossSalary || null;
      payrollData.netSalary = data.netSalary || null;
      payrollData.payrollPeriod = data.payrollPeriod || null;
    }

    return payrollData;
  }
};