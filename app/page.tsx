'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDisplayName, getInitials } from '@/lib/account'
import { initialsForName, toneForName } from '@/lib/clients'
import Link from 'next/link'
import {
Bell,
CalendarDays,
Check,
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
Plus,
Search,
Settings2,
SlidersHorizontal,
Sparkles,
UsersRound,
X,
} from 'lucide-react'

type CellState = 'pending' | 'progress' | 'done' | 'late' | 'muted'
type FilingState = 'pending' | 'progress' | 'done' | 'muted'

type ClientRow = {
id: string
name: string
cuit: string
owner: string | null
email: string | null
phone: string | null
locality: string | null
archived: boolean
}

type Filing = { client_id: string; obligation: string; state: FilingState; due_date: string | null }

const taskColumns = ['Mon/Aut', 'Muni', 'IIBB', 'CM', 'IVA', 'Libro IVA', 'SICORE']

// Orden en que rota el estado al hacer clic en una celda.
const nextState: Record<FilingState, FilingState> = { pending: 'progress', progress: 'done', done: 'muted', muted: 'pending' }

const stateLabels: Record<CellState, string> = { pending: 'Pendiente', progress: 'En proceso', done: 'Completado', late: 'Vencido', muted: 'No aplica' }
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const pad = (n: number) => String(n).padStart(2, '0')
const periodKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const shortDate = (iso: string) => `${iso.slice(8, 10)} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`
const daysUntil = (iso: string) => Math.round((new Date(`${iso}T00:00:00`).getTime() - new Date(`${todayIso()}T00:00:00`).getTime()) / 86400000)

function Avatar({ name }: { name: string }) {
return <span className={`avatar avatar-${toneForName(name)}`}>{initialsForName(name)}</span>
}

function StatCard({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) {
return <div className="stat-card"><div className="stat-top"><span className={`stat-icon ${color}`}>{icon}</span><span className="stat-detail">{detail}</span></div><p className="stat-label">{label}</p><p className="stat-value">{value}</p></div>
}

export default function Page() {
const [selected, setSelected] = useState<ClientRow | null>(null)
const [accountName, setAccountName] = useState('')
useEffect(() => {
createClient().auth.getUser().then(({ data }) => {
if (!data.user) { window.location.replace('/login'); return }
setAccountName(getDisplayName(data.user))
})
}, [])
const [search, setSearch] = useState('')
const [filter, setFilter] = useState('Todos')
const [period, setPeriod] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
const [clients, setClients] = useState<ClientRow[]>([])
const [filings, setFilings] = useState<Filing[]>([])
const [loading, setLoading] = useState(true)
const [loadError, setLoadError] = useState<string | null>(null)
const period_key = periodKey(period)
const [sidebarOpen, setSidebarOpen] = useState(true)
const [profileMenuOpen, setProfileMenuOpen] = useState(false)
const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false)
const profileMenuRef = useRef<HTMLDivElement>(null)
const sidebarMenuRef = useRef<HTMLDivElement>(null)
const firstName = accountName.split(' ')[0] || ''
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

useEffect(() => {
let cancelled = false
async function load() {
setLoading(true)
setLoadError(null)
const sb = createClient()
const [c, f] = await Promise.all([
sb.from('clients').select('id,name,cuit,owner,email,phone,locality,archived').eq('archived', false).order('name'),
sb.from('tax_filings').select('client_id,obligation,state,due_date').eq('period', period_key),
])
if (cancelled) return
if (c.error || f.error) setLoadError((c.error ?? f.error)!.message)
else { setClients((c.data ?? []) as ClientRow[]); setFilings((f.data ?? []) as Filing[]) }
setLoading(false)
}
load()
return () => { cancelled = true }
}, [period_key])

const filingMap = useMemo(() => new Map(filings.map((f) => [`${f.client_id}|${f.obligation}`, f])), [filings])

function cellFor(clientId: string, obligation: string): { state: CellState; label: string; due: string | null } {
const f = filingMap.get(`${clientId}|${obligation}`)
const base: FilingState = f?.state ?? 'pending'
const due = f?.due_date ?? null
const late = due !== null && (base === 'pending' || base === 'progress') && due < todayIso()
const state: CellState = late ? 'late' : base
const label = state === 'muted' ? 'No aplica' : due ? shortDate(due) : stateLabels[state]
return { state, label, due }
}

async function cycleCell(client: ClientRow, obligation: string) {
const current = filingMap.get(`${client.id}|${obligation}`)
const state = nextState[current?.state ?? 'pending']
const prev = filings
const next: Filing = { client_id: client.id, obligation, state, due_date: current?.due_date ?? null }
setFilings((list) => [...list.filter((f) => !(f.client_id === client.id && f.obligation === obligation)), next])
const sb = createClient()
const { data: userData } = await sb.auth.getUser()
const { error } = await sb.from('tax_filings').upsert(
{ client_id: client.id, period: period_key, obligation, state, updated_by: userData.user?.id ?? null, updated_at: new Date().toISOString() },
{ onConflict: 'client_id,period,obligation' },
)
if (error) { setFilings(prev); setLoadError(error.message) }
}

function shiftPeriod(delta: number) { setPeriod((p) => new Date(p.getFullYear(), p.getMonth() + delta, 1)) }

const owners = useMemo(() => Array.from(new Set(clients.map((c) => c.owner?.trim()).filter((o): o is string => !!o))).sort(), [clients])
const q = search.trim().toLowerCase()
const filtered = clients.filter((client) => (!q || client.name.toLowerCase().includes(q) || client.cuit.toLowerCase().includes(q)) && (filter === 'Todos' || client.owner === filter))

const stats = useMemo(() => {
const s = { total: 0, progress: 0, done: 0, late: 0, soon: 0, pending: 0 }
const upcoming: { client: ClientRow; obligation: string; due: string }[] = []
for (const client of clients) for (const col of taskColumns) {
const { state, due } = cellFor(client.id, col)
if (state === 'muted') continue
s.total++
if (state === 'done') s.done++
else {
if (state === 'progress') s.progress++
if (state === 'late') s.late++
s.pending++
if (due && daysUntil(due) >= 0 && daysUntil(due) <= 7) { s.soon++ }
if (due) upcoming.push({ client, obligation: col, due })
}
}
upcoming.sort((a, b) => a.due.localeCompare(b.due))
return { ...s, upcoming: upcoming.slice(0, 3) }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [clients, filingMap])

const pct = (n: number) => (stats.total ? `${((n / stats.total) * 100).toFixed(1)}% del total` : 'Sin presentaciones')
const periodLabel = period.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
const monthName = period.toLocaleDateString('es-AR', { month: 'long' })
const selectedProgress = selected ? taskColumns.filter((c) => cellFor(selected.id, c).state === 'done').length : 0
const selectedApplicable = selected ? taskColumns.filter((c) => cellFor(selected.id, c).state !== 'muted').length : 0

return <main className="app-shell">
<aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
<div className="brand"><div className="brand-mark">O</div>{sidebarOpen && <><span className="brand-name">OBVIO</span><span className="brand-dot" /></>}</div>
<nav className="side-nav" aria-label="Navegación principal">
<p className="nav-caption">Workspace</p>
<Link href="/" className="nav-item active"><LayoutDashboard size={18} /><span>Resumen</span></Link>
<button className="nav-item"><CalendarDays size={18} /><span>Presentaciones</span>{stats.pending > 0 && <span className="nav-badge">{stats.pending}</span>}</button>
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
<div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>Resumen</strong></div>
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
<div className="page-heading"><div><p className="eyebrow"><Sparkles size={13} /> Mi espacio de trabajo</p><h1>Buen día{firstName ? `, ${firstName}` : ''}<span>.</span></h1><p className="subtitle">Este es el estado de las presentaciones de tus clientes.</p></div><Link href="/clientes" className="primary-button"><Plus size={17} /> Nuevo cliente</Link></div>
<div className="stats-grid"><StatCard icon={<FileCheck2 size={17} />} label="Presentaciones del mes" value={String(stats.total)} detail={`${clients.length} clientes activos`} color="purple" /><StatCard icon={<Clock3 size={17} />} label="En proceso" value={String(stats.progress)} detail={`${stats.pending} sin completar`} color="yellow" /><StatCard icon={<Check size={18} />} label="Completadas" value={String(stats.done)} detail={pct(stats.done)} color="green" /><StatCard icon={<Bell size={17} />} label="Vencidas / próximas" value={String(stats.late + stats.soon)} detail={`${stats.late} vencidas · ${stats.soon} en 7 días`} color="red" /></div>
<div className="section-heading"><div><h2 style={{ textTransform: 'capitalize' }}>Presentaciones de {monthName}</h2><p>Seguimiento de obligaciones impositivas de tu cartera. Hacé clic en una celda para cambiar su estado.</p></div><div className="month-control"><button className="icon-button" onClick={() => shiftPeriod(-1)} aria-label="Mes anterior"><ChevronLeft size={16} /></button><strong style={{ textTransform: 'capitalize' }}>{periodLabel}</strong><button className="icon-button" onClick={() => shiftPeriod(1)} aria-label="Mes siguiente"><ChevronRight size={16} /></button></div></div>
<div className="toolbar"><div className="search-box"><Search size={17} /><input placeholder="Buscar por cliente o CUIT..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="toolbar-actions"><div className="select-wrap"><SlidersHorizontal size={16} /><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar responsable"><option>Todos</option>{owners.map((o) => <option key={o}>{o}</option>)}</select><ChevronDown size={15} /></div></div></div>
<div className="legend"><span><i className="dot pending" /> Pendiente</span><span><i className="dot progress" /> En proceso</span><span><i className="dot done" /> Completado</span><span><i className="dot late" /> Vencido</span><span><i className="dot muted" /> No aplica</span></div>
{loadError && <p className="drawer-muted" role="alert" style={{ color: '#d36165' }}>No se pudo cargar o guardar: {loadError}</p>}
<div className="table-card"><div className="table-scroll"><table><thead><tr><th className="client-col">CLIENTE</th><th>A CARGO</th>{taskColumns.map((col) => <th key={col}>{col}</th>)}<th aria-label="Acciones" /></tr></thead><tbody>{loading ? <tr><td colSpan={taskColumns.length + 3} className="drawer-muted">Cargando clientes...</td></tr> : filtered.length === 0 ? <tr><td colSpan={taskColumns.length + 3} className="drawer-muted">{clients.length === 0 ? <>Todavía no hay clientes. <Link href="/clientes">Cargá el primero</Link> para empezar el seguimiento.</> : 'Ningún cliente coincide con la búsqueda.'}</td></tr> : filtered.map((client) => <tr key={client.id}><td className="client-cell"><button onClick={() => setSelected(client)} className="client-button"><Avatar name={client.name} /><span><strong>{client.name}</strong><small>{client.cuit}</small></span></button></td><td>{client.owner ? <span className="owner"><span className="owner-dot">{initialsForName(client.owner)}</span>{client.owner}</span> : <span className="owner">Sin asignar</span>}</td>{taskColumns.map((col) => { const task = cellFor(client.id, col); return <td key={col}><button className={`task-cell ${task.state}`} onClick={() => cycleCell(client, col)} title={`${stateLabels[task.state]} — clic para cambiar`}>{task.state === 'done' && <Check size={12} />}{task.label}</button></td> })}<td><button className="row-more" onClick={() => setSelected(client)} aria-label={`Más opciones para ${client.name}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div><div className="table-footer"><span>Mostrando <strong>{filtered.length}</strong> de <strong>{clients.length} clientes</strong></span></div></div>
<div className="bottom-grid"><div className="insight-card"><div className="insight-head"><div><p className="eyebrow">Rendimiento del equipo</p><h3>Avance por responsable</h3></div></div><div className="overdue-list">{owners.length === 0 && <p className="drawer-muted">Asigná responsables a tus clientes para ver el avance.</p>}{owners.map((owner) => { let done = 0, total = 0; for (const c of clients) if (c.owner === owner) for (const col of taskColumns) { const st = cellFor(c.id, col).state; if (st === 'muted') continue; total++; if (st === 'done') done++ } return <div key={owner}><p><strong>{owner}</strong><small>{done} de {total} presentaciones</small></p><div className="progress-line" style={{ width: 160 }}><span style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div></div> })}</div></div><div className="overdue-card"><div className="insight-head"><div><p className="eyebrow">Atención requerida</p><h3>Próximos vencimientos</h3></div></div><div className="overdue-list">{stats.upcoming.length === 0 && <p className="drawer-muted">No hay vencimientos con fecha cargada.</p>}{stats.upcoming.map((u) => { const d = daysUntil(u.due); const tone = d < 0 ? 'red' : d <= 3 ? 'yellow' : 'purple'; return <div key={`${u.client.id}${u.obligation}`}><span className={`date-badge ${tone}`}>{u.due.slice(8, 10)}<span>{MONTHS[Number(u.due.slice(5, 7)) - 1].toUpperCase()}</span></span><p><strong>{u.obligation}</strong><small>{u.client.name}</small></p><span className={`risk ${d < 0 ? 'high' : d <= 3 ? 'medium' : 'low'}`}>{d < 0 ? `Vencido hace ${-d} d` : d === 0 ? 'Hoy' : `En ${d} días`}</span></div> })}</div></div></div>
</div>
</section>
{selected && <div className="drawer-overlay" onClick={() => setSelected(null)}><aside className="client-drawer" onClick={(e) => e.stopPropagation()}><div className="drawer-head"><span className="eyebrow">Ficha de cliente</span><button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar"><X size={18} /></button></div><div className="drawer-profile"><Avatar name={selected.name} /><div><h2>{selected.name}</h2><p>{selected.cuit}</p></div></div><div className="drawer-section"><h4>Información de contacto</h4><dl><div><dt>Responsable de impuestos</dt><dd>{selected.owner || '—'}</dd></div><div><dt>Localidad</dt><dd>{selected.locality || '—'}</dd></div><div><dt>Email</dt><dd>{selected.email || '—'}</dd></div><div><dt>Teléfono</dt><dd>{selected.phone || '—'}</dd></div></dl></div><div className="drawer-section"><h4 style={{ textTransform: 'capitalize' }}>Avance de {monthName}</h4><div className="progress-line"><span style={{ width: `${selectedApplicable ? (selectedProgress / selectedApplicable) * 100 : 0}%` }} /></div><p className="drawer-muted">{selectedProgress} de {selectedApplicable} presentaciones completadas</p></div><Link href="/clientes" className="secondary-button">Ver en clientes <ChevronRight size={16} /></Link></aside></div>}
</main>
}
