import { FileInputEnhanced } from "@modules/financing/components/file-input"
import { QuestionHeader } from "@modules/financing/components/form/question-header"
import type { FormSectionProps } from "../../../types"

export const BankSection = ({
  files,
  submitting,
  onFileChange,
  onRemoveFile,
  onVerificationComplete
}: FormSectionProps) => {
  return (
    <div className="space-y-6 border-t border-gray-100 pt-10">
      <QuestionHeader 
        number={11} 
        title="Justificante Bancario"
        bgColor="bg-emerald-100"
        textColor="text-emerald-600"
      />

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