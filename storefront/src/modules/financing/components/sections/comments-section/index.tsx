import { FormTextarea } from "@modules/financing/components/textarea-input"
import { QuestionHeader } from "@modules/financing/components/form/question-header"
import type { FormSectionProps } from "../../../types"

export const CommentsSection = ({
  formData,
  onInputChange
}: FormSectionProps) => {
  return (
    <div className="space-y-6 border-t border-gray-100 pt-10">
      <QuestionHeader 
        number={13} 
        title="Comentarios Adicionales"
        bgColor="bg-violet-100"
        textColor="text-violet-600"
      />

      <FormTextarea
        label="¿Tienes alguna duda o comentario?"
        name="doubts"
        value={formData.doubts}
        onChange={onInputChange}
        placeholder="Escribe aquí si necesitas aclarar algo o tienes alguna pregunta..."
        rows={5}
      />
    </div>
  )
}