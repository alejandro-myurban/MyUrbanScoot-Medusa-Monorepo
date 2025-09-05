import { CONTRACT_TYPE_LABELS, STATUS_ICONS } from '../constants';

export const formatters = {
  // Format date strings to readable format
  date: (dateString: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  },

  // Format currency amounts
  currency: (amount: number | string, currency: string = 'EUR'): string => {
    if (!amount) return '-';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '-';
    
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  },

  // Format phone numbers
  phone: (phone: string): string => {
    if (!phone) return '-';
    // Basic phone formatting for Spanish numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return phone;
  },

  // Format document numbers (DNI, NIE, etc.)
  document: (doc: string): string => {
    if (!doc) return '-';
    // Format Spanish DNI/NIE
    const cleaned = doc.replace(/\s/g, '').toUpperCase();
    if (cleaned.length === 9) {
      return cleaned.replace(/(\d{8})(\w)/, '$1-$2');
    }
    return doc;
  },

  // Format contract type labels
  contractType: (type: string): string => {
    return CONTRACT_TYPE_LABELS[type as keyof typeof CONTRACT_TYPE_LABELS] || type;
  },

  // Format status with icons
  status: (status: string): string => {
    const icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || '';
    const label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    return `${icon} ${label}`;
  },

  // Format installment count
  installments: (count: string | number): string => {
    if (!count) return '-';
    const num = typeof count === 'string' ? parseInt(count) : count;
    return `${num} meses`;
  },

  // Format postal code
  postalCode: (code: string): string => {
    if (!code) return '-';
    const cleaned = code.replace(/\D/g, '');
    if (cleaned.length === 5) {
      return cleaned;
    }
    return code;
  },

  // Format address for display
  fullAddress: (address: string, postalCode: string, city: string, province: string): string => {
    const parts = [address, postalCode, city, province].filter(Boolean);
    return parts.join(', ') || '-';
  },

  // Format email for display
  email: (email: string): string => {
    if (!email) return '-';
    return email.toLowerCase();
  },

  // Format boolean values
  boolean: (value: boolean | undefined | null, trueLabel: string = 'Sí', falseLabel: string = 'No'): string => {
    if (value === null || value === undefined) return '-';
    return value ? trueLabel : falseLabel;
  },

  // Format file size
  fileSize: (bytes: number): string => {
    if (!bytes || bytes === 0) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Format percentage
  percentage: (value: number): string => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    return `${Math.round(value * 100)}%`;
  },

  // Capitalize first letter
  capitalize: (text: string): string => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Truncate long text
  truncate: (text: string, maxLength: number = 50): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
};