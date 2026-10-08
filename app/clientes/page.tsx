'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getDisplayName, getInitials } from '@/lib/account'
import {
Archive,
Bell,
CalendarDays,
ChevronDown,
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
RotateCcw,
Search,
Settings2,
Sparkles,
UsersRound,
X,
} from 'lucide-react'

type ClientRow = {
id: string
name: string
cuit: string
locality: string | null
email: string | null
phone: string | null
category: string | null
owner: string | null
accounting_owner: string | null
archived: boolean
archived_at: string | null
created_at: string
}

type FormState = {
name: string
cuit: string
locality: string
email: string
phone: string
category: string
owner: string
accounting_owner: string
}

const EMPTY_FORM: FormState = { name: '', cuit: '', locality: '', email: '', phone: '', category: '', owner: '', accounting_owner: '' }

const CATEGORIES = ['Agropecuarias', 'Comercial', 'Servicios', 'Industrial', 'Droguerías']
// Responsables del estudio. Editar acá para sumar o quitar gente.
const TAX_OWNERS = ['Nico G', 'Nico C']
const ACCOUNTING_OWNERS = ['Nico G', 'Nico C']

// Personas físicas: 20, 23, 24, 27. Personas jurídicas / empresas: 30, 33, 34.
type CuitKind = 'fisica' | 'juridica' | 'unknown'
function cuitKind(cuit: string): CuitKind {
const prefix = cuit.replace(/\D/g, '').slice(0, 2)
if (['20', '23', '24', '27'].includes(prefix)) return 'fisica'
if (['30', '33', '34'].includes(prefix)) return 'juridica'
return 'unknown'
}

function formatCuit(value: string) {
const d = value.replace(/\D/g, '').slice(0, 11)
if (d.length <= 2) return d
if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`
return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`
}
const TONES = ['violet', 'gold', 'blue', 'pink', 'green', 'orange']

function toneForName(name: string) {
let hash = 0
for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
return TONES[hash % TONES.length]
}

function initialsForName(name: string) {
const parts = name.trim().split(/\s+/).filter(Boolean)
const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
return initials.toUpperCase() || '?'
}

function formatDate(iso: string) {
try {
return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
} catch {
return iso
}
}

export default function ClientesPage() {
const [accountName, setAccountName] = useState('')
useEffect(() => {
createClient().auth.getUser().then(({ data }) => {
if (!data.user) { window.location.replace('/login'); return }
setAccountName(getDisplayName(data.user))
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

const [clients, setClients] = useState<ClientRow[]>([])
const [loading, setLoading] = useState(true)
const [loadError, setLoadError] = useState<string | null>(null)
const [search, setSearch] = useState('')
const [showArchived, setShowArchived] = useState(false)
const [confirmingId, setConfirmingId] = useState<string | null>(null)

const [modalOpen, setModalOpen] = useState(false)
const [form, setForm] = useState<FormState>(EMPTY_FORM)
const [creating, setCreating] = useState(false)
const [formError, setFormError] = useState<string | null>(null)

useEffect(() => {
let cancelled = false
async function load() {
setLoading(true)
setLoadError(null)
const sb = createClient()
const { data, error } = await sb.from('clients').select('*').order('created_at', { ascending: false })
if (cancelled) return
if (error) {
setLoadError(error.message)
} else {
setClients((data ?? []) as ClientRow[])
}
setLoading(false)
}
load()
return () => { cancelled = true }
}, [])

const kind = cuitKind(form.cuit)

const filtered = useMemo(() => {
const q = search.trim().toLowerCase()
return clients
.filter((c) => c.archived === showArchived)
.filter((c) => !q || c.name.toLowerCase().includes(q) || c.cuit.toLowerCase().includes(q) || (c.locality ?? '').toLowerCase().includes(q))
}, [clients, search, showArchived])

const activeCount = useMemo(() => clients.filter((c) => !c.archived).length, [clients])

async function handleCreate(e: React.FormEvent) {
e.preventDefault()
if (!form.name.trim() || !form.cuit.trim()) return
if (form.cuit.replace(/\D/g, '').length !== 11) { setFormError('El CUIT debe tener 11 dígitos.'); return }
setCreating(true)
setFormError(null)
const sb = createClient()
const { data: userData } = await sb.auth.getUser()
const { data, error } = await sb
.from('clients')
.insert({
name: form.name.trim(),
cuit: form.cuit.trim(),
locality: form.locality.trim() || null,
email: form.email.trim() || null,
phone: form.phone.trim() || null,
category: form.category || null,
owner: form.owner || null,
accounting_owner: kind === 'juridica' ? form.accounting_owner || null : null,
created_by: userData.user?.id ?? null,
})
.select()
.single()
if (error) {
setFormError(error.message)
setCreating(false)
return
}
setClients((prev) => [data as ClientRow, ...prev])
setCreating(false)
setModalOpen(false)
setForm(EMPTY_FORM)
}

async function handleArchive(id: string) {
const sb = createClient()
const { data, error } = await sb
.from('clients')
.update({ archived: true, archived_at: new Date().toISOString() })
.eq('id', id)
.select()
.single()
if (!error && data) setClients((prev) => prev.map((c) => (c.id === id ? (data as ClientRow) : c)))
setConfirmingId(null)
}

async function handleRestore(id: string) {
const sb = createClient()
const { data, error } = await sb
.from('clients')
.update({ archived: false, archived_at: null })
.eq('id', id)
.select()
.single()
if (!error && data) setClients((prev) => prev.map((c) => (c.id === id ? (data as ClientRow) : c)))
}

return <main className="app-shell">
<aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
<div className="brand"><div className="brand-mark">O</div>{sidebarOpen && <><span className="brand-name">OBVIO</span><span className="brand-dot" /></>}</div>
<nav className="side-nav" aria-label="Navegación principal">
<p className="nav-caption">Workspace</p>
<Link href="/" className="nav-item"><LayoutDashboard size={18} /><span>Resumen</span></Link>
<button className="nav-item"><CalendarDays size={18} /><span>Presentaciones</span><span className="nav-badge">12</span></button>
<Link href="/clientes" className="nav-item active"><UsersRound size={18} /><span>Clientes</span></Link>
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
<div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>Clientes</strong></div>
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
<div><p className="eyebrow"><Sparkles size={13} /> Cartera de clientes</p><h1>Clientes<span>.</span></h1><p className="subtitle">{loading ? 'Cargando...' : `${activeCount} ${activeCount === 1 ? 'cliente activo' : 'clientes activos'}`}</p></div>
<button className="primary-button" onClick={() => { setForm(EMPTY_FORM); setFormError(null); setModalOpen(true) }}><Plus size={17} /> Nuevo cliente</button>
</div>

<div className="toolbar">
<div className="search-box"><Search size={17} /><input placeholder="Buscar por cliente o CUIT..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
<div className="toolbar-actions">
<label className="archived-toggle">
<input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
Ver archivados
</label>
</div>
</div>

{loadError && <p className="form-error">No se pudieron cargar los clientes: {loadError}</p>}

<div className="table-card">
<div className="table-scroll">
<table>
<thead>
<tr>
<th className="client-col">CLIENTE</th>
<th>CATEGORÍA</th>
<th>LOCALIDAD</th>
<th>CONTACTO</th>
<th>A CARGO</th>
<th>CREADO</th>
<th aria-label="Acciones" />
</tr>
</thead>
<tbody>
{filtered.map((c) => (
<tr key={c.id}>
<td className="client-cell">
<span className="client-button">
<span className={`avatar avatar-${toneForName(c.name)}`}>{initialsForName(c.name)}</span>
<span><strong>{c.name}</strong><small>{c.cuit}</small></span>
</span>
</td>
<td>{c.category || <span className="drawer-muted">—</span>}</td>
<td>{c.locality || <span className="drawer-muted">—</span>}</td>
<td>{c.email || c.phone ? <span className="client-contact">{c.email}{c.email && c.phone && <br />}{c.phone}</span> : <span className="drawer-muted">—</span>}</td>
<td>{c.owner || c.accounting_owner ? <span style={{ display: 'grid', gap: 4 }}>
{c.owner && <span className="owner"><span className="owner-dot">{c.owner.split(' ').map((x) => x[0]).join('')}</span>{c.owner}<small className="drawer-muted"> · Impuestos</small></span>}
{c.accounting_owner && <span className="owner"><span className="owner-dot">{c.accounting_owner.split(' ').map((x) => x[0]).join('')}</span>{c.accounting_owner}<small className="drawer-muted"> · Contabilidad</small></span>}
</span> : <span className="drawer-muted">Sin asignar</span>}</td>
<td className="drawer-muted">{formatDate(c.created_at)}</td>
<td>
<div className="row-actions">
{c.archived ? (
<button className="link-muted" onClick={() => handleRestore(c.id)}><RotateCcw size={13} /> Restaurar</button>
) : confirmingId === c.id ? (
<span className="confirm-inline">¿Archivar?
<button className="confirm-yes" onClick={() => handleArchive(c.id)}>Sí</button>
<button className="confirm-no" onClick={() => setConfirmingId(null)}>No</button>
</span>
) : (
<button className="link-danger" onClick={() => setConfirmingId(c.id)}><Archive size={13} /> Archivar</button>
)}
</div>
</td>
</tr>
))}
</tbody>
</table>
</div>
{!loading && filtered.length === 0 && (
<div className="empty-state">
<UsersRound size={28} />
<h3>{showArchived ? 'No hay clientes archivados' : 'Todavía no cargaste clientes'}</h3>
<p>{showArchived ? 'Los clientes que archives van a aparecer acá.' : 'Empezá cargando el primer cliente del estudio.'}</p>
{!showArchived && <button className="primary-button" style={{ margin: '16px auto 0' }} onClick={() => { setForm(EMPTY_FORM); setFormError(null); setModalOpen(true) }}><Plus size={17} /> Nuevo cliente</button>}
</div>
)}
</div>
</div>
</section>

{modalOpen && (
<div className="modal-overlay" onClick={() => !creating && setModalOpen(false)}>
<div className="modal-card" onClick={(e) => e.stopPropagation()}>
<div className="drawer-head">
<div><h2>Nuevo cliente</h2><p className="modal-subtitle">Cargá los datos básicos del cliente.</p></div>
<button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Cerrar"><X size={18} /></button>
</div>
<form onSubmit={handleCreate}>
<div className="form-field">
<label htmlFor="client-name">Nombre / Razón social</label>
<input id="client-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Estudio Bianchi" />
</div>
<div className="form-field">
<label htmlFor="client-cuit">CUIT</label>
<input id="client-cuit" required inputMode="numeric" value={form.cuit} onChange={(e) => {
const cuit = formatCuit(e.target.value)
const k = cuitKind(cuit)
setForm({ ...form, cuit, accounting_owner: k === 'juridica' ? form.accounting_owner : '' })
}} placeholder="30-12345678-9" />
{kind === 'fisica' && <small className="drawer-muted">Persona física</small>}
{kind === 'juridica' && <small className="drawer-muted">Persona jurídica / empresa</small>}
</div>
<div className="form-field">
<label htmlFor="client-locality">Localidad</label>
<input id="client-locality" value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} placeholder="Ej: Rosario" />
</div>
<div className="form-field">
<label htmlFor="client-email">Email</label>
<input id="client-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="cliente@correo.com" />
</div>
<div className="form-field">
<label htmlFor="client-phone">Teléfono</label>
<input id="client-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ej: 341 555 1234" />
</div>
<div className="form-field">
<label htmlFor="client-category">Categoría</label>
<select id="client-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
<option value="">Sin categoría</option>
{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
</select>
</div>
{kind !== 'unknown' && <div className="form-field">
<label htmlFor="client-owner">A cargo de impuestos</label>
<select id="client-owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>
<option value="">Sin asignar</option>
{TAX_OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
</select>
</div>}
{kind === 'juridica' && <div className="form-field">
<label htmlFor="client-accounting">A cargo de contabilidad</label>
<select id="client-accounting" value={form.accounting_owner} onChange={(e) => setForm({ ...form, accounting_owner: e.target.value })}>
<option value="">Sin asignar</option>
{ACCOUNTING_OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
</select>
</div>}
{formError && <p className="form-error">{formError}</p>}
<div className="form-actions">
<button type="button" className="button-outline" onClick={() => setModalOpen(false)} disabled={creating}>Cancelar</button>
<button type="submit" className="primary-button" disabled={creating} style={{ justifyContent: 'center' }}>{creating ? 'Guardando...' : 'Crear cliente'}</button>
</div>
</form>
</div>
</div>
)}
</main>
}
