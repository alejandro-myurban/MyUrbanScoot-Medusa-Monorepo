import { Text } from "@medusajs/ui";
import { PersonalInfoSectionProps } from "../../types";
import { formatters } from "../../utils/formatters";
import { validationHelpers } from "../../utils/validationHelpers";
import ExtractedDataAccordion from "../shared/ExtractedDataAccordion";
import EditableField from "../../../../components/editable-field";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const PersonalInfoSection = ({
  request,
  dniInfo,
  onFieldUpdate,
  showExtractedData,
  onToggleExtractedData,
  manualMode,
  onToggleManualMode,
}: PersonalInfoSectionProps & {
  manualMode: boolean;
  onToggleManualMode: () => void;
}) => {
  // Validar edad si hay datos extraídos del DNI
  const ageValidation = dniInfo ? validationHelpers.validateAgeFromDNI(dniInfo) : null;

  return (
    <div className="space-y-6">
      {/* Extracted Data Accordion */}
      <ExtractedDataAccordion
        dniInfo={dniInfo}
        showExtractedData={showExtractedData}
        onToggleExtractedData={onToggleExtractedData}
        manualMode={manualMode}
        onToggleManualMode={onToggleManualMode}
      />

      {/* Age Validation Section */}
      {ageValidation && (
        <div className={`p-4 rounded-lg border ${
          ageValidation.isValid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {ageValidation.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <Text className={`font-semibold ${
                ageValidation.isValid ? 'text-green-800' : 'text-red-800'
              }`}>
                Validación de Edad
              </Text>
              <Text className={`text-sm ${
                ageValidation.isValid ? 'text-green-700' : 'text-red-700'
              }`}>
                {ageValidation.message}
              </Text>
              {dniInfo?.birthDate && (
                <Text className="text-xs text-gray-600 mt-1">
                  Fecha de nacimiento: {formatters.formatDate(dniInfo.birthDate)}
                </Text>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Personal Information Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Text className="text-lg font-semibold">Información Personal</Text>

          <EditableField
            label="Email"
            value={request.email}
            type="email"
            required={true}
            onSave={async (value) => onFieldUpdate("email", value)}
          />

          <EditableField
            label="Teléfono"
            value={request.phone_mumber}
            type="tel"
            required={true}
            onSave={async (value) => onFieldUpdate("phone_mumber", value)}
          />

          <EditableField
            label="Estado Civil"
            value={request.civil_status}
            type="select"
            options={[
              { value: "single", label: "Soltero/a" },
              { value: "married", label: "Casado/a" },
              { value: "divorced", label: "Divorciado/a" },
              { value: "widowed", label: "Viudo/a" },
              { value: "separated", label: "Separado/a" },
            ]}
            required={true}
            onSave={async (value) => onFieldUpdate("civil_status", value)}
          />

          {request.civil_status === "married" && (
            <EditableField
              label="Detalles Estado Civil"
              value={request.marital_status_details || ""}
              type="text"
              onSave={async (value) =>
                onFieldUpdate("marital_status_details", value)
              }
            />
          )}
        </div>

        <div className="space-y-4">
          <Text className="text-lg font-semibold">Información de Vivienda</Text>

          <EditableField
            label="Tipo de Vivienda"
            value={request.housing_type}
            type="select"
            options={[
              { value: "rent", label: "Alquiler" },
              { value: "owned", label: "Propiedad" },
              { value: "partner", label: "Cónyuge" },
              { value: "family", label: "Padres" },
              { value: "leasing", label: "Leasing" },
              { value: "usufruct", label: "Usufructo" },
              { value: "other", label: "Otra" },
            ]}
            required={true}
            onSave={async (value) => onFieldUpdate("housing_type", value)}
          />

          {request.housing_type === "other" && (
            <EditableField
              label="Detalles de Vivienda"
              value={request.housing_type_details || ""}
              type="text"
              onSave={async (value) =>
                onFieldUpdate("housing_type_details", value)
              }
            />
          )}

          <EditableField
            label="Dirección"
            value={request.address}
            type="text"
            required={true}
            onSave={async (value) => onFieldUpdate("address", value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <EditableField
              label="Código Postal"
              value={request.postal_code}
              type="text"
              required={true}
              onSave={async (value) => onFieldUpdate("postal_code", value)}
            />

            <EditableField
              label="Ciudad"
              value={request.city}
              type="text"
              required={true}
              onSave={async (value) => onFieldUpdate("city", value)}
            />
          </div>

          <EditableField
            label="Provincia"
            value={request.province}
            type="text"
            required={true}
            onSave={async (value) => onFieldUpdate("province", value)}
          />
        </div>
      </div>

      {/* Additional Information */}
      {request.doubts && (
        <div className="mt-6">
          <Text className="text-lg font-semibold mb-3">
            Dudas/Comentarios del Cliente
          </Text>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Text className="whitespace-pre-wrap">{request.doubts}</Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoSection;
