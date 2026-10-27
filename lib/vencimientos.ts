import type { Impuesto } from '@/lib/impuestos'
import { limpiarCuit } from '@/lib/cuit'

// Calendario de vencimientos: día del mes según el último dígito del CUIT.
// Formato: calendario[impuesto][mes 0-11][ultimoDigito] = día del mes.
export type Calendario = Partial<Record<Impuesto, Record<number, Partial<Record<number, number>>>>>

// Fila de la tabla tax_due_dates en Supabase (month: 1-12).
export type FilaVencimiento = { year: number; month: number; tax: Impuesto; digit: number; day: number }

// Calendario Errepar 2026. Cada impuesto agrupa los dígitos del CUIT en rangos
// y para cada mes (enero a diciembre) da el día de vencimiento de cada rango.
// IIBB y Municipal no están en el calendario nacional: se cargan a mano.
const ERREPAR: Record<number, Partial<Record<Impuesto, { grupos: number[][]; dias: number[][] }>>> = {
2026: {
autonomo: {
grupos: [[0, 1, 2, 3], [4, 5, 6], [7, 8, 9]],
dias: [[5, 6, 7], [5, 6, 9], [5, 6, 9], [6, 7, 8], [5, 6, 7], [5, 8, 9], [6, 7, 8], [5, 6, 7], [7, 8, 9], [5, 6, 7], [5, 9, 10], [9, 10, 11]],
},
cm: {
grupos: [[0, 1, 2], [3, 4, 5], [6, 7], [8, 9]],
dias: [[15, 16, 19, 20], [13, 18, 19, 20], [13, 16, 17, 18], [15, 16, 17, 20], [15, 18, 19, 20], [16, 17, 18, 19], [15, 16, 17, 20], [14, 18, 19, 20], [15, 16, 17, 18], [15, 16, 19, 20], [13, 16, 17, 18], [15, 16, 17, 18]],
},
iva: {
grupos: [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]],
dias: [[19, 20, 21, 22, 23], [18, 19, 20, 23, 24], [18, 19, 20, 25, 26], [20, 21, 22, 23, 24], [18, 19, 20, 21, 22], [18, 19, 22, 23, 24], [20, 21, 22, 23, 24], [18, 19, 20, 21, 24], [18, 21, 22, 23, 24], [19, 20, 21, 22, 23], [18, 19, 20, 24, 25], [18, 21, 22, 23, 28]],
},
// SICORE: 2° quincena (DDJJ e ingreso del saldo).
sicore: {
grupos: [[0, 1, 2, 3], [4, 5, 6], [7, 8, 9]],
dias: [[9, 12, 13], [9, 10, 11], [9, 10, 11], [9, 10, 13], [11, 12, 13], [9, 10, 11], [13, 14, 15], [10, 11, 12], [9, 10, 11], [9, 13, 14], [9, 10, 11], [9, 10, 11]],
},
},
}

export function tieneErrepar(year: number, impuesto: Impuesto): boolean {
return Boolean(ERREPAR[year]?.[impuesto])
}

// Calendario Errepar del año (solo los impuestos que publica), vacío si no hay.
export function calendarioErrepar(year: number): Calendario {
const cal: Calendario = {}
for (const [imp, tabla] of Object.entries(ERREPAR[year] ?? {})) {
if (!tabla) continue
const meses: Record<number, Partial<Record<number, number>>> = {}
tabla.dias.forEach((dias, mes) => {
meses[mes] = {}
tabla.grupos.forEach((grupo, i) => grupo.forEach((digito) => { meses[mes][digito] = dias[i] }))
})
cal[imp as Impuesto] = meses
}
return cal
}

export function calendarioDesdeFilas(filas: FilaVencimiento[]): Calendario {
const cal: Calendario = {}
for (const f of filas) {
const meses = (cal[f.tax] ??= {})
;(meses[f.month - 1] ??= {})[f.digit] = f.day
}
return cal
}

export function ultimoDigitoCuit(cuit: string): number | null {
const digitos = limpiarCuit(cuit)
return digitos.length === 11 ? Number(digitos[10]) : null
}

// Devuelve la fecha de vencimiento del impuesto para el cliente en el mes dado
// (month: 0-11), o null si todavía no hay fecha cargada en el calendario.
export function fechaVencimiento(calendario: Calendario, impuesto: Impuesto, cuit: string, year: number, month: number): Date | null {
const digito = ultimoDigitoCuit(cuit)
if (digito === null) return null
const dia = calendario[impuesto]?.[month]?.[digito]
return dia ? new Date(year, month, dia) : null
}
