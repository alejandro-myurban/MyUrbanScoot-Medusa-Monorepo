// modules/products/components/scooters-filters-container.tsx
"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import ScootersFilters from "../../common/components/scooters-filters/index" 

// Tipo para los filtros seleccionados
type SelectedFilters = {
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

type Props = {
  allProducts: HttpTypes.StoreProduct[] // Productos sin filtrar, para calcular min/max
  initialSearchParams: { [key: string]: string | string[] | undefined } // Parámetros iniciales del servidor
}

const ScootersFiltersContainer: React.FC<Props> = ({ allProducts, initialSearchParams }) => {
  const router = useRouter()
  const pathname = usePathname()
  const currentSearchParams = useSearchParams()

  // Definir los valores predeterminados iniciales para los rangos
  const initialAutonomyRange: [number, number] = [0, 200];
  const initialPowerRange: [number, number] = [0, 5000];
  const initialVoltageRange: [number, number] = [0, 100];
  const initialWeightRange: [number, number] = [0, 100];
  const initialSpeedRange: [number, number] = [0, 120];

  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    dgt: [],
    motorType: [],
    hydraulicBrakes: [],
    tireSizes: [],
    gripTypes: [],
    tireTypes: [],
    autonomyRange: initialAutonomyRange,
    powerRange: initialPowerRange,
    voltageRange: initialVoltageRange,
    weightRange: initialWeightRange,
    speedRange: initialSpeedRange,
  })

  useEffect(() => {
    const newFilters: SelectedFilters = { ...selectedFilters }; 

    const checkboxKeys: Array<keyof SelectedFilters> = [
      'dgt', 'motorType', 'hydraulicBrakes', 'tireSizes', 'gripTypes', 'tireTypes'
    ];
    checkboxKeys.forEach(key => {
      const param = initialSearchParams[key]; 
      newFilters[key] = Array.isArray(param)
        ? (param as string[])
        : (typeof param === 'string' ? [param] : []);
    });

    // Para rangos (formato "min,max")
    const rangeKeys: Array<[keyof SelectedFilters, [number, number]]> = [
      ['autonomyRange', initialAutonomyRange],
      ['powerRange', initialPowerRange],
      ['voltageRange', initialVoltageRange],
      ['weightRange', initialWeightRange],
      ['speedRange', initialSpeedRange],
    ];
    rangeKeys.forEach(([key, defaultRange]) => {
      const param = initialSearchParams[key]; 
      if (typeof param === 'string') {
        const parts = param.split(',').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          newFilters[key] = [parts[0], parts[1]];
        } else {
          newFilters[key] = defaultRange;
        }
      } else {
        newFilters[key] = defaultRange;
      }
    });

    setSelectedFilters(newFilters);
  }, [initialSearchParams]); 


  // Función para actualizar la URL con los filtros
  const updateUrlParams = useCallback((filters: SelectedFilters) => {
    const newSearchParams = new URLSearchParams();

    // Reconstruir todos los searchParams, incluyendo los que no son de filtro de scooter
    currentSearchParams.forEach((value, key) => {
        // No añadir los parámetros de scooter que vamos a redefinir
        if (!Object.keys(filters).includes(key)) {
            newSearchParams.append(key, value);
        }
    });


    // Añadir los parámetros de filtro de scooter
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (key.includes('Range')) {
          // Rangos: "min,max"
          // Solo añadir si el rango es diferente de los valores por defecto
          // Esto evita URLs muy largas con rangos por defecto
          const defaultRange = {
            autonomyRange: initialAutonomyRange,
            powerRange: initialPowerRange,
            voltageRange: initialVoltageRange,
            weightRange: initialWeightRange,
            speedRange: initialSpeedRange,
          }[key as keyof SelectedFilters]; // Ajusta esto para cada rango

          if (JSON.stringify(value) !== JSON.stringify(defaultRange)) {
            newSearchParams.set(key, (value as [number, number]).join(','));
          } else {
            newSearchParams.delete(key); // Eliminar si es el rango por defecto
          }
        } else {
          // Checkboxes: añadir cada valor individualmente
          (value as string[]).forEach(item => {
            newSearchParams.append(key, item);
          });
        }
      } else if (typeof value === 'string' && value) {
        newSearchParams.set(key, value);
      }
    });

    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  }, [pathname, currentSearchParams, router,
      initialAutonomyRange, initialPowerRange, initialVoltageRange,
      initialWeightRange, initialSpeedRange]); // Dependencias para la función useCallback


  // Handler para actualizar los filtros y luego la URL
  const handleFilterChange = (filters: SelectedFilters) => {
    setSelectedFilters(filters);
    updateUrlParams(filters);
  };

  // Función para limpiar todos los filtros y actualizar la URL
  const resetFilters = useCallback(() => {
    const defaultFilters: SelectedFilters = {
      dgt: [],
      motorType: [],
      hydraulicBrakes: [],
      tireSizes: [],
      gripTypes: [],
      tireTypes: [],
      autonomyRange: initialAutonomyRange,
      powerRange: initialPowerRange,
      voltageRange: initialVoltageRange,
      weightRange: initialWeightRange,
      speedRange: initialSpeedRange,
    };
    setSelectedFilters(defaultFilters);

    const newSearchParams = new URLSearchParams();
    // Mantener otros searchParams que no sean de filtro de scooter
    currentSearchParams.forEach((value, key) => {
        if (!Object.keys(defaultFilters).includes(key)) {
            newSearchParams.append(key, value);
        }
    });
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  }, [pathname, currentSearchParams, router,
      initialAutonomyRange, initialPowerRange, initialVoltageRange,
      initialWeightRange, initialSpeedRange]);


  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Filtros</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-ui-fg-interactive hover:underline"
        >
          Limpiar filtros
        </button>
      </div>
      <ScootersFilters
        selectedFilters={selectedFilters}
        setSelectedFilters={handleFilterChange} // Pasamos la función que también actualiza la URL
        allProducts={allProducts}
      />
    </>
  )
}

export default ScootersFiltersContainer