// components/product/ProductTechnicalSpecifications.tsx
"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBatteryFull,
    faRoad,
    faCogs,
    faShieldAlt, // Usado para "Garantía"
    faTachometerAlt,
    faWeightHanging,
    faCircle, // Para neumáticos y frenado, como en tu primer ejemplo
    faInfoCircle, // Fallback genérico para iconos no encontrados
} from '@fortawesome/free-solid-svg-icons';
import { HttpTypes } from '@medusajs/types';

export type StaticIconName =
    | "bateria"
    | "autonomia"
    | "neumaticos"
    | "motor"
    | "garantia"
    | "velocidad"
    | "peso"
    | "frenado";

export interface CharacteristicTemplate {
    key: string;
    nombre: string;
    icono: StaticIconName;
    unidad?: string;
}

interface ProductTechnicalSpecificationsProps {
    product: HttpTypes.StoreProduct;
}

const fontAwesomeIconMap: { [key: string]: any } = {
    "bateria": faBatteryFull,
    "autonomia": faRoad,
    "neumaticos": faCircle, // Usamos faCircle como en tu primera imagen
    "motor": faCogs,
    "garantia": faShieldAlt, // Mantenemos faShieldAlt
    "velocidad": faTachometerAlt,
    "peso": faWeightHanging,
    "frenado": faCircle, // Usamos faCircle como en tu primera imagen
};

const defaultCharacteristics: CharacteristicTemplate[] = [
    { key: "battery_voltage_v", nombre: "BATERÍA", icono: "bateria", unidad: "V" },
    { key: "autonomy_km", nombre: "AUTONOMÍA", icono: "autonomia", unidad: "km" },
    { key: "tire_size", nombre: "NEUMÁTICOS", icono: "neumaticos", unidad: "" },
    { key: "motor_power_w", nombre: "POTENCIA MOTOR", icono: "motor", unidad: "W" },
    { key: "warranty_months", nombre: "GARANTÍA", icono: "garantia", unidad: "" },
    { key: "max_speed_kmh", nombre: "VELOCIDAD MÁXIMA", icono: "velocidad", unidad: "km/h" },
    { key: "weight_kg", nombre: "PESO", icono: "peso", unidad: "kg" },
    { key: "breakes_details", nombre: "FRENADO", icono: "frenado", unidad: "" },
];

export const ProductTechnicalSpecifications: React.FC<ProductTechnicalSpecificationsProps> = ({ product }) => {
    const m = product.metadata as Record<string, any> || {};
    console.log("DEBUG DE LA METADATA EN PRODUCT SPEC:", m);

    const mainTitle = "Características técnicas";

    const characteristicsMapped = defaultCharacteristics.map(template => {
        const valueFromMetadata = m[template.key];

        let displayValue: string | null = null;
        let valueForFilter: any = valueFromMetadata;

        if (template.key === "warranty_months") {
            if (valueFromMetadata === 3 || valueFromMetadata === "3") {
                displayValue = "3 años con el mejor servicio postventa";
            } else if (valueFromMetadata !== undefined && valueFromMetadata !== null && valueFromMetadata !== "") {
                displayValue = `${valueFromMetadata} meses de garantía`;
            }
            valueForFilter = displayValue;
        } else if (template.key === "breakes_details") {
            displayValue = valueFromMetadata ? String(valueFromMetadata) : null;
            valueForFilter = displayValue;
        } else if (valueFromMetadata !== undefined && valueFromMetadata !== null && valueFromMetadata !== "") {
            displayValue = String(valueFromMetadata);
        }

        return {
            ...template,
            value: valueForFilter,
            displayValue: displayValue !== null ? `${displayValue}${template.unidad || ''}` : "N/A"
        };
    });

    console.log("DEBUG: characteristicsMapped ANTES del filtro:", characteristicsMapped);

    const characteristicsToDisplay = characteristicsMapped.filter(char =>
        char.value !== undefined &&
        char.value !== null &&
        char.value !== "" &&
        char.displayValue !== "N/A"
    );

    console.log("DEBUG: characteristicsToDisplay DESPUÉS del filtro:", characteristicsToDisplay);

    if (characteristicsToDisplay.length === 0) {
        return null;
    }

    return (
        <div className="bg-gray-50 lg:bg-white p-6 py-8 lg:py-6 rounded-lg max-w-4xl mx-auto lg:mt-32 md:px-8 lg:px-10">
            <div className="flex flex-col items-center mb-8 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-black/90 uppercase font-archivoBlack mb-1">
                    {mainTitle}
                </h2>
                <h3 className="text-gray-700 font-archivo">
                    de {product.title}
                </h3>
            </div>

            {/* Grid: 1 columna (móvil) → 2 columnas (sm) → 4 columnas (md+) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-6 gap-6 sm:gap-8 md:gap-10">
                {characteristicsToDisplay.map((char, index) => {
                    const IconComponentToRender = fontAwesomeIconMap[char.icono]
                        ? <FontAwesomeIcon icon={fontAwesomeIconMap[char.icono]} className="text-mysRed-100 w-10 h-10 mb-2" />
                        : <FontAwesomeIcon icon={faInfoCircle} className="text-gray-400 w-10 h-10 mb-2" />;

                    return (
                        <div key={index} className="flex flex-col items-center text-center p-2">
                            {IconComponentToRender}
                            {/* Nombre de la característica */}
                            <p className="text-sm font-semibold font-archivo uppercase text-gray-800 mb-1 break-words">
                                {char.nombre}
                            </p>
                            {/* Valor de la característica */}
                            <p className="text-base text-gray-700 font-archivo break-words">
                                {char.displayValue}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};