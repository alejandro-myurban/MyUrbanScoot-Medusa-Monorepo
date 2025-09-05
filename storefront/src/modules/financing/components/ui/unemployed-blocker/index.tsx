import { AlertCircle, CheckCircle2 } from "lucide-react"
import WhatsApp from "@modules/common/icons/whatsapp"
import { WHATSAPP_CONFIG } from "../../../utils/constants"
import type { UnemployedBlockerProps } from "../../../types"

export const UnemployedBlocker = ({ isVisible }: UnemployedBlockerProps) => {
  if (!isVisible) return null

  return (
    <div className="space-y-6 border-t border-gray-100 pt-10">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-8">
        <div className="flex items-start sm:gap-6">
          <div className="flex-shrink-0">
            <div className="items-center hidden sm:flex justify-center w-12 h-12 bg-amber-100 text-amber-600 rounded-full">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="flex-grow">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Financiación no disponible
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Lamentamos informarte que actualmente no podemos ofrecerte opciones de financiación para personas en situación de desempleo. Esto se debe a los requisitos de estabilidad económica establecidos por nuestras entidades financieras colaboradoras.
            </p>
            <div className="bg-white rounded-lg p-4 border border-amber-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                ¿Tienes otra situación laboral?
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Si cuentas con ingresos regulares de otra fuente (pensión, autónomo, empleado), selecciona la opción correspondiente arriba.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://wa.me/${WHATSAPP_CONFIG.PHONE_FINANCING}?text=${WHATSAPP_CONFIG.MESSAGE_FINANCING}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  <WhatsApp className="h-4 w-4" />
                  Consultar por WhatsApp
                </a>
                <a
                  href="tel:+34647744525"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Llamar al 647 744 525
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}