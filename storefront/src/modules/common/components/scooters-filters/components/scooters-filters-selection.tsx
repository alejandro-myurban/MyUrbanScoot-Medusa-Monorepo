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
    <div className="mb-6">
      <div
        className="flex justify-between items-center cursor-pointer p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] lg:p-0 lg:border-0 lg:hover:bg-transparent lg:hover:scale-100 lg:border-b lg:border-gray-200 lg:rounded-none lg:pb-4 lg:mb-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-bold font-archivoBlack uppercase text-gray-800 lg:font-semibold lg:normal-case lg:font-sans">{title}</h3>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`w-4 h-4 transition-transform duration-200 text-gray-600 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </div>
      {isOpen && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 lg:mt-2 lg:p-0 lg:bg-transparent lg:border-0">
          {children}
        </div>
      )}
    </div>
  )
}

export default FilterSection