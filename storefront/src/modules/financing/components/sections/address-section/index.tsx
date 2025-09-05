import { FormInput } from "@modules/financing/components/form-input"
import { FormSelect } from "@modules/financing/components/select-input"
import { QuestionHeader } from "@modules/financing/components/form/question-header"
import { ValidationMessage } from "@modules/financing/components/ui/validation-message"
import { HOUSING_TYPE_OPTIONS } from "../../../utils/constants"
import type { FormSectionProps } from "../../../types"

export const AddressSection = ({
  formData,
  onInputChange,
  onFieldBlur,
  getFieldError
}: FormSectionProps) => {
  return (
    <div className="space-y-6 border-t border-gray-100 pt-10">
      <QuestionHeader number={2} title="Domicilio Actual" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <FormInput
            label="Dirección"
            name="address"
            required
            value={formData.address}
            onChange={onInputChange}
            onBlur={onFieldBlur}
            placeholder="Calle, número, piso, puerta..."
          />
          <ValidationMessage message={getFieldError('address')} />
        </div>

        <div>
          <FormInput
            label="Código Postal"
            name="postal_code"
            required
            value={formData.postal_code}
            onChange={onInputChange}
            onBlur={onFieldBlur}
            placeholder="28001"
          />
          <ValidationMessage message={getFieldError('postal_code')} />
        </div>

        <div>
          <FormInput
            label="Ciudad"
            name="city"
            required
            value={formData.city}
            onChange={onInputChange}
            onBlur={onFieldBlur}
            placeholder="Madrid"
          />
          <ValidationMessage message={getFieldError('city')} />
        </div>

        <div>
          <FormInput
            label="Provincia"
            name="province"
            required
            value={formData.province}
            onChange={onInputChange}
            onBlur={onFieldBlur}
            placeholder="Madrid"
          />
          <ValidationMessage message={getFieldError('province')} />
        </div>

        <FormSelect
          label="Tipo de Vivienda"
          name="housing_type"
          required
          value={formData.housing_type}
          onChange={onInputChange}
        >
          {HOUSING_TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormSelect>

        {formData.housing_type === "other" && (
          <FormInput
            label="Especifique el tipo de vivienda"
            name="housing_type_details"
            value={formData.housing_type_details}
            onChange={onInputChange}
            placeholder="Describe tu situación de vivienda"
          />
        )}
      </div>
    </div>
  )
}