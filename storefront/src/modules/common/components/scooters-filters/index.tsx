// modules/products/components/scooters-filters.tsx
"use client"

import React, { useState, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import FilterSection from "./components/scooters-filters-selection"
import CheckboxFilterGroup from "./components/scooters-filters-cbgroup"
import RangeFilter from "../range-filter"

const dgtOptions = ["DGT", "NO DGT"]
const motorTypeOptions = ["single", "dual"]
const hydraulicBrakesOptions = ["yes", "no"]
const tireSizeOptions = ["10\"x3", "10\"x2,75-6,5", "8,5\"x3"]
const gripTypeOptions = ["offroad (Taco)", "smooth", "mixed"]
const tireTypeOptions = ["Tubeless", "Tube", "Solid"]

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
  // Lógica para manejar cambios en los filtros de rango
  const handleRangeChange = (key: "autonomyRange" | "powerRange" | "voltageRange" | "weightRange" | "speedRange", newRange: [number, number]) => {
    setSelectedFilters({ ...selectedFilters, [key]: newRange });
  };

  // Lógica para manejar el toggle de los checkboxes
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

  // Lógica para calcular min/max dinámicamente para los filtros de rango
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

    // Añade un pequeño búfer al máximo para la interfaz de usuario
    const buffer = max * 0.1 > 10 ? Math.round(max * 0.1) : 10;
    return [min, max + buffer];
  };

  // Usamos useMemo para optimizar el cálculo de los límites,
  // solo se recalcularán si allProducts cambia.
  const autonomyBounds = useMemo(() => calculateMinMax(allProducts, "autonomy_km", [0, 200]), [allProducts]);
  const powerBounds = useMemo(() => calculateMinMax(allProducts, "motor_power_w", [0, 5000]), [allProducts]);
  const voltageBounds = useMemo(() => calculateMinMax(allProducts, "battery_voltage_v", [0, 100]), [allProducts]);
  const weightBounds = useMemo(() => calculateMinMax(allProducts, "weight_kg", [0, 100]), [allProducts]);
  const speedBounds = useMemo(() => calculateMinMax(allProducts, "max_speed_kmh", [0, 120]), [allProducts]);


  return (
    <div className="space-y-4">
      <FilterSection title="Homologación DGT">
        <CheckboxFilterGroup
          options={dgtOptions}
          selectedValues={selectedFilters.dgt}
          onToggle={(value) => toggleCheckbox("dgt", value)}
        />
      </FilterSection>

      <FilterSection title="Tipo de motor">
        <CheckboxFilterGroup
          options={motorTypeOptions}
          selectedValues={selectedFilters.motorType}
          onToggle={(value) => toggleCheckbox("motorType", value)}
        />
      </FilterSection>

      <FilterSection title="Frenos hidráulicos">
        <CheckboxFilterGroup
          options={hydraulicBrakesOptions}
          selectedValues={selectedFilters.hydraulicBrakes}
          onToggle={(value) => toggleCheckbox("hydraulicBrakes", value)}
        />
      </FilterSection>

      <FilterSection title="Tamaño neumático">
        <CheckboxFilterGroup
          options={tireSizeOptions}
          selectedValues={selectedFilters.tireSizes}
          onToggle={(value) => toggleCheckbox("tireSizes", value)}
        />
      </FilterSection>

      <FilterSection title="Tipo de agarre">
        <CheckboxFilterGroup
          options={gripTypeOptions}
          selectedValues={selectedFilters.gripTypes}
          onToggle={(value) => toggleCheckbox("gripTypes", value)}
        />
      </FilterSection>

      <FilterSection title="Tipo de neumático">
        <CheckboxFilterGroup
          options={tireTypeOptions}
          selectedValues={selectedFilters.tireTypes}
          onToggle={(value) => toggleCheckbox("tireTypes", value)}
        />
      </FilterSection>

      <FilterSection title="Autonomía (km)">
        <RangeFilter
          label="Autonomía (km)"
          range={selectedFilters.autonomyRange}
          onChange={(newRange) => handleRangeChange("autonomyRange", newRange)}
          minPossible={autonomyBounds[0]}
          maxPossible={autonomyBounds[1]}
        />
      </FilterSection>

      <FilterSection title="Potencia del motor (W)">
        <RangeFilter
          label="Potencia del motor (W)"
          range={selectedFilters.powerRange}
          onChange={(newRange) => handleRangeChange("powerRange", newRange)}
          minPossible={powerBounds[0]}
          maxPossible={powerBounds[1]}
        />
      </FilterSection>

      <FilterSection title="Voltaje de la batería (V)">
        <RangeFilter
          label="Voltaje de la batería (V)"
          range={selectedFilters.voltageRange}
          onChange={(newRange) => handleRangeChange("voltageRange", newRange)}
          minPossible={voltageBounds[0]}
          maxPossible={voltageBounds[1]}
        />
      </FilterSection>

      <FilterSection title="Peso (kg)">
        <RangeFilter
          label="Peso (kg)"
          range={selectedFilters.weightRange}
          onChange={(newRange) => handleRangeChange("weightRange", newRange)}
          minPossible={weightBounds[0]}
          maxPossible={weightBounds[1]}
        />
      </FilterSection>

      <FilterSection title="Velocidad máxima (km/h)">
        <RangeFilter
          label="Velocidad máxima (km/h)"
          range={selectedFilters.speedRange}
          onChange={(newRange) => handleRangeChange("speedRange", newRange)}
          minPossible={speedBounds[0]}
          maxPossible={speedBounds[1]}
        />
      </FilterSection>
    </div>
  )
}

export default ScootersFilters