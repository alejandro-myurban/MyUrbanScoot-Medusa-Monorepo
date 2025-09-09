import { Text } from "@medusajs/ui";
import { FinancingData } from "../../types";
import { formatters } from "../../utils/formatters";
import { extractionHelpers } from "../../utils/extractionHelpers";
import EditableField from "../../../../components/editable-field";
import { CONTRACT_TYPE_OPTIONS, INSTALLMENT_COUNT_OPTIONS } from "../../constants";

interface WorkInfoSectionProps {
  request: FinancingData;
  onFieldUpdate: (field: string, value: any) => void;
}

const WorkInfoSection = ({ request, onFieldUpdate }: WorkInfoSectionProps) => {
  const payrollInfo = extractionHelpers.extractPayrollInfo(request);

  return (
    <div className="space-y-6">
      <Text className="text-lg font-semibold">Información Laboral y Financiera</Text>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Work Information */}
        <div className="space-y-4">
          <Text className="text-base font-medium text-gray-700">Información Laboral</Text>
          
          <EditableField
            label="Tipo de Contrato"
            value={request.contract_type}
            type="select"
            options={CONTRACT_TYPE_OPTIONS}
            required={true}
            onSave={(value) => onFieldUpdate("contract_type", value)}
          />

          {/* Employee specific fields */}
          {(request.contract_type === 'employee_permanent' || request.contract_type === 'employee_temporary') && (
            <>
              <EditableField
                label="Puesto de Trabajo"
                value={request.company_position || ''}
                type="text"
                onSave={(value) => onFieldUpdate("company_position", value)}
              />

              <EditableField
                label="Fecha de Inicio en la Empresa"
                value={request.company_start_date || ''}
                type="date"
                onSave={(value) => onFieldUpdate("company_start_date", value)}
              />

              {/* Extracted payroll info */}
              {payrollInfo.employerName && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <Text className="text-sm font-medium text-green-800 mb-2">
                    Datos extraídos de la nómina:
                  </Text>
                  <div className="space-y-1 text-sm text-green-700">
                    <div>Empresa: {payrollInfo.employerName}</div>
                    {payrollInfo.grossSalary && <div>Salario bruto: {formatters.currency(payrollInfo.grossSalary)}</div>}
                    {payrollInfo.netSalary && <div>Salario neto: {formatters.currency(payrollInfo.netSalary)}</div>}
                    {payrollInfo.position && <div>Puesto: {payrollInfo.position}</div>}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Freelancer specific fields */}
          {request.contract_type === 'freelancer' && (
            <EditableField
              label="Fecha de Alta como Autónomo"
              value={request.freelance_start_date || ''}
              type="date"
              onSave={(value) => onFieldUpdate("freelance_start_date", value)}
            />
          )}
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <Text className="text-base font-medium text-gray-700">Información Financiera</Text>
          
          <EditableField
            label="Ingresos Mensuales"
            value={request.income}
            type="number"
            required={true}
            step="0.01"
            min="0"
            suffix="€"
            onSave={(value) => onFieldUpdate("income", value)}
          />

          <EditableField
            label="Número de Cuotas"
            value={request.financing_installment_count}
            type="select-input"
            options={INSTALLMENT_COUNT_OPTIONS}
            required={true}
            minValue={12}
            maxValue={60}
            onSave={(value) => onFieldUpdate("financing_installment_count", value)}
          />

          {/* Financial Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Resumen Financiero
            </Text>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Ingresos mensuales:</span>
                <span className="font-medium">{formatters.currency(parseFloat(request.income))}</span>
              </div>
              <div className="flex justify-between">
                <span>Periodo financiación:</span>
                <span>{formatters.installments(request.financing_installment_count)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipo de contrato:</span>
                <span>{formatters.contractType(request.contract_type)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <Text className="text-sm font-medium text-blue-800 mb-2">
          Información de Fechas
        </Text>
        <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <span className="font-medium">Solicitud enviada:</span><br />
            {formatters.date(request.requested_at)}
          </div>
          <div>
            <span className="font-medium">Creada en sistema:</span><br />
            {formatters.date(request.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkInfoSection;