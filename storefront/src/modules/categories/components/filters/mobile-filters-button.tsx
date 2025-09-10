"use client"

import React, { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import ScootersFilters from "@/modules/common/components/scooters-filters"
import { useScootersFilters } from "./hooks/useScootersFilters"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFilter, faTimes } from "@fortawesome/free-solid-svg-icons"

type Props = {
  allProducts: HttpTypes.StoreProduct[]
  initialSearchParams: Record<string, string | string[] | undefined>
}

const MobileFiltersButton: React.FC<Props> = ({ allProducts, initialSearchParams }) => {
  const { selectedFilters, handleFilterChange, resetFilters } = useScootersFilters(initialSearchParams)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen)
  }

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  return (
    <>
      {/* Mobile Floating Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleModal}
          className="bg-red-500 text-white p-4 rounded-full shadow-2xl hover:bg-red-600 transition-all duration-300 transform hover:scale-110 active:scale-95"
        >
          <FontAwesomeIcon icon={faFilter} className="text-xl" />
        </button>
      </div>

      {/* Mobile Modal */}
      {isModalOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={toggleModal}
          />
          
          <div className="relative bg-white w-full max-h-[85vh] rounded-t-3xl shadow-2xl transform transition-all duration-300 ease-out animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold font-archivoBlack uppercase text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} className="text-gray-600" />
                Filtros
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={resetFilters}
                  className="text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  Limpiar filtros
                </button>
                <button
                  onClick={toggleModal}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-gray-600 text-lg" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <ScootersFilters
                selectedFilters={selectedFilters}
                setSelectedFilters={handleFilterChange}
                allProducts={allProducts}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default MobileFiltersButton