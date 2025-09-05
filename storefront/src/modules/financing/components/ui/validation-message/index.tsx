import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react"
import type { ValidationMessageProps } from "../../../types"

export const ValidationMessage = ({ message, type = 'error' }: ValidationMessageProps) => {
  if (!message) return null

  const getIconAndStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          className: "text-green-600"
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          className: "text-amber-500"
        }
      case 'info':
        return {
          icon: <Info className="h-4 w-4" />,
          className: "text-blue-600"
        }
      case 'error':
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          className: "text-red-600"
        }
    }
  }

  const { icon, className } = getIconAndStyles()

  return (
    <div className={`mt-1 flex items-center ${className} text-sm`}>
      <span className="mr-2">{icon}</span>
      {message}
    </div>
  )
}