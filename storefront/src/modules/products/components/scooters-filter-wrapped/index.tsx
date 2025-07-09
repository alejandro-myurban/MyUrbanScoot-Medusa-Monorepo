"use client"

import React, { useState, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import ScootersFilters from "@/modules/common/components/scooters-filters"

type Props = {
  allProducts: HttpTypes.StoreProduct[]
}

const ScootersFiltersWrapper: React.FC<Props> = ({ allProducts }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    dgt: [] as string[],
    motorType: [] as string[],
    hydraulicBrakes: [] as string[],
    tireSizes: [] as string[],
    gripTypes: [] as string[], // Asegúrate de que estas también estén inicializadas
    tireTypes: [] as string[], // Asegúrate de que estas también estén inicializadas
    autonomyRange: [0, 100] as [number, number],
    powerRange: [0, 5000] as [number, number],
    voltageRange: [0, 72] as [number, number],
    weightRange: [0, 60] as [number, number],
    speedRange: [0, 80] as [number, number],
  })

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const m = product.metadata || {}

      // Asegurarse de que los metadatos existan y sean del tipo correcto antes de usar includes
      const dgtMatch = !selectedFilters.dgt.length || (m.dgt && selectedFilters.dgt.includes(m.dgt as string));
      const motorTypeMatch = !selectedFilters.motorType.length || (m.motor_type && selectedFilters.motorType.includes(m.motor_type as string));
      const hydraulicBrakesMatch = !selectedFilters.hydraulicBrakes.length || (m.hydraulic_brakes && selectedFilters.hydraulicBrakes.includes(m.hydraulic_brakes as string));
      const tireSizesMatch = !selectedFilters.tireSizes.length || (m.tire_size && selectedFilters.tireSizes.includes(m.tire_size as string));
      const gripTypesMatch = !selectedFilters.gripTypes.length || (m.tire_grip_type && selectedFilters.gripTypes.includes(m.tire_grip_type as string)); // Corregido metadata key
      const tireTypesMatch = !selectedFilters.tireTypes.length || (m.tire_type && selectedFilters.tireTypes.includes(m.tire_type as string)); // Corregido metadata key


      const autonomyMatch =
        Number(m.autonomy_km) >= selectedFilters.autonomyRange[0] &&
        Number(m.autonomy_km) <= selectedFilters.autonomyRange[1];
      const powerMatch =
        Number(m.motor_power_w) >= selectedFilters.powerRange[0] &&
        Number(m.motor_power_w) <= selectedFilters.powerRange[1];
      const voltageMatch =
        Number(m.battery_voltage_v) >= selectedFilters.voltageRange[0] &&
        Number(m.battery_voltage_v) <= selectedFilters.voltageRange[1];
      const weightMatch =
        Number(m.weight_kg) >= selectedFilters.weightRange[0] &&
        Number(m.weight_kg) <= selectedFilters.weightRange[1];
      const speedMatch =
        Number(m.max_speed_kmh) >= selectedFilters.speedRange[0] && // Corregido metadata key
        Number(m.max_speed_kmh) <= selectedFilters.speedRange[1]; // Corregido metadata key


      return (
        dgtMatch &&
        motorTypeMatch &&
        hydraulicBrakesMatch &&
        tireSizesMatch &&
        gripTypesMatch &&
        tireTypesMatch &&
        autonomyMatch &&
        powerMatch &&
        voltageMatch &&
        weightMatch &&
        speedMatch
      )
    })
  }, [selectedFilters, allProducts])

  return (
    <div className="space-y-4">
      <ScootersFilters
        selectedFilters={selectedFilters}
        setSelectedFilters={setSelectedFilters}
        allProducts={allProducts} 
      />
    </div>
  )
}

export default ScootersFiltersWrapper
