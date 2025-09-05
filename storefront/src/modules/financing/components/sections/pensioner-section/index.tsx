import { FileInputEnhanced } from "@modules/financing/components/file-input"
import { QuestionHeader } from "@modules/financing/components/form/question-header"
import type { FormSectionProps } from "../../../types"

export const PensionerSection = ({
  formData,
  files,
  submitting,
  onFileChange,
  onRemoveFile
}: FormSectionProps) => {
  return (
    <div className="space-y-6 border-t border-gray-100 pt-10">
      <QuestionHeader 
        number={10} 
        title={formData.contract_type === "pensioner" ? "Documentación de Pensión" : "Documentación de Desempleo"}
        bgColor="bg-indigo-100"
        textColor="text-indigo-600"
      />

      <FileInputEnhanced
        id="pensioner_proof_file"
        label={formData.contract_type === "pensioner" ? "Justificante de pensión" : "Justificante de desempleo (paro, subsidio, etc.)"}
        file={files.pensioner_proof_file}
        onRemove={onRemoveFile}
        required={true}
        onChange={onFileChange}
        disabled={submitting}
      />
      
      <p className="text-gray-500 text-sm">
        {formData.contract_type === "pensioner" 
          ? "Sube el último justificante de tu pensión." 
          : "Sube el documento que acredite tu situación de desempleo (tarjeta de paro, subsidio, etc.)."}
      </p>
    </div>
  )
}