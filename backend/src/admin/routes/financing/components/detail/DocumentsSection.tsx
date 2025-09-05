import { Button, Text } from "@medusajs/ui";
import { Download, FileText } from "lucide-react";
import { DocumentsSectionProps } from "../../types";
import { documentHelpers } from "../../utils/documentHelpers";
import DocumentLink from "../shared/DocumentLink";
import { DOCUMENT_TYPES } from "../../constants";

const DocumentsSection = ({
  request,
  onDownloadAll,
  onDownloadSingle
}: DocumentsSectionProps) => {
  const documents = documentHelpers.getDocumentsList(request);
  const totalDocuments = documentHelpers.hasDocuments(request);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Text className="text-lg font-semibold">
          Documentos ({totalDocuments} de {DOCUMENT_TYPES.length})
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <DocumentLink
              url={doc.url}
              label={doc.label}
              icon={FileText}
              onDownload={doc.url ? () => onDownloadSingle(doc.url!, doc.label) : undefined}
            />
          </div>
        ))}
      </div>

      {/* Document Requirements by Contract Type */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <Text className="font-medium text-blue-800 mb-2">
          Documentos requeridos para "{request.contract_type}":
        </Text>
        <div className="text-sm text-blue-700 space-y-1">
          {getRequiredDocuments(request.contract_type).map((docType, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className={documents.find(d => d.label === docType)?.hasDocument ? "text-green-600" : "text-orange-600"}>
                {documents.find(d => d.label === docType)?.hasDocument ? "✅" : "⚠️"}
              </span>
              <Text size="small">{docType}</Text>
            </div>
          ))}
        </div>
      </div>
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