// src/components/ui/FilterSection.tsx
"use client"

import React, { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"

type FilterSectionProps = {
  title: string
  children: React.ReactNode
  initialOpen?: boolean
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  children,
  initialOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen)

  return (
    <div className="mb-4">
      <div
        className="flex justify-between items-center cursor-pointer p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] lg:p-0 lg:border-0 lg:hover:bg-transparent lg:hover:scale-100 lg:border-b lg:border-gray-100 lg:rounded-none lg:pb-3 lg:mb-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide lg:font-medium lg:normal-case lg:text-gray-700">{title}</h4>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`w-3 h-3 transition-transform duration-200 text-gray-500 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </div>
      {isOpen && (
        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 lg:mt-2 lg:p-0 lg:bg-transparent lg:border-0 lg:rounded-none">
          {children}
        </div>
      )}
    </div>
  )
}

export default FilterSection