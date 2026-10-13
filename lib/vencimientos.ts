import type { Impuesto } from '@/lib/impuestos'
import { limpiarCuit } from '@/lib/cuit'

// Tabla de vencimientos: día del mes según el último dígito del CUIT.
// Pendiente de cargar con la tabla definitiva (por ahora está vacía).
// Formato: VENCIMIENTOS[impuesto][ultimoDigito] = día del mes.
export const VENCIMIENTOS: Partial<Record<Impuesto, Partial<Record<number, number>>>> = {}

export function ultimoDigitoCuit(cuit: string): number | null {
const digitos = limpiarCuit(cuit)
return digitos.length === 11 ? Number(digitos[10]) : null
}

// Devuelve la fecha de vencimiento del impuesto para el cliente en el mes dado
// (month: 0-11), o null si todavía no hay fecha cargada en la tabla.
export function fechaVencimiento(impuesto: Impuesto, cuit: string, year: number, month: number): Date | null {
const digito = ultimoDigitoCuit(cuit)
if (digito === null) return null
const dia = VENCIMIENTOS[impuesto]?.[digito]
return dia ? new Date(year, month, dia) : null
}
