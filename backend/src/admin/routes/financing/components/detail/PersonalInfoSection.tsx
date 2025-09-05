import { Text } from "@medusajs/ui";
import { PersonalInfoSectionProps } from "../../types";
import { formatters } from "../../utils/formatters";
import ExtractedDataAccordion from "../shared/ExtractedDataAccordion";
import EditableField from "../../../../components/editable-field";

const PersonalInfoSection = ({
  request,
  dniInfo,
  onFieldUpdate,
  showExtractedData,
  onToggleExtractedData,
  manualMode,
  onToggleManualMode
}: PersonalInfoSectionProps & { manualMode: boolean; onToggleManualMode: () => void }) => {
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
              { value: 'single', label: 'Soltero/a' },
              { value: 'married', label: 'Casado/a' },
              { value: 'divorced', label: 'Divorciado/a' },
              { value: 'widowed', label: 'Viudo/a' },
              { value: 'separated', label: 'Separado/a' }
            ]}
            required={true}
            onSave={async (value) => onFieldUpdate("civil_status", value)}
          />

          {request.civil_status === 'married' && (
            <EditableField
              label="Detalles Estado Civil"
              value={request.marital_status_details || ''}
              type="text"
              onSave={async (value) => onFieldUpdate("marital_status_details", value)}
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
              { value: 'own', label: 'Vivienda propia' },
              { value: 'rent', label: 'Alquiler' },
              { value: 'family', label: 'Familiar' },
              { value: 'other', label: 'Otro' }
            ]}
            required={true}
            onSave={async (value) => onFieldUpdate("housing_type", value)}
          />

          {request.housing_type === 'other' && (
            <EditableField
              label="Detalles de Vivienda"
              value={request.housing_type_details || ''}
              type="text"
              onSave={async (value) => onFieldUpdate("housing_type_details", value)}
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
          <Text className="text-lg font-semibold mb-3">Dudas/Comentarios del Cliente</Text>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Text className="whitespace-pre-wrap">{request.doubts}</Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoSection;