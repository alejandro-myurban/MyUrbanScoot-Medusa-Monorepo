import { useState, useMemo } from "react";
import { FinancingData, ExtractedDniInfo } from "../types";
import { extractionHelpers } from "../utils/extractionHelpers";

export const useDocumentExtraction = (request: FinancingData) => {
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [showExtractedData, setShowExtractedData] = useState<boolean>(false);

  // Extract DNI information
  const dniInfo = useMemo<ExtractedDniInfo>(() => {
    return extractionHelpers.extractDniInfo(request);
  }, [request.dni_front_verification, request.dni_back_verification]);

  // Extract payroll information
  const payrollInfo = useMemo(() => {
    return extractionHelpers.extractPayrollInfo(request);
  }, [request.payroll_verification]);

  // Determine if manual mode should be shown
  const shouldShowManualMode = useMemo(() => {
    return extractionHelpers.shouldShowManualMode({
      front: request.dni_front_verification,
      back: request.dni_back_verification
    });
  }, [request.dni_front_verification, request.dni_back_verification]);

  // Get overall confidence
  const overallConfidence = useMemo(() => {
    return extractionHelpers.getExtractionConfidence({
      front: request.dni_front_verification,
      back: request.dni_back_verification,
      payroll: request.payroll_verification
    });
  }, [request.dni_front_verification, request.dni_back_verification, request.payroll_verification]);

  // Check if extraction is complete
  const isExtractionComplete = useMemo(() => {
    const hasBasicExtraction = request.dni_front_verification && request.dni_back_verification;
    
    // Check if payroll extraction is needed and complete
    let hasRequiredExtractions = true;
    if ((request.contract_type === 'employee_permanent' || request.contract_type === 'employee_temporary') && request.paysheet_file_id) {
      hasRequiredExtractions = Boolean(request.payroll_verification);
    }

    return hasBasicExtraction && hasRequiredExtractions;
  }, [request]);

  // Toggle functions
  const toggleManualMode = () => {
    setManualMode(prev => !prev);
  };

  const toggleExtractedData = () => {
    setShowExtractedData(prev => !prev);
  };

  // Get extraction status
  const getExtractionStatus = () => {
    const status = {
      dniStatus: 'missing' as 'missing' | 'processing' | 'completed' | 'error',
      payrollStatus: 'missing' as 'missing' | 'processing' | 'completed' | 'error' | 'not_required',
      overallStatus: 'missing' as 'missing' | 'processing' | 'completed' | 'error'
    };

    // DNI status
    if (request.dni_front_verification || request.dni_back_verification) {
      const frontStatus = request.dni_front_verification?.status;
      const backStatus = request.dni_back_verification?.status;
      
      if (frontStatus === 'error' || backStatus === 'error') {
        status.dniStatus = 'error';
      } else if (frontStatus === 'processing' || backStatus === 'processing') {
        status.dniStatus = 'processing';
      } else if (frontStatus === 'processed' && backStatus === 'processed') {
        status.dniStatus = 'completed';
      }
    }

    // Payroll status
    if (request.contract_type === 'employee_permanent' || request.contract_type === 'employee_temporary') {
      if (request.payroll_verification) {
        const payrollStatusValue = request.payroll_verification.status;
        if (payrollStatusValue === 'error') {
          status.payrollStatus = 'error';
        } else if (payrollStatusValue === 'processing') {
          status.payrollStatus = 'processing';
        } else if (payrollStatusValue === 'processed') {
          status.payrollStatus = 'completed';
        }
      } else {
        status.payrollStatus = 'missing';
      }
    } else {
      status.payrollStatus = 'not_required';
    }

    // Overall status
    if (status.dniStatus === 'error' || status.payrollStatus === 'error') {
      status.overallStatus = 'error';
    } else if (status.dniStatus === 'processing' || status.payrollStatus === 'processing') {
      status.overallStatus = 'processing';
    } else if (status.dniStatus === 'completed' && (status.payrollStatus === 'completed' || status.payrollStatus === 'not_required')) {
      status.overallStatus = 'completed';
    }

    return status;
  };

  // Get formatted extraction data for display
  const getFormattedExtractionData = () => {
    const formatted = {
      dni: {} as any,
      payroll: {} as any
    };

    // Format DNI data
    if (dniInfo) {
      formatted.dni = {
        name: dniInfo.name || 'No extraído',
        surname: dniInfo.surname || 'No extraído',
        dni: dniInfo.dni || 'No extraído',
        birthDate: dniInfo.birthDate ? new Date(dniInfo.birthDate).toLocaleDateString('es-ES') : 'No extraído',
        address: dniInfo.address || 'No extraído',
        confidence: dniInfo.confidence || 0
      };
    }

    // Format payroll data
    if (payrollInfo) {
      formatted.payroll = {
        employerName: payrollInfo.employerName || 'No extraído',
        grossSalary: payrollInfo.grossSalary ? `${payrollInfo.grossSalary}€` : 'No extraído',
        netSalary: payrollInfo.netSalary ? `${payrollInfo.netSalary}€` : 'No extraído',
        position: payrollInfo.position || 'No extraído',
        confidence: payrollInfo.confidence || 0
      };
    }

    return formatted;
  };

  return {
    // Data
    dniInfo,
    payrollInfo,
    overallConfidence,
    isExtractionComplete,
    shouldShowManualMode,

    // State
    manualMode,
    showExtractedData,

    // Actions
    toggleManualMode,
    toggleExtractedData,
    setManualMode,
    setShowExtractedData,

    // Status
    getExtractionStatus,
    getFormattedExtractionData,
  };
};