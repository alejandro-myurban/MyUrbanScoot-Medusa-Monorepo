// utils/filterHelpers.ts
export type Range = [number, number]

export const defaultRanges = {
  autonomyRange: [0, 200],
  powerRange: [0, 5000],
  voltageRange: [0, 100],
  weightRange: [0, 100],
  speedRange: [0, 120],
} as const

export const checkboxKeys = [
  "dgt",
  "motorType",
  "hydraulicBrakes",
  "tireSizes",
  "gripTypes",
  "tireTypes",
] as const

export type CheckboxKey = typeof checkboxKeys[number]
