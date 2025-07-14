"use client"

import React, { useState, useMemo } from "react"
import CheckboxWithLabel from "../checkbox"
import RangeFilter from "../range-filter"
import { HttpTypes } from "@medusajs/types" // Importamos HttpTypes para tipar los productos

// Estas opciones se usarán para renderizar múltiples checkboxes
const dgtOptions = ["DGT", "NO DGT"]
const motorTypeOptions = ["single", "dual"]
const hydraulicBrakesOptions = ["yes", "no"]
const tireSizeOptions = ["10\"x3", "10\"x2,75-6,5", "8,5\"x3"] // Opciones de ejemplo
const gripTypeOptions = ["offroad (Taco)", "smooth", "mixed"] // Opciones de ejemplo
const tireTypeOptions = ["Tubeless", "Tube", "Solid"] // Opciones de ejemplo

type Props = {
  selectedFilters: {
    dgt: string[]
    motorType: string[]
    hydraulicBrakes: string[]
    tireSizes: string[]
    gripTypes: string[]
    tireTypes: string[]
    autonomyRange: [number, number]
    powerRange: [number, number]
    voltageRange: [number, number]
    weightRange: [number, number]
    speedRange: [number, number]
  }
  setSelectedFilters: (filters: Props["selectedFilters"]) => void
  allProducts: HttpTypes.StoreProduct[]; 
}

const ScootersFilters: React.FC<Props> = ({ selectedFilters, setSelectedFilters, allProducts }) => {
  // Estados para controlar el despliegue de cada sección
  const [isDgtOpen, setIsDgtOpen] = useState(false);
  const [isMotorTypeOpen, setIsMotorTypeOpen] = useState(false);
  const [isHydraulicBrakesOpen, setIsHydraulicBrakesOpen] = useState(false);
  const [isTireSizeOpen, setIsTireSizeOpen] = useState(false);
  const [isAutonomyOpen, setIsAutonomyOpen] = useState(false);
  const [isPowerOpen, setIsPowerOpen] = useState(false);
  const [isVoltageOpen, setIsVoltageOpen] = useState(false);
  const [isWeightOpen, setIsWeightOpen] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);

  const handleRangeChange = (key: "autonomyRange" | "powerRange" | "voltageRange" | "weightRange" | "speedRange", newRange: [number, number]) => {
    setSelectedFilters({ ...selectedFilters, [key]: newRange });
  };

  const toggleCheckbox = (
    key: "dgt" | "motorType" | "hydraulicBrakes" | "tireSizes" | "gripTypes" | "tireTypes",
    value: string
  ) => {
    const current = selectedFilters[key] || [];
    const isSelected = current.includes(value);

    const newValues = isSelected
      ? current.filter((v) => v !== value)
      : [...current, value];

    setSelectedFilters({ ...selectedFilters, [key]: newValues });
  };

  const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  );

  // Lógica para calcular min/max dinámicamente
  const calculateMinMax = (
    products: HttpTypes.StoreProduct[],
    metadataKey: string,
    defaultValue: [number, number] // Valor por defecto si no se encuentran datos
  ): [number, number] => {
    let min = Infinity;
    let max = -Infinity;

    products.forEach(product => {
      const value = Number(product.metadata?.[metadataKey]);
      if (!isNaN(value)) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    });

    if (min === Infinity || max === -Infinity) {
      return defaultValue;
    }

    const buffer = max * 0.1 > 10 ? Math.round(max * 0.1) : 10;
    return [min, max + buffer];
  };

  const autonomyBounds = useMemo(() => calculateMinMax(allProducts, "autonomy_km", [0, 200]), [allProducts]);
  const powerBounds = useMemo(() => calculateMinMax(allProducts, "motor_power_w", [0, 5000]), [allProducts]);
  const voltageBounds = useMemo(() => calculateMinMax(allProducts, "battery_voltage_v", [0, 100]), [allProducts]);
  const weightBounds = useMemo(() => calculateMinMax(allProducts, "weight_kg", [0, 100]), [allProducts]);
  const speedBounds = useMemo(() => calculateMinMax(allProducts, "max_speed_kmh", [0, 120]), [allProducts]);


  return (
    <div className="space-y-4">
      {/* Homologación DGT */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsDgtOpen(!isDgtOpen)}>
          <p className="font-semibold">Homologación DGT</p>
          <ChevronIcon isOpen={isDgtOpen} />
        </div>
        {isDgtOpen && (
          <div className="mt-2 space-y-1">
            {dgtOptions.map((opt) => (
              <CheckboxWithLabel
                key={opt}
                label={opt}
                checked={(selectedFilters.dgt || []).includes(opt)}
                onChange={() => toggleCheckbox("dgt", opt)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tipo de motor */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsMotorTypeOpen(!isMotorTypeOpen)}>
          <p className="font-semibold">Tipo de motor</p>
          <ChevronIcon isOpen={isMotorTypeOpen} />
        </div>
        {isMotorTypeOpen && (
          <div className="mt-2 space-y-1">
            {motorTypeOptions.map((opt) => (
              <CheckboxWithLabel
                key={opt}
                label={opt}
                checked={(selectedFilters.motorType || []).includes(opt)}
                onChange={() => toggleCheckbox("motorType", opt)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Frenos hidráulicos */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsHydraulicBrakesOpen(!isHydraulicBrakesOpen)}>
          <p className="font-semibold">Frenos hidráulicos</p>
          <ChevronIcon isOpen={isHydraulicBrakesOpen} />
        </div>
        {isHydraulicBrakesOpen && (
          <div className="mt-2 space-y-1">
            {hydraulicBrakesOptions.map((opt) => (
              <CheckboxWithLabel
                key={opt}
                label={opt}
                checked={(selectedFilters.hydraulicBrakes || []).includes(opt)}
                onChange={() => toggleCheckbox("hydraulicBrakes", opt)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tamaño neumático */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsTireSizeOpen(!isTireSizeOpen)}>
          <p className="font-semibold">Tamaño neumático</p>
          <ChevronIcon isOpen={isTireSizeOpen} />
        </div>
        {isTireSizeOpen && (
          <div className="mt-2 space-y-1">
            {tireSizeOptions.map((opt) => (
              <CheckboxWithLabel
                key={opt}
                label={opt}
                checked={(selectedFilters.tireSizes || []).includes(opt)}
                onChange={() => toggleCheckbox("tireSizes", opt)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filtros de Rango */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsAutonomyOpen(!isAutonomyOpen)}>
          <p className="font-semibold">Autonomía (km)</p>
          <ChevronIcon isOpen={isAutonomyOpen} />
        </div>
        {isAutonomyOpen && (
          <div className="mt-2">
            <RangeFilter
              label="Autonomía (km)"
              range={selectedFilters.autonomyRange}
              onChange={(newRange) => handleRangeChange("autonomyRange", newRange)}
              minPossible={autonomyBounds[0]}
              maxPossible={autonomyBounds[1]}
            />
          </div>
        )}
      </div>

      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsPowerOpen(!isPowerOpen)}>
          <p className="font-semibold">Potencia del motor (W)</p>
          <ChevronIcon isOpen={isPowerOpen} />
        </div>
        {isPowerOpen && (
          <div className="mt-2">
            <RangeFilter
              label="Potencia del motor (W)"
              range={selectedFilters.powerRange}
              onChange={(newRange) => handleRangeChange("powerRange", newRange)}
              minPossible={powerBounds[0]}
              maxPossible={powerBounds[1]}
            />
          </div>
        )}
      </div>

      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsVoltageOpen(!isVoltageOpen)}>
          <p className="font-semibold">Voltaje de la batería (V)</p>
          <ChevronIcon isOpen={isVoltageOpen} />
        </div>
        {isVoltageOpen && (
          <div className="mt-2">
            <RangeFilter
              label="Voltaje de la batería (V)"
              range={selectedFilters.voltageRange}
              onChange={(newRange) => handleRangeChange("voltageRange", newRange)}
              minPossible={voltageBounds[0]}
              maxPossible={voltageBounds[1]}
            />
          </div>
        )}
      </div>

      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsWeightOpen(!isWeightOpen)}>
          <p className="font-semibold">Peso (kg)</p>
          <ChevronIcon isOpen={isWeightOpen} />
        </div>
        {isWeightOpen && (
          <div className="mt-2">
            <RangeFilter
              label="Peso (kg)"
              range={selectedFilters.weightRange}
              onChange={(newRange) => handleRangeChange("weightRange", newRange)}
              minPossible={weightBounds[0]}
              maxPossible={weightBounds[1]}
            />
          </div>
        )}
      </div>

      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsSpeedOpen(!isSpeedOpen)}>
          <p className="font-semibold">Velocidad máxima (km/h)</p>
          <ChevronIcon isOpen={isSpeedOpen} />
        </div>
        {isSpeedOpen && (
          <div className="mt-2">
            <RangeFilter
              label="Velocidad máxima (km/h)"
              range={selectedFilters.speedRange}
              onChange={(newRange) => handleRangeChange("speedRange", newRange)}
              minPossible={speedBounds[0]}
              maxPossible={speedBounds[1]}
            />
          </div>
        )}
      </div>

    </div>
  )
}

export default ScootersFilters