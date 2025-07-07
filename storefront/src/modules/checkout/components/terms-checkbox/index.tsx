import { Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

// Componente del checkbox de términos y condiciones
interface TermsCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export const TermsCheckbox = ({
  checked,
  onChange,
  className = "",
}: TermsCheckboxProps) => {
  const { t } = useTranslation()
  return (
    <div className={`flex items-start gap-3 py-2 ${className}`}>
      {/* Checkbox personalizado */}
      <div className="flex-shrink-0">
        <label className="relative flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`
            w-5 h-5 rounded border-2 flex items-center justify-center transition-all
            ${
              checked
                ? "bg-black border-black"
                : "bg-white border-gray-300 hover:border-gray-400"
            }
          `}
          >
            {checked && (
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </label>
      </div>

      {/* Texto de términos */}
      <div className="flex-1">
        <Text className="text-sm text-gray-700">
          {t("checkout.summary.terms")}{" "}
          <a
            href="/terminos-y-condiciones"
            className="text-gray-500 underline hover:text-gray-700 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("checkout.summary.terms_link")}
          </a>
        </Text>
      </div>
    </div>
  )
}
