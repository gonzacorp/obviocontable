import { tipoPersonaDesdeCuit } from '@/lib/cuit'

export type Impuesto = 'autonomo' | 'muni' | 'iibb' | 'cm' | 'iva' | 'sicore'

export const IMPUESTOS: { key: Impuesto; label: string; short: string }[] = [
{ key: 'autonomo', label: 'Autónomo', short: 'Aut' },
{ key: 'muni', label: 'Municipal', short: 'Muni' },
{ key: 'iibb', label: 'Ingresos Brutos', short: 'IIBB' },
{ key: 'cm', label: 'Convenio Multilateral', short: 'CM' },
{ key: 'iva', label: 'IVA', short: 'IVA' },
{ key: 'sicore', label: 'SICORE', short: 'SICORE' },
]

// Solo las personas no jurídicas pueden presentar autónomos.
export function puedePresentarAutonomo(cuit: string): boolean {
return tipoPersonaDesdeCuit(cuit) !== 'juridica'
}

// Aplica las reglas: IIBB y CM son excluyentes (al marcar uno se saca el otro)
// y las empresas no presentan autónomos.
export function alternarImpuesto(actuales: Impuesto[], key: Impuesto, cuit: string): Impuesto[] {
if (actuales.includes(key)) return actuales.filter((k) => k !== key)
if (key === 'autonomo' && !puedePresentarAutonomo(cuit)) return actuales
let siguientes = [...actuales, key]
if (key === 'iibb') siguientes = siguientes.filter((k) => k !== 'cm')
if (key === 'cm') siguientes = siguientes.filter((k) => k !== 'iibb')
return siguientes
}

// Saca 'autonomo' si el CUIT pasó a ser de una empresa.
export function normalizarImpuestos(impuestos: Impuesto[], cuit: string): Impuesto[] {
return puedePresentarAutonomo(cuit) ? impuestos : impuestos.filter((k) => k !== 'autonomo')
}
