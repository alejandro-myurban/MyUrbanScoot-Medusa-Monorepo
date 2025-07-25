"use client"

import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faBatteryFull,
  faRoad,
  faCogs,
  faShieldAlt,
  faTachometerAlt,
  faWeightHanging,
  faCircle,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons"
import type { HttpTypes } from "@medusajs/types"

export type StaticIconName =
  | "bateria"
  | "autonomia"
  | "neumaticos"
  | "motor"
  | "garantia"
  | "velocidad"
  | "peso"
  | "frenado"

export interface CharacteristicTemplate {
  key: string
  nombre: string
  icono: StaticIconName
  unidad?: string
}

interface ProductTechnicalSpecificationsProps {
  product: HttpTypes.StoreProduct
}

const iconMap: Record<StaticIconName, any> = {
  bateria: faBatteryFull,
  autonomia: faRoad,
  neumaticos: faCircle,
  motor: faCogs,
  garantia: faShieldAlt,
  velocidad: faTachometerAlt,
  peso: faWeightHanging,
  frenado: faCircle,
}

const defaultCharacteristics: CharacteristicTemplate[] = [
  { key: "battery_voltage_v", nombre: "Batería", icono: "bateria", unidad: "V" },
  { key: "autonomy_km", nombre: "Autonomía", icono: "autonomia", unidad: "km" },
  { key: "tire_size", nombre: "Neumáticos", icono: "neumaticos" },
  { key: "motor_power_w", nombre: "Potencia Motor", icono: "motor", unidad: "W" },
  { key: "warranty_months", nombre: "Garantía", icono: "garantia" },
  { key: "max_speed_kmh", nombre: "Velocidad Máxima", icono: "velocidad", unidad: "km/h" },
  { key: "weight_kg", nombre: "Peso", icono: "peso", unidad: "kg" },
  { key: "breakes_details", nombre: "Frenado", icono: "frenado" },
]

export const ProductTechnicalSpecifications: React.FC<ProductTechnicalSpecificationsProps> = ({ product }) => {
  const metadata = product.metadata as Record<string, any> || {}
  const mainTitle = "Características técnicas"

  const mappedCharacteristics = defaultCharacteristics.map((template) => {
    const raw = metadata[template.key]
    let displayValue = "N/A"

    if (template.key === "warranty_months") {
      if (raw === "3" || raw === 3) {
        displayValue = "3 años con el mejor servicio postventa"
      } else if (raw) {
        displayValue = `${raw} meses de garantía`
      }
    } else if (raw !== undefined && raw !== null && raw !== "") {
      displayValue = `${raw}${template.unidad || ""}`
    }

    return {
      ...template,
      displayValue,
    }
  })

  return (
    <section className="max-w-screen-large mx-auto p-6 sm:p-10 bg-white rounded-2xl mt-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-4xl font-black uppercase text-black/90 tracking-wide font-archivoBlack">
          {mainTitle}
        </h2>
        <p className="text-gray-600 font-archivo text-lg mt-2">de {product.title}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-8 gap-6">
        {mappedCharacteristics.map((char, idx) => {
          const Icon = iconMap[char.icono] || faInfoCircle

          return (
            <div
              key={idx}
              className="flex flex-col items-center justify-center rounded-xl p-4 text-center transition"
            >
              <FontAwesomeIcon icon={Icon} className="text-mysRed-100 w-8 h-8 mb-3" />
              <p className="text-sm text-gray-500 font-semibold uppercase font-archivo">{char.nombre}</p>
              <p className="text-base text-gray-800 font-archivo mt-1">{char.displayValue}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
