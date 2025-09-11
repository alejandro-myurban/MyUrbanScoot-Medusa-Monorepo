import { useState } from "react";
import { Button, Text } from "@medusajs/ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ExtractedDniInfo } from "../../types";
import { formatters } from "../../utils/formatters";

interface ExtractedDataAccordionProps {
  dniInfo: ExtractedDniInfo;
  showExtractedData: boolean;
  onToggleExtractedData: () => void;
}

const ExtractedDataAccordion = ({
  dniInfo,
  showExtractedData,
  onToggleExtractedData
}: ExtractedDataAccordionProps) => {
  const hasExtractionData = dniInfo && Object.keys(dniInfo).length > 0;
  const confidence = dniInfo?.confidence || 0;
  const isHighConfidence = confidence > 0.8;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <Button
        variant="transparent"
        className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
        onClick={onToggleExtractedData}
      >
        <div className="flex items-center gap-3">
          <Text className="font-medium">
            Datos extraídos automáticamente
          </Text>
          {hasExtractionData && (
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded text-xs ${
                isHighConfidence 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                Confianza: {formatters.percentage(confidence)}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showExtractedData ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </Button>

      {/* Content */}
      {showExtractedData && (
        <div className="p-4 border-t border-gray-200 bg-white">
          {!hasExtractionData ? (
            <Text className="text-gray-500 italic">
              No hay datos extraídos disponibles
            </Text>
          ) : (
            <div className="space-y-4">
              {/* DNI Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </Text>
                  <Text className="text-sm">
                    {dniInfo.name || 'No extraído'}
                  </Text>
                </div>
                
                <div>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Apellidos
                  </Text>
                  <Text className="text-sm">
                    {dniInfo.surname || 'No extraído'}
                  </Text>
                </div>
                
                <div>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    DNI
                  </Text>
                  <Text className="text-sm">
                    {formatters.document(dniInfo.dni || '')}
                  </Text>
                </div>
                
                <div>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Fecha de nacimiento
                  </Text>
                  <Text className="text-sm">
                    {dniInfo.birthDate ? formatters.date(dniInfo.birthDate) : 'No extraído'}
                  </Text>
                </div>
              </div>

              {dniInfo.address && (
                <div>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Dirección (DNI)
                  </Text>
                  <Text className="text-sm">
                    {dniInfo.address}
                  </Text>
                </div>
              )}

              {dniInfo.nationality && (
                <div>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Nacionalidad
                  </Text>
                  <Text className="text-sm">
                    {dniInfo.nationality}
                  </Text>
                </div>
              )}

              {/* Confidence Warning */}
              {!isHighConfidence && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <Text className="text-sm text-yellow-800">
                    ⚠️ La confianza en los datos extraídos es baja ({formatters.percentage(confidence)}). 
                    Se recomienda verificar manualmente la información.
                  </Text>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExtractedDataAccordion;