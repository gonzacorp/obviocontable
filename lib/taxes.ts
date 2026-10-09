export const TAXES = [
  { id: 'autonomos', label: 'Autónomos' },
  { id: 'muni', label: 'Muni' },
  { id: 'iibb', label: 'IIBB (Ingresos Brutos)', short: 'IIBB' },
  { id: 'cm', label: 'CM (Convenio Multilateral)', short: 'CM' },
  { id: 'iva', label: 'IVA' },
  { id: 'sicore', label: 'SICORE' },
] as const

export type TaxId = (typeof TAXES)[number]['id']

export function taxShortLabel(id: string) {
  const tax = TAXES.find((t) => t.id === id)
  if (!tax) return id
  return 'short' in tax ? tax.short : tax.label
}
