import React, { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import ReactCountryFlag from "react-country-flag"

// Solo los países más comunes
const PHONE_PREFIXES = [
  { code: "ES", prefix: "+34", flag: "🇪🇸" },
  { code: "FR", prefix: "+33", flag: "🇫🇷" },
  { code: "DE", prefix: "+49", flag: "🇩🇪" },
  { code: "GB", prefix: "+44", flag: "🇬🇧" },
  { code: "US", prefix: "+1", flag: "🇺🇸" },
  { code: "IT", prefix: "+39", flag: "🇮🇹" },
  { code: "PT", prefix: "+351", flag: "🇵🇹" },
]

interface PhoneInputProps {
  label: string
  name: string
  value: string
  phonePrefix: string
  onPhoneChange: (value: string) => void
  onPrefixChange: (prefix: string) => void
  required?: boolean
  placeholder?: string
  className?: string
  "data-testid"?: string
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  name,
  value,
  phonePrefix,
  onPhoneChange,
  onPrefixChange,
  required = false,
  placeholder = " ",
  className = "",
  "data-testid": testId,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedCountry =
    PHONE_PREFIXES.find((c) => c.prefix === phonePrefix) || PHONE_PREFIXES[0]
  const hasValue = value && value.trim().length > 0

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleCountrySelect = (country: (typeof PHONE_PREFIXES)[0]) => {
    onPrefixChange(country.prefix)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    setIsFocused(true)
  }

  const handleInputBlur = () => {
    setIsFocused(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPhoneChange(e.target.value)
  }

  return (
    <div className={`flex flex-col w-full ${className}`}>
      <div className="flex relative z-0 w-full txt-compact-medium">
        {/* Dropdown del prefijo */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="h-11 border border-[#e6e6e6] rounded-l-lg font-archivo bg-white px-3 flex items-center justify-between hover:bg-ui-bg-field-hover focus:outline-none focus:ring-0 focus:border-[#e6e6e6] min-w-[100px] border-r-0"
            style={{
              outline: "none",
              boxShadow: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div className="flex items-center space-x-2">
              <ReactCountryFlag
                svg
                className="hover:scale-110 transition-transform"
                style={{ width: '24px', height: '24px' }}
                countryCode={selectedCountry.code}
                aria-label={selectedCountry.code}
              />
              <span className="font-archivo text-gray-500 text-sm">
                {selectedCountry.prefix}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown menu */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#e6e6e6] rounded-lg font-archivo shadow-lg z-50 w-52 max-h-60 overflow-y-auto">
              {PHONE_PREFIXES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 font-archivo focus:outline-none flex items-center space-x-3 text-sm"
                >
                  <ReactCountryFlag
                    svg
                    className="hover:scale-110 transition-transform"
                    style={{ width: '24px', height: '24px' }}
                    countryCode={country.code}
                    aria-label={country.code}
                  />
                  <span className="font-archivo">{country.prefix}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input del teléfono */}
        <div className="relative flex-1 shadow-[0px_1px_1px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.02)]">
          <input
            ref={inputRef}
            type="tel"
            name={name}
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder=" "
            required={required}
            className="pt-4 border border-[#e6e6e6] rounded-r-lg shadow-[0px_1px_1px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.02)] pb-1 block w-full h-11 px-4 mt-0 font-archivo bg-white appearance-none focus:outline-none focus:ring-0 focus:border-[#e6e6e6] focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover border-l-0"
            style={{
              outline: "none",
              boxShadow: "none",
              WebkitTapHighlightColor: "transparent",
            }}
            data-testid={testId}
          />

          {/* Label flotante */}
          <label
            htmlFor={name}
            onClick={() => inputRef.current?.focus()}
            className={`flex items-center font-archivo  justify-center mx-3 px-1 transition-all absolute duration-300 -z-1 origin-0 text-gray-500 cursor-text ${
              isFocused || hasValue ? "top-3 text-xs" : "top-3 text-sm"
            }`}
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        </div>
      </div>
    </div>
  )
}

export default PhoneInput