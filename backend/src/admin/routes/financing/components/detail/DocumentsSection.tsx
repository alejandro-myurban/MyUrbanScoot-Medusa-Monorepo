import { Button, Text } from "@medusajs/ui";
import { Download, FileText } from "lucide-react";
import { DocumentsSectionProps } from "../../types";
import EditableDocumentUpload from "../shared/EditableDocumentUpload";

const DocumentsSection = ({
  request,
  onDownloadAll,
  onDownloadSingle
}: DocumentsSectionProps) => {
  // Mapear documentos a tipos editables - solo los que están disponibles o son requeridos
  const allDocuments = [
    { type: 'identity_front', label: 'DNI Frontal', url: request.identity_front_file_id, required: true },
    { type: 'identity_back', label: 'DNI Trasero', url: request.identity_back_file_id, required: true },
    { type: 'paysheet', label: 'Nómina', url: request.paysheet_file_id, contractTypes: ['employee_permanent', 'employee_temporary'] },
    { type: 'bank_account_proof', label: 'Justificante Bancario', url: request.bank_account_proof_file_id, required: true },
    { type: 'freelance_rental', label: 'Modelo 036/037', url: request.freelance_rental_file_id, contractTypes: ['freelancer'] },
    { type: 'freelance_quote', label: 'Factura ejemplo', url: request.freelance_quote_file_id, contractTypes: ['freelancer'] },
    { type: 'pensioner_proof', label: 'Justificante pensión', url: request.pensioner_proof_file_id, contractTypes: ['pensioner'] },
  ];

  // Filtrar solo documentos relevantes para este tipo de contrato o que ya existen
  const editableDocuments = allDocuments.filter(doc => {
    // Siempre mostrar documentos requeridos (DNI, justificante bancario)
    if (doc.required) return true;
    
    // Mostrar si ya existe el documento
    if (doc.url) return true;
    
    // Mostrar si es relevante para el tipo de contrato
    if (doc.contractTypes && doc.contractTypes.includes(request.contract_type)) return true;
    
    return false;
  });

  // Contar documentos disponibles
  const totalDocuments = editableDocuments.filter(doc => doc.url).length;
  const totalPossibleDocuments = editableDocuments.length;

  const handleDocumentReplace = async (file: File, documentType: string) => {
    try {
      console.log(`🔄 Reemplazando documento: ${documentType} para solicitud: ${request.id}`);
      console.log(`📁 Archivo: ${file.name}, tamaño: ${file.size}, tipo: ${file.type}`);
      
      const formData = new FormData();
      formData.append('files', file);
      formData.append('document_type', documentType);

      const response = await fetch(`/admin/financing/${request.id}/replace-document?document_type=${encodeURIComponent(documentType)}`, {
        method: 'POST',
        body: formData
      });

      console.log(`📡 Response status: ${response.status}`);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Documento reemplazado exitosamente:', result);

      // Recargar la página para mostrar los cambios
      window.location.reload();
      
    } catch (error: any) {
      console.error('❌ Error reemplazando documento:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Text className="text-lg font-semibold">
          Documentos ({totalDocuments} de {totalPossibleDocuments})
        </Text>
        
        {totalDocuments > 0 && (
          <Button
            variant="secondary"
            size="small"
            onClick={onDownloadAll}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar todos
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {editableDocuments.map((doc) => (
          <EditableDocumentUpload
            key={doc.type}
            label={doc.label}
            currentDocumentUrl={doc.url}
            documentType={doc.type as any}
            onReplace={handleDocumentReplace}
            acceptedTypes="image/*,application/pdf"
            maxSizeMB={5}
          />
        ))}
      </div>

      {/* Document Requirements by Contract Type */}
      {/* <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <Text className="font-medium text-blue-800 mb-2">
          Documentos requeridos para "{request.contract_type}":
        </Text>
        <div className="text-sm text-blue-700 space-y-1">
          {getRequiredDocuments(request.contract_type).map((docType, index) => {
            const hasDoc = editableDocuments.find(d => d.label === docType)?.url;
            return (
              <div key={index} className="flex items-center gap-2">
                <span className={hasDoc ? "text-green-600" : "text-orange-600"}>
                  {hasDoc ? "✅" : "⚠️"}
                </span>
                <Text size="small">{docType}</Text>
              </div>
            );
          })}
        </div>
      </div> */}
    </div>
  );
};

const getRequiredDocuments = (contractType: string): string[] => {
  const baseRequirements = ['DNI Frontal', 'DNI Trasero'];
  
  switch (contractType) {
    case 'employee_permanent':
    case 'employee_temporary':
      return [...baseRequirements, 'Nómina'];
    case 'freelancer':
      return [...baseRequirements, 'Modelo 036/037', 'Factura ejemplo'];
    case 'pensioner':
      return [...baseRequirements, 'Justificante pensión'];
    default:
      return baseRequirements;
  }
};

export default DocumentsSection;