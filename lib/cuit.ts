export type TipoPersona = 'fisica' | 'juridica' | 'revisar'

// Deja solo los dígitos de un CUIT, sin guiones ni espacios.
export function limpiarCuit(cuit: string): string {
return (cuit ?? '').replace(/\D/g, '')
}

// Da formato XX-XXXXXXXX-X a medida que se escribe (para el input).
export function formatearCuit(valor: string): string {
const digitos = limpiarCuit(valor).slice(0, 11)
const p1 = digitos.slice(0, 2)
const p2 = digitos.slice(2, 10)
const p3 = digitos.slice(10, 11)
if (digitos.length <= 2) return p1
if (digitos.length <= 10) return p2 ? `${p1}-${p2}` : p1
return `${p1}-${p2}-${p3}`
}

// Valida el dígito verificador de un CUIT según el algoritmo de AFIP
// (módulo 11). Acepta el CUIT con o sin guiones.
export function esCuitValido(cuit: string): boolean {
const digitos = limpiarCuit(cuit)
if (digitos.length !== 11) return false

const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
const suma = multiplicadores.reduce((acc, mult, i) => acc + mult * Number(digitos[i]), 0)

const resto = suma % 11
let verificador = 11 - resto
if (verificador === 11) verificador = 0
if (verificador === 10) return false

return verificador === Number(digitos[10])
}

// Deriva el tipo de persona a partir de los dos primeros dígitos del
// CUIT. Reemplaza al viejo campo "Tipo" (A/B/C): el prefijo del CUIT
// es lo que define si el proceso del cliente sigue en Contabilidad.
//  - 'fisica'   -> el proceso empieza y muere en Impuestos
//  - 'juridica' -> el proceso empieza en Impuestos y sigue en Contabilidad
//  - 'revisar'  -> prefijo atípico (CUIL u otro): cargar igual y revisar a mano
export function tipoPersonaDesdeCuit(cuit: string): TipoPersona {
const digitos = limpiarCuit(cuit)
if (digitos.length < 2) return 'revisar'
const prefijo = digitos.slice(0, 2)

if (['20', '23', '24', '27'].includes(prefijo)) return 'fisica'
if (['30', '33', '34'].includes(prefijo)) return 'juridica'
return 'revisar'
}
