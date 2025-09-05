import type { QuestionHeaderProps } from "../../../types"

// Mapeo de colores por número de pregunta (extraído del original)
const QUESTION_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-blue-100", text: "text-blue-600" },
  2: { bg: "bg-purple-100", text: "text-purple-600" },
  3: { bg: "bg-green-100", text: "text-green-600" },
  4: { bg: "bg-blue-100", text: "text-blue-600" },
  5: { bg: "bg-purple-100", text: "text-purple-600" },
  7: { bg: "bg-cyan-100", text: "text-cyan-600" },
  8: { bg: "bg-orange-100", text: "text-orange-600" },
  9: { bg: "bg-teal-100", text: "text-teal-600" },
  10: { bg: "bg-indigo-100", text: "text-indigo-600" },
  11: { bg: "bg-emerald-100", text: "text-emerald-600" },
  12: { bg: "bg-pink-100", text: "text-pink-600" },
  13: { bg: "bg-violet-100", text: "text-violet-600" }
}

export const QuestionHeader = ({ 
  number, 
  title, 
  bgColor, 
  textColor 
}: QuestionHeaderProps) => {
  // Usar colores predefinidos si no se especifican
  const colors = QUESTION_COLORS[number] || { bg: "bg-gray-100", text: "text-gray-600" }
  const finalBgColor = bgColor || colors.bg
  const finalTextColor = textColor || colors.text

  return (
    <div className="flex items-center gap-4 mb-8">
      <div className={`flex items-center justify-center w-10 h-10 ${finalBgColor} ${finalTextColor} rounded-xl font-bold text-lg`}>
        {number}
      </div>
      <h3 className="text-2xl font-bold text-gray-900">
        {title}
      </h3>
    </div>
  )
}