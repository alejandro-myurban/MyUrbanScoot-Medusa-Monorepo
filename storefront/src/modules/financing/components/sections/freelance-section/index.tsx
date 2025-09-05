import { FormInput } from "@modules/financing/components/form-input"
import { FileInputEnhanced } from "@modules/financing/components/file-input"
import { QuestionHeader } from "@modules/financing/components/form/question-header"
import { ValidationMessage } from "@modules/financing/components/ui/validation-message"
import type { FormSectionProps } from "../../../types"

export const FreelanceSection = ({
  formData,
  files,
  submitting,
  onInputChange,
  onFieldBlur,
  onFileChange,
  onRemoveFile,
  getFieldError
}: FormSectionProps) => {
  return (
    <>
      {/* Pregunta 7: Fecha de alta de autónomos */}
      <div className="space-y-6 border-t border-gray-100 pt-10">
        <QuestionHeader 
          number={7} 
          title="Información de Alta como Autónomo"
          bgColor="bg-cyan-100"
          textColor="text-cyan-600"
        />

        <div className="max-w-md">
          <FormInput
            label="Fecha de alta como autónomo"
            name="freelance_start_date"
            type="date"
            required
            value={formData.freelance_start_date}
            onChange={onInputChange}
            onBlur={onFieldBlur}
          />
          <ValidationMessage message={getFieldError('freelance_start_date')} />
        </div>
      </div>

      {/* Pregunta 8: Documentación de Autónomo */}
      <div className="space-y-6 border-t border-gray-100 pt-10">
        <QuestionHeader 
          number={8} 
          title="Documentación de Autónomo"
          bgColor="bg-orange-100"
          textColor="text-orange-600"
        />

        <FileInputEnhanced
          id="freelance_rental_file"
          label="Última declaración de la renta"
          file={files.freelance_rental_file}
          onRemove={onRemoveFile}
          required={true}
          onChange={onFileChange}
          disabled={submitting}
        />
      </div>

      {/* Pregunta 9: Cuota de Autónomos */}
      <div className="space-y-6 border-t border-gray-100 pt-10">
        <QuestionHeader 
          number={9} 
          title="Cuota de Autónomos"
          bgColor="bg-teal-100"
          textColor="text-teal-600"
        />

        <FileInputEnhanced
          id="freelance_quote_file"
          label="Última cuota de autónomos"
          file={files.freelance_quote_file}
          onRemove={onRemoveFile}
          required={true}
          onChange={onFileChange}
          disabled={submitting}
        />
      </div>
    </>
  )
}