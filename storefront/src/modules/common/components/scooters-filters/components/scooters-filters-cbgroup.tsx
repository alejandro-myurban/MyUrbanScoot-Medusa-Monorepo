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
    <div className="space-y-1">
      {options.map((opt) => (
        <CheckboxWithLabel
          key={opt}
          label={opt}
          checked={selectedValues.includes(opt)}
          onChange={() => onToggle(opt)}
        />
      ))}
    </div>
  )
}

export default CheckboxFilterGroup