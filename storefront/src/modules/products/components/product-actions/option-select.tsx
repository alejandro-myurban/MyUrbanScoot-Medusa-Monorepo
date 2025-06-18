import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"
import { useTranslation } from "react-i18next"
import { useColorContext } from "@lib/context/color-content-provider"
import { PlusCircle, MinusCircle } from "lucide-react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption & {
    values?: Array<{
      value: string
      label?: string // Añadido label para soportar traducciones
    }>
  }
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const { t } = useTranslation()
  const { optionTitle } = useColorContext()
  const [showInfo, setShowInfo] = React.useState<boolean>(false)

  // Información específica según el tipo de opción
  const getInfoContent = (optionTitle: string) => {
    switch (optionTitle.toLowerCase()) {
      case 'base':
        return {
          title: '¿Qué es base antideslizante?',
          content: 'La base antideslizante es un material especial que se adhiere al suelo para evitar que el producto se deslice. Proporciona mayor seguridad y estabilidad durante el uso.'
        }
      case 'modelo':
        return {
          title: '¿No sabes qué modelo elegir?',
          content: 'Si no sabes que modelo tienes no te preocupes, nosotros te ayudamos. Puedes contactarnos por Whatsapp o Email y te asesoraremos encantados.'
        }
      case 'tamaño':
      case 'size':
        return {
          title: '¿Cómo elegir el tamaño?',
          content: 'Mide el espacio disponible y consulta nuestra guía de tallas para encontrar el tamaño perfecto para tus necesidades.'
        }
      default:
        return {
          title: `¿Qué es ${title}?`,
          content: 'Esta opción te permite personalizar el producto según tus preferencias. Cada variante tiene características específicas.'
        }
    }
  }

    const getSelectText = (optionTitle: string) => {
    switch (optionTitle.toLowerCase()) {
      case 'base':
      case 'base':
        return `${t("actions.select")} ${optionTitle}` // "Seleccionar" (traducido)
      case 'modelo':
      case 'model':
        return `Elige tu ${title}`
      case 'color':
        return `Escoge el ${title}`
      case 'tamaño':
      case 'size':
        return `Selecciona el ${title}`
      default:
        return t("actions.select") + ` ${title}` // Fallback por defecto
    }
  }

  const infoContent = getInfoContent(title)

  return (
    <div className="flex flex-col gap-y-3">
      <span className="font-semibold flex items-center justify-between text-2xl">
        {getSelectText(title)}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="font-normal text-left cursor-pointer text-sm flex justify-center items-center gap-1 underline hover:text-gray-600 transition-colors"
        >
          {infoContent.title}
          {showInfo ? (
            <MinusCircle strokeWidth={1} size={16} />
          ) : (
            <PlusCircle strokeWidth={1} size={16} />
          )}
        </button>
      </span>

      {/* Acordeón con información */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        showInfo ? 'max-h-32 opacity-100 mb-2' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-sm text-gray-600 leading-relaxed">
            {infoContent.content}
          </p>
        </div>
      </div>

      <div
        className="flex flex-wrap justify-between gap-2"
        data-testid={dataTestId}
      >
        {option.values?.map((v) => {
          // Usa label si está disponible, si no usa value
          //@ts-ignore
          const displayValue = v.translations?.value || v.value

          return (
            <button
              onClick={() => updateOption(option.title, v.value)}
              key={v.value}
              className={clx(
                "border-black/80 flex items-center bg-ui-bg-subtle border-2 font-semibold  rounded-md px-4 py-2 h-20 flex-1",
                {
                  "border-black/80 bg-black/80 text-white border-2 font-semibold":
                    current === v.value,
                  "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                    current !== v.value,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {displayValue}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect