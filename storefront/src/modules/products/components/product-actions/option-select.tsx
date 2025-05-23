import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"
import { useTranslation } from "react-i18next"
import { useColorContext } from "@lib/context/color-content-provider"

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

  console.log("OPTION SELECT", option)  

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm">
        {t("actions.select")} {title}
      </span>
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
                "border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded p-2 flex-1 ",
                {
                  "border-ui-border-interactive": current === v.value,
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
