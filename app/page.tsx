'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDisplayName, getInitials } from '@/lib/account'
import Link from 'next/link'
import { tipoPersonaDesdeCuit, type TipoPersona } from '@/lib/cuit'
import { IMPUESTOS, type Impuesto } from '@/lib/impuestos'
import { fechaVencimiento } from '@/lib/vencimientos'
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
Filter,
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

type CellState = 'pending' | 'late' | 'muted'

type Client = {
id: string
name: string
cuit: string
initials: string
tone: string
person_type: TipoPersona
owner: string
taxes: Impuesto[]
}

const TONES = ['violet', 'gold', 'blue', 'pink', 'green', 'orange']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function toneForName(name: string) {
let hash = 0
for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
return TONES[hash % TONES.length]
}

function initialsForName(name: string) {
const parts = name.trim().split(/\s+/).filter(Boolean)
return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

function personaLabel(tipo: TipoPersona) {
return tipo === 'fisica' ? 'Persona física' : tipo === 'juridica' ? 'Empresa' : 'Revisar'
}

// Celda de un impuesto para un cliente en el mes dado. Autónomo no aplica a empresas.
function celda(client: Client, impuesto: Impuesto, year: number, month: number): { state: CellState; label: string } {
if (!client.taxes.includes(impuesto) || (impuesto === 'autonomo' && client.person_type === 'juridica')) return { state: 'muted', label: 'No aplica' }
const fecha = fechaVencimiento(impuesto, client.cuit, year, month)
if (!fecha) return { state: 'pending', label: 'Sin fecha' }
const hoy = new Date()
hoy.setHours(0, 0, 0, 0)
return { state: fecha < hoy ? 'late' : 'pending', label: `${String(fecha.getDate()).padStart(2, '0')} ${MESES_CORTO[month]}` }
}

const stateLabels: Record<CellState, string> = { pending: 'Pendiente', late: 'Vencido', muted: 'No aplica' }
function Avatar({ client }: { client: Client }) {
return <span className={`avatar avatar-${client.tone}`}>{client.initials}</span>
}

function StatCard({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) {
return <div className="stat-card"><div className="stat-top"><span className={`stat-icon ${color}`}>{icon}</span><span className="stat-detail">{detail}</span></div><p className="stat-label">{label}</p><p className="stat-value">{value}</p></div>
}

export default function Page() {
const [selected, setSelected] = useState<Client | null>(null)
const [accountName, setAccountName] = useState('')
useEffect(() => {
createClient().auth.getUser().then(({ data }) => {
if (!data.user) { window.location.replace('/login'); return }
setAccountName(getDisplayName(data.user))
})
}, [])
const [clients, setClients] = useState<Client[]>([])
const [loading, setLoading] = useState(true)
const [loadError, setLoadError] = useState<string | null>(null)
const [period, setPeriod] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })
useEffect(() => {
createClient().from('clients').select('id, name, cuit, owner, taxes, archived').eq('archived', false).order('name').then(({ data, error }) => {
if (error) setLoadError(error.message)
else setClients((data ?? []).map((c) => ({ id: c.id, name: c.name, cuit: c.cuit, initials: initialsForName(c.name), tone: toneForName(c.name), person_type: tipoPersonaDesdeCuit(c.cuit), owner: c.owner ?? '', taxes: (c.taxes ?? []) as Impuesto[] })))
setLoading(false)
})
}, [])
function shiftMonth(delta: number) {
setPeriod(({ year, month }) => { const d = new Date(year, month + delta, 1); return { year: d.getFullYear(), month: d.getMonth() } })
}
const owners = Array.from(new Set(clients.map((c) => c.owner).filter(Boolean)))
const [search, setSearch] = useState('')
const [filter, setFilter] = useState('Todos')
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

const filtered = clients.filter((client) => (client.name.toLowerCase().includes(search.toLowerCase()) || client.cuit.includes(search)) && (filter === 'Todos' || client.owner === filter))

return <main className="app-shell">
<aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
<div className="brand"><div className="brand-mark">O</div>{sidebarOpen && <><span className="brand-name">OBVIO</span><span className="brand-dot" /></>}</div>
<nav className="side-nav" aria-label="Navegación principal">
<p className="nav-caption">Workspace</p>
<Link href="/" className="nav-item active"><LayoutDashboard size={18} /><span>Resumen</span></Link>
<button className="nav-item"><CalendarDays size={18} /><span>Presentaciones</span><span className="nav-badge">12</span></button>
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
<div className="page-heading"><div><p className="eyebrow"><Sparkles size={13} /> Mi espacio de trabajo</p><h1>Buen día{firstName ? `, ${firstName}` : ''}<span>.</span></h1><p className="subtitle">Este es el estado de tus presentaciones para hoy.</p></div><button className="primary-button"><Plus size={17} /> Nueva presentación</button></div>
<div className="stats-grid"><StatCard icon={<FileCheck2 size={17} />} label="Presentaciones del mes" value="128" detail="+12% vs. mes anterior" color="purple" /><StatCard icon={<Clock3 size={17} />} label="En proceso" value="24" detail="8 requieren atención" color="yellow" /><StatCard icon={<Check size={18} />} label="Completadas" value="89" detail="69.5% del total" color="green" /><StatCard icon={<Bell size={17} />} label="Próximos vencimientos" value="15" detail="En los próximos 7 días" color="red" /></div>
<div className="section-heading"><div><h2>Presentaciones de {MESES[period.month]}</h2><p>Seguimiento de obligaciones impositivas de tu cartera.</p></div><div className="month-control"><button className="icon-button" onClick={() => shiftMonth(-1)} aria-label="Mes anterior"><ChevronLeft size={16} /></button><strong>{MESES[period.month].charAt(0).toUpperCase() + MESES[period.month].slice(1)} {period.year}</strong><button className="icon-button" onClick={() => shiftMonth(1)} aria-label="Mes siguiente"><ChevronRight size={16} /></button></div></div>
<div className="toolbar"><div className="search-box"><Search size={17} /><input placeholder="Buscar por cliente o CUIT..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="toolbar-actions"><button className="filter-button"><Filter size={16} /> Filtros <span>2</span></button><div className="select-wrap"><SlidersHorizontal size={16} /><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar responsable"><option>Todos</option>{owners.map((o) => <option key={o}>{o}</option>)}</select><ChevronDown size={15} /></div></div></div>
<div className="legend"><span><i className="dot pending" /> Pendiente</span><span><i className="dot late" /> Vencido</span><span><i className="dot muted" /> No aplica</span></div>
<div className="table-card"><div className="table-scroll"><table><thead><tr><th className="client-col">CLIENTE</th><th>TIPO</th><th>A CARGO</th>{IMPUESTOS.map((imp) => <th key={imp.key}>{imp.short}</th>)}<th aria-label="Acciones" /></tr></thead><tbody>{filtered.map((client) => <tr key={client.id}><td className="client-cell"><button onClick={() => setSelected(client)} className="client-button"><Avatar client={client} /><span><strong>{client.name}</strong><small>{client.cuit}</small></span></button></td><td><span className="type-pill" style={client.person_type === 'fisica' ? { color: '#4b91b9', background: '#e4f4ff' } : client.person_type === 'juridica' ? { color: '#8e69d0', background: '#eee9ff' } : { color: '#be9342', background: '#fff3d3' }}>{personaLabel(client.person_type)}</span></td><td>{client.owner ? <span className="owner"><span className="owner-dot">{client.owner.split(' ').map((x) => x[0]).join('')}</span>{client.owner}</span> : <span className="drawer-muted">Sin asignar</span>}</td>{IMPUESTOS.map((imp) => { const task = celda(client, imp.key, period.year, period.month); return <td key={imp.key}><button className={`task-cell ${task.state}`} onClick={() => setSelected(client)} title={stateLabels[task.state]}>{task.label}</button></td> })}<td><button className="row-more" aria-label={`Más opciones para ${client.name}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div>{loadError && <p className="form-error">No se pudieron cargar los clientes: {loadError}</p>}{!loading && filtered.length === 0 && !loadError && <div className="empty-state"><h3>No hay clientes para mostrar</h3><p>Cargá clientes desde la sección Clientes.</p></div>}<div className="table-footer"><span>Mostrando <strong>{filtered.length}</strong> de <strong>{clients.length} clientes</strong></span></div></div>
<div className="bottom-grid"><div className="insight-card"><div className="insight-head"><div><p className="eyebrow">Rendimiento del equipo</p><h3>Actividad semanal</h3></div><button className="small-select">Esta semana <ChevronDown size={14} /></button></div><div className="chart-area"><div className="chart-labels"><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div><div className="chart"><div className="grid-line one" /><div className="grid-line two" /><div className="grid-line three" /><div className="grid-line four" /><svg viewBox="0 0 600 150" preserveAspectRatio="none" aria-label="Gráfico de actividad semanal"><path d="M8 116 C52 90, 74 105, 110 90 S170 68, 205 90 S260 110, 300 76 S352 48, 390 69 S435 94, 470 57 S535 40, 592 20 L592 150 L8 150 Z" fill="url(#chartFill)" /><path d="M8 116 C52 90, 74 105, 110 90 S170 68, 205 90 S260 110, 300 76 S352 48, 390 69 S435 94, 470 57 S535 40, 592 20" fill="none" stroke="#9d8cff" strokeWidth="3" strokeLinecap="round" /><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b9adff" stopOpacity=".3" /><stop offset="1" stopColor="#b9adff" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-days"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span></div></div></div></div><div className="overdue-card"><div className="insight-head"><div><p className="eyebrow">Atención requerida</p><h3>Próximos vencimientos</h3></div><button className="arrow-link">Ver todos <ChevronRight size={14} /></button></div><div className="overdue-list"><div><span className="date-badge red">18<span>SEP</span></span><p><strong>IVA</strong><small>Comercial Norte S.A.</small></p><span className="risk high">En 2 días</span></div><div><span className="date-badge yellow">19<span>SEP</span></span><p><strong>IIBB</strong><small>Estancia La Aurora</small></p><span className="risk medium">En 3 días</span></div><div><span className="date-badge purple">21<span>SEP</span></span><p><strong>IVA</strong><small>Grupo Horizonte</small></p><span className="risk low">En 5 días</span></div></div></div></div>
</div>
</section>
{selected && <div className="drawer-overlay" onClick={() => setSelected(null)}><aside className="client-drawer" onClick={(e) => e.stopPropagation()}><div className="drawer-head"><span className="eyebrow">Ficha de cliente</span><button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar"><X size={18} /></button></div><div className="drawer-profile"><Avatar client={selected} /><div><h2>{selected.name}</h2><p>{selected.cuit}</p></div><span className="type-pill" style={{ color: '#8e69d0', background: '#eee9ff' }}>{personaLabel(selected.person_type)}</span></div><div className="drawer-section"><h4>Datos</h4><dl><div><dt>Responsable de impuestos</dt><dd>{selected.owner || 'Sin asignar'}</dd></div><div><dt>Impuestos que presenta</dt><dd>{IMPUESTOS.filter((i) => selected.taxes.includes(i.key)).map((i) => i.short).join(', ') || 'Ninguno'}</dd></div></dl></div><Link href="/clientes" className="secondary-button">Ir a Clientes <ChevronRight size={16} /></Link></aside></div>}
</main>
}
