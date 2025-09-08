import { FileInputEnhanced } from "@modules/financing/components/file-input"
import { QuestionHeader } from "@modules/financing/components/form/question-header"
import type { FormSectionProps } from "../../../types"

export const BankSection = ({
  files,
  submitting,
  onFileChange,
  onRemoveFile,
  onVerificationComplete,
}: FormSectionProps) => {
  return (
    <div className="space-y-6 border-t border-gray-100 pt-10">
      <QuestionHeader
        number={11}
        title="Justificante Bancario"
        bgColor="bg-emerald-100"
        textColor="text-emerald-600"
      />
      <p className="text-gray-400">
        ⚠️ <span className="font-bold text-black/90 underline">Importante:</span> La
        documentación solicitada debe ser proporcionada únicamente por el
        titular de la cuenta bancaria. Realizar una financiación en nombre de
        otra persona constituye fraude y es ilegal. Asimismo, es obligatorio
        utilizar el número de teléfono vinculado a la cuenta bancaria registrada
        en la entidad financiera correspondiente.
      </p>
      <FileInputEnhanced
        id="bank_account_proof_file"
        label="Justificante de titularidad bancaria"
        file={files.bank_account_proof_file}
        onRemove={onRemoveFile}
        required={true}
        onChange={onFileChange}
        disabled={submitting}
        documentType="bank_certificate"
        onVerificationComplete={(result: any) =>
          onVerificationComplete("bank", result)
        }
      />
    </div>
  )
}
