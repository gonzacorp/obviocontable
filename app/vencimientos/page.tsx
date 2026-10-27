'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getDisplayName, getInitials } from '@/lib/account'
import { IMPUESTOS, type Impuesto } from '@/lib/impuestos'
import { calendarioDesdeFilas, calendarioErrepar, tieneErrepar, type Calendario, type FilaVencimiento } from '@/lib/vencimientos'
import {
Bell,
CalendarClock,
CalendarDays,
ChevronDown,
ChevronLeft,
ChevronRight,
CircleHelp,
Clock3,
FileCheck2,
LayoutDashboard,
ListFilter,
LogOut,
MoreHorizontal,
PanelLeftClose,
RotateCcw,
Save,
Settings2,
Sparkles,
UsersRound,
} from 'lucide-react'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIGITOS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// Clave de una celda editada: impuesto, mes (0-11) y último dígito del CUIT.
const claveCelda = (tax: Impuesto, mes: number, digito: number) => `${tax}|${mes}|${digito}`

export default function VencimientosPage() {
const [accountName, setAccountName] = useState('')
const [userId, setUserId] = useState<string | null>(null)
useEffect(() => {
createClient().auth.getUser().then(({ data }) => {
if (!data.user) { window.location.replace('/login'); return }
setAccountName(getDisplayName(data.user))
setUserId(data.user.id)
})
}, [])

const [sidebarOpen, setSidebarOpen] = useState(true)
const [profileMenuOpen, setProfileMenuOpen] = useState(false)
const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false)
const profileMenuRef = useRef<HTMLDivElement>(null)
const sidebarMenuRef = useRef<HTMLDivElement>(null)
const accountInitials = getInitials(accountName) || 'U'

useEffect(() => {
function handleClickOutside(event: MouseEvent) {
if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setProfileMenuOpen(false)
if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(event.target as Node)) setSidebarMenuOpen(false)
}
document.addEventListener('mousedown', handleClickOutside)
return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])

const handleSignOut = async () => {
// scope: 'global' invalida la sesión en todos los dispositivos donde el usuario haya iniciado sesión, no solo en este navegador
await createClient().auth.signOut({ scope: 'global' })
window.location.href = '/login'
}

const [year, setYear] = useState(() => new Date().getFullYear())
const [tax, setTax] = useState<Impuesto>('iva')
const [saved, setSaved] = useState<Calendario>({})
const [edits, setEdits] = useState<Record<string, string>>({})
const [loading, setLoading] = useState(true)
const [loadError, setLoadError] = useState<string | null>(null)
const [saving, setSaving] = useState(false)
const [saveError, setSaveError] = useState<string | null>(null)
const [saveDone, setSaveDone] = useState(false)

useEffect(() => {
let cancelled = false
setLoading(true)
setLoadError(null)
createClient().from('tax_due_dates').select('year, month, tax, digit, day').eq('year', year).then(({ data, error }) => {
if (cancelled) return
if (error) setLoadError(error.message)
else setSaved(calendarioDesdeFilas((data ?? []) as FilaVencimiento[]))
setLoading(false)
})
return () => { cancelled = true }
}, [year])

const valorGuardado = (t: Impuesto, mes: number, digito: number) => String(saved[t]?.[mes]?.[digito] ?? '')
const valorCelda = (mes: number, digito: number) => edits[claveCelda(tax, mes, digito)] ?? valorGuardado(tax, mes, digito)

// Solo cuenta como cambio lo que difiere de lo guardado.
const cambios = useMemo(() => Object.entries(edits).filter(([clave, valor]) => {
const [t, mes, digito] = clave.split('|')
return valor.trim() !== valorGuardado(t as Impuesto, Number(mes), Number(digito))
}), [edits, saved])
const cambiosPorImpuesto = (t: Impuesto) => cambios.filter(([clave]) => clave.startsWith(`${t}|`)).length

function editar(mes: number, digito: number, valor: string) {
setSaveDone(false)
setEdits((prev) => ({ ...prev, [claveCelda(tax, mes, digito)]: valor.replace(/\D/g, '').slice(0, 2) }))
}

function cambiarAnio(delta: number) {
if (cambios.length && !window.confirm('Tenés cambios sin guardar. ¿Descartarlos y cambiar de año?')) return
setEdits({})
setSaveDone(false)
setYear((y) => y + delta)
}

function cargarErrepar() {
const errepar = calendarioErrepar(year)[tax]
if (!errepar) return
setSaveDone(false)
setEdits((prev) => {
const siguientes = { ...prev }
MESES.forEach((_, mes) => DIGITOS.forEach((digito) => { siguientes[claveCelda(tax, mes, digito)] = String(errepar[mes]?.[digito] ?? '') }))
return siguientes
})
}

async function guardar() {
setSaveError(null)
const upserts: FilaVencimiento[] = []
const borrar: { tax: Impuesto; month: number; digit: number }[] = []
for (const [clave, valor] of cambios) {
const [t, mesTxt, digitoTxt] = clave.split('|')
const mes = Number(mesTxt)
const digito = Number(digitoTxt)
if (!valor.trim()) { borrar.push({ tax: t as Impuesto, month: mes + 1, digit: digito }); continue }
const dia = Number(valor)
if (!dia || new Date(year, mes, dia).getMonth() !== mes) {
setSaveError(`${IMPUESTOS.find((i) => i.key === t)?.label}: el día ${valor} no existe en ${MESES[mes].toLowerCase()}.`)
return
}
upserts.push({ year, month: mes + 1, tax: t as Impuesto, digit: digito, day: dia })
}
setSaving(true)
const sb = createClient()
if (upserts.length) {
const { error } = await sb.from('tax_due_dates').upsert(upserts.map((f) => ({ ...f, updated_by: userId, updated_at: new Date().toISOString() })), { onConflict: 'year,month,tax,digit' })
if (error) { setSaveError(error.message); setSaving(false); return }
}
for (const f of borrar) {
const { error } = await sb.from('tax_due_dates').delete().eq('year', year).eq('tax', f.tax).eq('month', f.month).eq('digit', f.digit)
if (error) { setSaveError(error.message); setSaving(false); return }
}
const { data, error } = await sb.from('tax_due_dates').select('year, month, tax, digit, day').eq('year', year)
if (!error) setSaved(calendarioDesdeFilas((data ?? []) as FilaVencimiento[]))
setEdits({})
setSaving(false)
setSaveDone(true)
}

const impuestoActual = IMPUESTOS.find((i) => i.key === tax)!
const cargados = MESES.reduce((acc, _, mes) => acc + DIGITOS.filter((d) => valorGuardado(tax, mes, d)).length, 0)

return <main className="app-shell">
<aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
<div className="brand"><div className="brand-mark">O</div>{sidebarOpen && <><span className="brand-name">OBVIO</span><span className="brand-dot" /></>}</div>
<nav className="side-nav" aria-label="Navegación principal">
<p className="nav-caption">Workspace</p>
<Link href="/" className="nav-item"><LayoutDashboard size={18} /><span>Resumen</span></Link>
<button className="nav-item"><CalendarDays size={18} /><span>Presentaciones</span><span className="nav-badge">12</span></button>
<Link href="/vencimientos" className="nav-item active"><CalendarClock size={18} /><span>Vencimientos</span></Link>
<Link href="/clientes" className="nav-item"><UsersRound size={18} /><span>Clientes</span></Link>
<button className="nav-item"><Clock3 size={18} /><span>Actividad</span></button>
<p className="nav-caption space-top">Análisis</p>
<button className="nav-item"><FileCheck2 size={18} /><span>Estadísticas</span></button>
<button className="nav-item"><ListFilter size={18} /><span>Auditoría</span></button>
<p className="nav-caption space-top">Configuración</p>
<Link href="/preferencias" className="nav-item"><Settings2 size={18} /><span>Preferencias</span></Link>
</nav>
<div className="sidebar-bottom">
<div className="help-card"><CircleHelp size={18} /><div><strong>¿Necesitás ayuda?</strong><span>Visitá el centro de soporte</span></div></div>
<div className="user-mini-wrap" ref={sidebarMenuRef}>
<button className="user-mini" onClick={() => setSidebarMenuOpen((open) => !open)} aria-haspopup="true" aria-expanded={sidebarMenuOpen}>
<span className="user-avatar">{accountInitials}</span>{sidebarOpen && <div><strong>{accountName || 'Mi cuenta'}</strong><span>Contadora de impuestos</span></div>}<MoreHorizontal size={17} />
</button>
{sidebarMenuOpen && <div className="account-menu account-menu-up" role="menu">
<button className="account-menu-item" role="menuitem" onClick={handleSignOut}><LogOut size={15} /> Cerrar sesión</button>
</div>}
</div>
</div>
</aside>
<section className="main-content">
<header className="topbar">
<button className="icon-button menu-button" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Contraer menú"><PanelLeftClose size={19} /></button>
<div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>Vencimientos</strong></div>
<div className="top-actions">
<button className="icon-button"><Bell size={18} /><i /></button>
<button className="icon-button"><CircleHelp size={18} /></button>
<div className="profile-chip-wrap" ref={profileMenuRef}>
<button className="profile-chip" onClick={() => setProfileMenuOpen((open) => !open)} aria-haspopup="true" aria-expanded={profileMenuOpen}>
<span className="user-avatar small">{accountInitials}</span><span>{accountName || 'Mi cuenta'}</span><ChevronDown size={14} />
</button>
{profileMenuOpen && <div className="account-menu" role="menu">
<button className="account-menu-item" role="menuitem" onClick={handleSignOut}><LogOut size={15} /> Cerrar sesión</button>
</div>}
</div>
</div>
</header>
<div className="content-wrap">
<div className="page-heading">
<div><p className="eyebrow"><Sparkles size={13} /> Calendario impositivo</p><h1>Vencimientos<span>.</span></h1><p className="subtitle">Día de vencimiento de cada impuesto según la terminación del CUIT. El Resumen cruza estas fechas con tus clientes.</p></div>
<button className="primary-button" onClick={guardar} disabled={saving || cambios.length === 0}><Save size={17} /> {saving ? 'Guardando...' : cambios.length ? `Guardar ${cambios.length} ${cambios.length === 1 ? 'cambio' : 'cambios'}` : 'Guardar'}</button>
</div>

<div className="section-heading" style={{ marginTop: 29 }}>
<div className="tax-tabs" role="tablist" aria-label="Impuesto">{IMPUESTOS.map((imp) => { const n = cambiosPorImpuesto(imp.key); return <button key={imp.key} role="tab" aria-selected={tax === imp.key} className={`tax-tab ${tax === imp.key ? 'active' : ''}`} onClick={() => setTax(imp.key)}>{imp.label}{n > 0 && <small>{n} sin guardar</small>}</button> })}</div>
<div className="month-control"><button className="icon-button" onClick={() => cambiarAnio(-1)} aria-label="Año anterior"><ChevronLeft size={16} /></button><strong>{year}</strong><button className="icon-button" onClick={() => cambiarAnio(1)} aria-label="Año siguiente"><ChevronRight size={16} /></button></div>
</div>

{saveDone && <p className="form-success">Vencimientos guardados. Ya se reflejan en el Resumen.</p>}
{saveError && <p className="form-error">{saveError}</p>}
{loadError && <p className="form-error">No se pudo cargar el calendario: {loadError}</p>}

<div className="table-card">
<div className="table-scroll"><table className="due-table"><thead><tr><th>MES</th>{DIGITOS.map((d) => <th key={d} className="digit-col">CUIT …{d}</th>)}</tr></thead>
<tbody>{MESES.map((mes, m) => <tr key={mes}><td><strong style={{ fontSize: 13 }}>{mes}</strong></td>{DIGITOS.map((d) => { const valor = valorCelda(m, d); const cambiado = valor.trim() !== valorGuardado(tax, m, d); return <td key={d} style={{ textAlign: 'center' }}><input className={`day-input ${cambiado ? 'changed' : ''}`} inputMode="numeric" value={valor} disabled={loading} placeholder="—" aria-label={`${impuestoActual.label}, ${mes}, CUIT terminado en ${d}`} onChange={(e) => editar(m, d, e.target.value)} /></td> })}</tr>)}</tbody></table></div>
<div className="due-actions">
<p>{loading ? 'Cargando...' : `${impuestoActual.label} ${year}: ${cargados} de 120 fechas cargadas.`}{!tieneErrepar(year, tax) && ' Este impuesto no está en el calendario de Errepar: cargalo a mano.'}</p>
{tieneErrepar(year, tax) && <button className="button-outline" onClick={cargarErrepar} disabled={loading}><RotateCcw size={15} style={{ marginRight: 7 }} /> Cargar calendario Errepar {year}</button>}
</div>
</div>
</div>
</section>
</main>
}
