import { Label } from "@medusajs/ui"
import React, { useEffect, useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, name, label, touched, required, topLabel, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className="flex flex-col w-full">
        {topLabel && (
          <Label className="mb-2 txt-compact-medium-plus">{topLabel}</Label>
        )}
        <div className="flex relative z-0 w-full txt-compact-medium">
          <input
            type={inputType}
            name={name}
            placeholder=" "
            required={required}
            className="pt-4 border border-[#e6e6e6] rounded-lg shadow-[0px_1px_1px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.02)] pb-1 block w-full h-11 px-4 mt-0 font-archivo bg-white appearance-none focus:outline-none focus:ring-0 focus:border-[#e6e6e6] focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover !outline-none !ring-0 focus:!outline-none focus:!ring-0 focus:!shadow-none"
            style={{ 
              outline: 'none', 
              boxShadow: 'none',
              // Sobrescribir cualquier outline del navegador
              WebkitTapHighlightColor: 'transparent'
            }}
            {...props}
            ref={inputRef}
          />
          <label
            htmlFor={name}
            onClick={() => inputRef.current?.focus()}
            className="flex items-center font-archivo justify-center mx-3 px-1 transition-all absolute duration-300 top-3 -z-1 origin-0 text-gray-500"
          >
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-ui-fg-subtle px-4 focus:outline-none transition-all duration-150 outline-none focus:text-ui-fg-base absolute right-0 top-3"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input