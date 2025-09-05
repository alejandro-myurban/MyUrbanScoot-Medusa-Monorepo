import { FormInput } from "@modules/financing/components/form-input"
import { FormSelect } from "@modules/financing/components/select-input"
import { QuestionHeader } from "@modules/financing/components/form/question-header"
import { ValidationMessage } from "@modules/financing/components/ui/validation-message"
import { UnemployedBlocker } from "@modules/financing/components/ui/unemployed-blocker"
import { CONTRACT_TYPE_OPTIONS } from "../../../utils/constants"
import type { FormSectionProps } from "../../../types"

interface IncomeSectionProps extends FormSectionProps {
  isUnemployed: boolean
}

export const IncomeSection = ({
  formData,
  onInputChange,
  onFieldBlur,
  getFieldError,
  isUnemployed
}: IncomeSectionProps) => {
  return (
    <>
      <div className="space-y-6 border-t border-gray-100 pt-10">
        <QuestionHeader number={3} title="Tipo de Ingresos" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormInput
              label="Ingresos Mensuales (€)"
              name="income"
              type="number"
              required
              value={formData.income}
              onChange={onInputChange}
              onBlur={onFieldBlur}
              placeholder="1800"
            />
            <ValidationMessage message={getFieldError('income')} />
          </div>

          <FormSelect
            label="Tipo de Contrato"
            name="contract_type"
            required
            value={formData.contract_type}
            onChange={onInputChange}
          >
            {CONTRACT_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
        </div>
      </div>

      {/* Mensaje de bloqueo para desempleados - ESTILOS EXACTOS DEL ORIGINAL */}
      <UnemployedBlocker isVisible={isUnemployed} />
    </>
  )
}