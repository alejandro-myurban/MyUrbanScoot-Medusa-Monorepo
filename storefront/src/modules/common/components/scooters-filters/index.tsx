"use client"

import React, { useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import FilterSection from "./components/scooters-filters-selection"
import CheckboxFilterGroup from "./components/scooters-filters-cbgroup"
import RangeFilter from "../range-filter"
import { useTranslation } from "react-i18next"

import { getFilterOptions } from "./filterOptions"
import { handleRangeChange, toggleCheckbox, calculateMinMax } from "./filterUtils"

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
  allProducts: HttpTypes.StoreProduct[]
}

const ScootersFilters: React.FC<Props> = ({ selectedFilters, setSelectedFilters, allProducts }) => {
  const { t } = useTranslation()
  const options = getFilterOptions(t)

  // Ranges dinámicos
  const autonomyBounds = useMemo(() => calculateMinMax(allProducts, "autonomy_km", [0, 200]), [allProducts])
  const powerBounds = useMemo(() => calculateMinMax(allProducts, "motor_power_w", [0, 5000]), [allProducts])
  const voltageBounds = useMemo(() => calculateMinMax(allProducts, "battery_voltage_v", [0, 100]), [allProducts])
  const weightBounds = useMemo(() => calculateMinMax(allProducts, "weight_kg", [0, 100]), [allProducts])
  const speedBounds = useMemo(() => calculateMinMax(allProducts, "max_speed_kmh", [0, 120]), [allProducts])

  return (
    <div className="space-y-4">
      <FilterSection title={t("filters.dgt.title")}>
        <CheckboxFilterGroup
          options={options.dgt}
          selectedValues={selectedFilters.dgt}
          onToggle={(v) => toggleCheckbox("dgt", v, selectedFilters, setSelectedFilters)}
        />
      </FilterSection>

      <FilterSection title={t("filters.motorType.title")}>
        <CheckboxFilterGroup
          options={options.motorType}
          selectedValues={selectedFilters.motorType}
          onToggle={(v) => toggleCheckbox("motorType", v, selectedFilters, setSelectedFilters)}
        />
      </FilterSection>

      <FilterSection title={t("filters.hydraulicBrakes.title")}>
        <CheckboxFilterGroup
          options={options.hydraulicBrakes}
          selectedValues={selectedFilters.hydraulicBrakes}
          onToggle={(v) => toggleCheckbox("hydraulicBrakes", v, selectedFilters, setSelectedFilters)}
        />
      </FilterSection>

      <FilterSection title={t("filters.tireSizes.title")}>
        <CheckboxFilterGroup
          options={options.tireSizes}
          selectedValues={selectedFilters.tireSizes}
          onToggle={(v) => toggleCheckbox("tireSizes", v, selectedFilters, setSelectedFilters)}
        />
      </FilterSection>

      <FilterSection title={t("filters.gripTypes.title")}>
        <CheckboxFilterGroup
          options={options.gripTypes}
          selectedValues={selectedFilters.gripTypes}
          onToggle={(v) => toggleCheckbox("gripTypes", v, selectedFilters, setSelectedFilters)}
        />
      </FilterSection>

      <FilterSection title={t("filters.tireTypes.title")}>
        <CheckboxFilterGroup
          options={options.tireTypes}
          selectedValues={selectedFilters.tireTypes}
          onToggle={(v) => toggleCheckbox("tireTypes", v, selectedFilters, setSelectedFilters)}
        />
      </FilterSection>

      <FilterSection title={t("filters.autonomy.title")}>
        <RangeFilter
          label={t("filters.autonomy.label")}
          range={selectedFilters.autonomyRange}
          onChange={(r) => handleRangeChange("autonomyRange", r, selectedFilters, setSelectedFilters)}
          minPossible={autonomyBounds[0]}
          maxPossible={autonomyBounds[1]}
        />
      </FilterSection>

      <FilterSection title={t("filters.power.title")}>
        <RangeFilter
          label={t("filters.power.label")}
          range={selectedFilters.powerRange}
          onChange={(r) => handleRangeChange("powerRange", r, selectedFilters, setSelectedFilters)}
          minPossible={powerBounds[0]}
          maxPossible={powerBounds[1]}
        />
      </FilterSection>

      <FilterSection title={t("filters.voltage.title")}>
        <RangeFilter
          label={t("filters.voltage.label")}
          range={selectedFilters.voltageRange}
          onChange={(r) => handleRangeChange("voltageRange", r, selectedFilters, setSelectedFilters)}
          minPossible={voltageBounds[0]}
          maxPossible={voltageBounds[1]}
        />
      </FilterSection>

      <FilterSection title={t("filters.weight.title")}>
        <RangeFilter
          label={t("filters.weight.label")}
          range={selectedFilters.weightRange}
          onChange={(r) => handleRangeChange("weightRange", r, selectedFilters, setSelectedFilters)}
          minPossible={weightBounds[0]}
          maxPossible={weightBounds[1]}
        />
      </FilterSection>

      <FilterSection title={t("filters.speed.title")}>
        <RangeFilter
          label={t("filters.speed.label")}
          range={selectedFilters.speedRange}
          onChange={(r) => handleRangeChange("speedRange", r, selectedFilters, setSelectedFilters)}
          minPossible={speedBounds[0]}
          maxPossible={speedBounds[1]}
        />
      </FilterSection>
    </div>
  )
}

export default ScootersFilters
