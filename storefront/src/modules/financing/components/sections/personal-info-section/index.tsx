import { LoaderCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { FormInput } from "@modules/financing/components/form-input"
import { FormSelect } from "@modules/financing/components/select-input"
import { FileInputEnhanced } from "@modules/financing/components/file-input"
import { QuestionHeader } from "@modules/financing/components/form/question-header"
import { ValidationMessage } from "@modules/financing/components/ui/validation-message"
import { CIVIL_STATUS_OPTIONS } from "../../../utils/constants"
import type { FormSectionProps } from "../../../types"

export const PersonalInfoSection = ({
  formData,
  files,
  fieldErrors,
  documentVerifications,
  phoneValidation,
  phoneValidationError,
  submitting,
  onInputChange,
  onFieldBlur,
  onPhoneBlur,
  onFileChange,
  onRemoveFile,
  onVerificationComplete,
  getFieldError
}: FormSectionProps) => {
  return (
    <div className="space-y-6">
      <QuestionHeader number={1} title="Datos Personales" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FormInput
            label="Correo Electrónico"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={onInputChange}
            onBlur={onFieldBlur}
            placeholder="tu@email.com"
          />
          <ValidationMessage message={getFieldError('email')} />
        </div>

        <div>
          <FormInput
            label="Teléfono"
            name="phone_mumber"
            type="tel"
            required
            value={formData.phone_mumber}
            onChange={onInputChange}
            onBlur={onPhoneBlur}
            placeholder="+34 600 000 000"
          />
          <p className="pt-2 text-gray-400">
            Por favor, comprueba que <span className="underline font-bold text-black/90">tu número de teléfono sea correcto</span> para que podamos comunicarnos contigo.
          </p>
          
          {/* Estado de validación del teléfono - EXACTO DEL ORIGINAL */}
          {formData.phone_mumber && formData.phone_mumber.trim().length >= 1 && (
            <div className="mt-2">
              {phoneValidationError ? (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {phoneValidationError}
                </div>
              ) : phoneValidation.isChecking ? (
                <div className="flex items-center text-blue-600 text-sm">
                  <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                  Verificando número de teléfono...
                </div>
              ) : phoneValidation.exists === true ? (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Ya existe una solicitud con este número
                </div>
              ) : phoneValidation.exists === false ? (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Número de teléfono disponible
                </div>
              ) : formData.phone_mumber.trim().length >= 9 ? (
                <div className="text-gray-400 text-sm">
                  Validando formato...
                </div>
              ) : null}
            </div>
          )}
        </div>

        <FileInputEnhanced
          id="identity_front_file_id"
          label="Imagen del anverso del DNI"
          file={files.identity_front_file_id}
          onRemove={onRemoveFile}
          required={true}
          onChange={onFileChange}
          disabled={submitting}
          multiple={true}
          documentType="dni_front"
          onVerificationComplete={(result: any) =>
            onVerificationComplete("front", result)
          }
        />

        <FileInputEnhanced
          id="identity_back_file_id"
          label="Imagen del reverso del DNI"
          file={files.identity_back_file_id}
          onRemove={onRemoveFile}
          required={true}
          onChange={onFileChange}
          disabled={submitting}
          multiple={true}
          documentType="dni_back"
          onVerificationComplete={(result: any) =>
            onVerificationComplete("back", result)
          }
        />

        <FormSelect
          label="Estado Civil"
          name="civil_status"
          required
          value={formData.civil_status}
          onChange={onInputChange}
        >
          {CIVIL_STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormSelect>

        <p className="text-gray-400">
          Es importante que las imágenes del DNI sean perfectamente
          visibles, sin reflejos y con buena luz, de lo contrario
          podrían ser rechazadas.
        </p>

        {formData.civil_status === "married" && (
          <div className="md:col-span-2">
            <FormInput
              label="Régimen matrimonial"
              name="marital_status_details"
              value={formData.marital_status_details}
              onChange={onInputChange}
              placeholder="Ej: Gananciales, Separación de bienes..."
            />
          </div>
        )}
      </div>
    </div>
  )
}