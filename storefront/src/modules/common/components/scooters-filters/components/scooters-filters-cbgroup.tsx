// components/CheckboxFilterGroup.tsx
import React from "react"
import CheckboxWithLabel from "../../checkbox"

type CheckboxFilterGroupProps = {
  options: string[]
  selectedValues: string[]
  onToggle: (value: string) => void
}

const CheckboxFilterGroup: React.FC<CheckboxFilterGroupProps> = ({
  options,
  selectedValues,
  onToggle,
}) => {
  return (
    <div className="space-y-3 lg:space-y-1">
      {options.map((opt) => {
        const isSelected = selectedValues.includes(opt)
        
        return (
          <div
            key={opt}
            className={`
              lg:hidden flex items-center justify-between p-3 rounded-xl border transition-all duration-200 transform hover:scale-[1.02] cursor-pointer
              ${isSelected 
                ? "bg-red-500 text-white border-red-500 shadow-lg" 
                : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }
            `}
            onClick={() => onToggle(opt)}
          >
            <span className={`font-archivo ${isSelected ? "text-white font-medium" : "text-gray-700"}`}>
              {opt}
            </span>
            <div className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200
              ${isSelected 
                ? "bg-white border-white" 
                : "border-gray-300"
              }
            `}>
              {isSelected && (
                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        )
      })}
      
      {/* Desktop Version */}
      <div className="hidden lg:block space-y-1">
        {options.map((opt) => (
          <CheckboxWithLabel
            key={opt}
            label={opt}
            checked={selectedValues.includes(opt)}
            onChange={() => onToggle(opt)}
          />
        ))}
      </div>
    </div>
  )
}

export default CheckboxFilterGroup