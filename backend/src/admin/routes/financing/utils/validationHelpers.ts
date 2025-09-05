import { ValidationResult, FieldRules } from '../types';
import { VALIDATION_RULES } from '../constants';

export const validationHelpers = {
  // Validate a field based on its rules
  validateField: (field: string, value: any): ValidationResult => {
    const rules = validationHelpers.getFieldRules(field);
    
    if (!rules) {
      return { isValid: true };
    }

    // Check if required field is empty
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return {
        isValid: false,
        message: 'Este campo es obligatorio'
      };
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { isValid: true };
    }

    const stringValue = String(value);

    // Check minimum length
    if (rules.minLength && stringValue.length < rules.minLength) {
      return {
        isValid: false,
        message: `Mínimo ${rules.minLength} caracteres`
      };
    }

    // Check maximum length
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return {
        isValid: false,
        message: `Máximo ${rules.maxLength} caracteres`
      };
    }

    // Check pattern
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return {
        isValid: false,
        message: validationHelpers.getPatternErrorMessage(field)
      };
    }

    return { isValid: true };
  },

  // Get validation rules for a field
  getFieldRules: (field: string): FieldRules | null => {
    return VALIDATION_RULES[field as keyof typeof VALIDATION_RULES] || null;
  },

  // Get error message for pattern validation
  getPatternErrorMessage: (field: string): string => {
    const messages: { [key: string]: string } = {
      email: 'Formato de email inválido',
      phone: 'Formato de teléfono inválido',
      postal_code: 'Código postal debe tener 5 dígitos',
      income: 'Formato de cantidad inválido'
    };

    return messages[field] || 'Formato inválido';
  },

  // Validate email format
  isValidEmail: (email: string): boolean => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  // Validate phone number format
  isValidPhone: (phone: string): boolean => {
    if (!phone) return false;
    const phoneRegex = /^[0-9+\s-()]+$/;
    const cleaned = phone.replace(/\s/g, '');
    return phoneRegex.test(phone) && cleaned.length >= 9;
  },

  // Validate Spanish postal code
  isValidPostalCode: (code: string): boolean => {
    if (!code) return false;
    const postalRegex = /^\d{5}$/;
    return postalRegex.test(code.trim());
  },

  // Validate DNI/NIE format
  isValidDNI: (dni: string): boolean => {
    if (!dni) return false;
    const dniRegex = /^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z])$/;
    const cleaned = dni.replace(/[-\s]/g, '').toUpperCase();
    
    if (!dniRegex.test(cleaned)) return false;

    // Check DNI letter
    if (/^\d{8}[A-Z]$/.test(cleaned)) {
      const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
      const number = parseInt(cleaned.substring(0, 8));
      const letter = cleaned.charAt(8);
      return letters.charAt(number % 23) === letter;
    }

    // Check NIE letter (basic validation)
    return /^[XYZ]\d{7}[A-Z]$/.test(cleaned);
  },

  // Validate income amount
  isValidIncome: (income: string | number): boolean => {
    if (!income) return false;
    const amount = typeof income === 'string' ? parseFloat(income) : income;
    return !isNaN(amount) && amount > 0;
  },

  // Validate date format
  isValidDate: (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  },

  // Validate age (must be 18 or older)
  isValidAge: (birthDate: string): boolean => {
    if (!birthDate || !validationHelpers.isValidDate(birthDate)) return false;
    
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1 >= 18;
    }
    
    return age >= 18;
  },

  // Validate required documents based on contract type
  validateRequiredDocuments: (contractType: string, documents: any): ValidationResult => {
    const requiredDocs: string[] = ['identity_front_file_id', 'identity_back_file_id'];
    
    switch (contractType) {
      case 'employee_permanent':
      case 'employee_temporary':
        requiredDocs.push('paysheet_file_id');
        break;
      case 'freelancer':
        requiredDocs.push('freelance_rental_file_id');
        break;
      case 'pensioner':
        requiredDocs.push('pensioner_proof_file_id');
        break;
    }

    const missingDocs = requiredDocs.filter(doc => !documents[doc]);
    
    if (missingDocs.length > 0) {
      return {
        isValid: false,
        message: `Faltan documentos obligatorios: ${missingDocs.length}`
      };
    }

    return { isValid: true };
  },

  // Validate complete form data
  validateForm: (data: any): { isValid: boolean; errors: { [key: string]: string } } => {
    const errors: { [key: string]: string } = {};
    
    // Required fields validation
    const requiredFields = [
      'email', 'phone_mumber', 'address', 'postal_code', 
      'city', 'province', 'contract_type', 'income',
      'financing_installment_count', 'housing_type', 'civil_status'
    ];

    requiredFields.forEach(field => {
      const result = validationHelpers.validateField(field, data[field]);
      if (!result.isValid) {
        errors[field] = result.message || 'Campo inválido';
      }
    });

    // Custom validations
    if (data.email && !validationHelpers.isValidEmail(data.email)) {
      errors.email = 'Formato de email inválido';
    }

    if (data.phone_mumber && !validationHelpers.isValidPhone(data.phone_mumber)) {
      errors.phone_mumber = 'Formato de teléfono inválido';
    }

    if (data.postal_code && !validationHelpers.isValidPostalCode(data.postal_code)) {
      errors.postal_code = 'Código postal inválido';
    }

    if (data.income && !validationHelpers.isValidIncome(data.income)) {
      errors.income = 'Cantidad de ingresos inválida';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Get validation summary
  getValidationSummary: (data: any): { 
    totalFields: number; 
    validFields: number; 
    invalidFields: number;
    completionPercentage: number;
  } => {
    const { errors } = validationHelpers.validateForm(data);
    const totalFields = Object.keys(VALIDATION_RULES).length;
    const invalidFields = Object.keys(errors).length;
    const validFields = totalFields - invalidFields;
    
    return {
      totalFields,
      validFields,
      invalidFields,
      completionPercentage: Math.round((validFields / totalFields) * 100)
    };
  }
};