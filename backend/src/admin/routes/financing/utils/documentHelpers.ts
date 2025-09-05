import { FinancingData, DocumentInfo } from '../types';
import { DOCUMENT_TYPES } from '../constants';

export const documentHelpers = {
  // Get list of documents for a financing request
  getDocumentsList: (request: FinancingData): DocumentInfo[] => {
    return DOCUMENT_TYPES.map(docType => ({
      url: request[docType.key as keyof FinancingData] as string | null,
      label: docType.label,
      hasDocument: Boolean(request[docType.key as keyof FinancingData])
    }));
  },

  // Count available documents
  hasDocuments: (request: FinancingData): number => {
    return DOCUMENT_TYPES.filter(docType => 
      Boolean(request[docType.key as keyof FinancingData])
    ).length;
  },

  // Download all documents
  downloadAll: async (request: FinancingData): Promise<void> => {
    console.log("🍎 Iniciando descarga en:", navigator.platform || "Plataforma desconocida");
    
    const documents = [
      { url: request.identity_front_file_id, name: "DNI_anverso" },
      { url: request.identity_back_file_id, name: "DNI_reverso" },
      { url: request.freelance_rental_file_id, name: "declaracion_renta" },
      { url: request.freelance_quote_file_id, name: "cuota_autonomos" },
      { url: request.pensioner_proof_file_id, name: "justificante_pension" },
      { url: request.bank_account_proof_file_id, name: "justificante_bancario" },
    ].filter((doc) => doc.url); // Solo documentos que existen

    // Manejar nóminas múltiples (URLs separadas por |)
    if (request.paysheet_file_id) {
      const payrollUrls = request.paysheet_file_id.split("|");
      payrollUrls.forEach((url, index) => {
        if (url.trim()) {
          documents.push({
            url: url.trim(),
            name: payrollUrls.length > 1 ? `nomina_${index + 1}` : "nomina",
          });
        }
      });
    }

    if (documents.length === 0) {
      alert("No hay documentos disponibles para descargar");
      return;
    }

    // Crear un prefijo con email y fecha para identificar los archivos
    const emailPrefix = request.email.split("@")[0];
    const datePrefix = new Date(request.requested_at)
      .toISOString()
      .split("T")[0];
    const prefix = `${emailPrefix}_${datePrefix}`;

    // Descargar cada documento
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      try {
        const response = await fetch(doc.url);
        const blob = await response.blob();

        // Obtener la extensión del archivo de la URL o usar un default
        const urlParts = doc.url.split(".");
        const extension = urlParts[urlParts.length - 1].split("?")[0] || "jpg";

        // Crear el enlace de descarga
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${prefix}_${doc.name}.${extension}`;
        
        // Asegurar compatibilidad cross-browser
        link.style.display = "none";
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        // Hacer clic automáticamente para descargar
        document.body.appendChild(link);
        
        // Timeout para Safari/Mac
        setTimeout(() => {
          link.click();
          
          // Limpiar después del clic
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
          }, 100);
        }, 50);

        // Pequeña pausa entre descargas para no saturar el navegador
        if (i < documents.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        
        console.log(`✅ Descargado: ${doc.name}`);
      } catch (error) {
        console.error(`❌ Error descargando ${doc.name}:`, error);
        
        // En Mac, mostrar mensaje específico si hay problemas
        if (navigator.platform.includes('Mac')) {
          console.warn("💡 Mac: Verifica que las descargas automáticas estén habilitadas en Safari");
        }
      }
    }
  },

  // Download single document
  downloadSingle: (url: string, filename: string): void => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'documento';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      // Fallback: open in new window
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },

  // Generate file URL from file ID
  getFileUrl: (fileId: string | null): string | null => {
    if (!fileId) return null;
    // Assuming the backend provides file URLs in this format
    return `/admin/uploads/${fileId}`;
  },

  // Check if document exists and is accessible
  isDocumentAccessible: async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  },

  // Get document type from file extension
  getDocumentType: (filename: string): string => {
    if (!filename) return 'unknown';
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const typeMap: { [key: string]: string } = {
      pdf: 'PDF',
      jpg: 'Imagen',
      jpeg: 'Imagen',
      png: 'Imagen',
      doc: 'Documento Word',
      docx: 'Documento Word',
      xls: 'Excel',
      xlsx: 'Excel'
    };

    return typeMap[extension || ''] || 'Documento';
  },

  // Generate document preview URL if supported
  getPreviewUrl: (fileId: string | null): string | null => {
    if (!fileId) return null;
    // Return preview URL if backend supports it
    return `/admin/uploads/${fileId}/preview`;
  },

  // Validate document file type
  isValidDocumentType: (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    return allowedTypes.includes(file.type);
  },

  // Get document upload constraints
  getUploadConstraints: () => ({
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    maxFiles: 1
  }),

  // Format document name for display
  formatDocumentName: (originalName: string, docType: string): string => {
    if (!originalName) return docType;
    
    // Remove file extension for display
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    
    // Truncate if too long
    const maxLength = 30;
    if (nameWithoutExt.length > maxLength) {
      return `${nameWithoutExt.substring(0, maxLength)}...`;
    }
    
    return nameWithoutExt;
  },

  // Get document status (uploaded, missing, processing)
  getDocumentStatus: (fileId: string | null, verification?: any): 'uploaded' | 'missing' | 'processing' | 'error' => {
    if (!fileId) return 'missing';
    if (verification?.status === 'processing') return 'processing';
    if (verification?.status === 'error') return 'error';
    return 'uploaded';
  },

  // Check if all required documents are present
  hasAllRequiredDocuments: (request: FinancingData): boolean => {
    const requiredDocs = ['identity_front_file_id', 'identity_back_file_id'];
    
    // Add required docs based on contract type
    switch (request.contract_type) {
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

    return requiredDocs.every(docKey => 
      Boolean(request[docKey as keyof FinancingData])
    );
  }
};