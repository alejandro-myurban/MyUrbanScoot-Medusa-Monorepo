import { FormInput } from "@modules/financing/components/form-input"
import { FileInputEnhanced } from "@modules/financing/components/file-input"
import { QuestionHeader } from "@modules/financing/components/form/question-header"
import { ValidationMessage } from "@modules/financing/components/ui/validation-message"
import type { FormSectionProps } from "../../../types"

export const EmployeeSection = ({
  formData,
  files,
  submitting,
  onInputChange,
  onFieldBlur,
  onFileChange,
  onRemoveFile,
  onVerificationComplete,
  getFieldError
}: FormSectionProps) => {
  return (
    <>
      {/* Pregunta 4: Información Laboral */}
      <div className="space-y-6 border-t border-gray-100 pt-10">
        <QuestionHeader number={4} title="Información Laboral" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormInput
              label="Cargo en la empresa"
              name="company_position"
              required
              value={formData.company_position}
              onChange={onInputChange}
              onBlur={onFieldBlur}
              placeholder="Desarrollador, Administrativo, etc."
            />
            <ValidationMessage message={getFieldError('company_position')} />
          </div>

          <div>
            <FormInput
              label="Fecha de inicio en la empresa"
              name="company_start_date"
              type="date"
              required
              value={formData.company_start_date}
              onChange={onInputChange}
              onBlur={onFieldBlur}
            />
            <ValidationMessage message={getFieldError('company_start_date')} />
          </div>
        </div>
      </div>

      {/* Pregunta 5: Documentación Laboral */}
      <div className="space-y-6 border-t border-gray-100 pt-10">
        <QuestionHeader number={5} title="Documentación Laboral" />
        
        <p className="text-gray-500 text-sm">
          Las nóminas deben ser <span className="font-bold text-black underline">las dos más recientes</span>, además en
          formato PDF. No se aceptan imágenes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileInputEnhanced
            id="paysheet_file"
            label="Nómina 1"
            file={files.paysheet_file}
            onRemove={onRemoveFile}
            required={true}
            onChange={onFileChange}
            disabled={submitting}
            documentType="payroll"
            onVerificationComplete={(result: any) =>
              onVerificationComplete("payroll", result)
            }
          />

          <FileInputEnhanced
            id="paysheet_file_2"
            label="Nómina 2"
            file={files.paysheet_file_2}
            onRemove={onRemoveFile}
            required={false}
            onChange={onFileChange}
            disabled={submitting}
            documentType="payroll"
            onVerificationComplete={(result: any) =>
              onVerificationComplete("payroll_2", result)
            }
          />
        </div>
      </div>
    </>
  )
}