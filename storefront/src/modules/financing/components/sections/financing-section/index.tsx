import { FormSelect } from "@modules/financing/components/select-input"
import { QuestionHeader } from "@modules/financing/components/form/question-header"
import { FINANCING_INSTALLMENT_OPTIONS } from "../../../utils/constants"
import type { FormSectionProps } from "../../../types"

export const FinancingSection = ({
  formData,
  onInputChange
}: FormSectionProps) => {
  return (
    <div className="space-y-6 border-t border-gray-100 pt-10">
      <QuestionHeader 
        number={12} 
        title="Plazos de Financiación"
        bgColor="bg-pink-100"
        textColor="text-pink-600"
      />

      <div className="max-w-md">
        <FormSelect
          label="Plazos de financiación"
          name="financing_installment_count"
          required
          value={formData.financing_installment_count}
          onChange={onInputChange}
        >
          {FINANCING_INSTALLMENT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormSelect>
      </div>
    </div>
  )
}