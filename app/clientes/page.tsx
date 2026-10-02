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
type: 'A' | 'B' | 'C'
owner: string
exercise: string
archived: boolean
archived_at: string | null
created_at: string
}

type FormState = { name: string; cuit: string; type: 'A' | 'B' | 'C'; owner: string; exercise: string }

const EMPTY_FORM: FormState = { name: '', cuit: '', type: 'B', owner: '', exercise: '' }
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

const filtered = useMemo(() => {
const q = search.trim().toLowerCase()
return clients
.filter((c) => c.archived === showArchived)
.filter((c) => !q || c.name.toLowerCase().includes(q) || c.cuit.toLowerCase().includes(q))
}, [clients, search, showArchived])

const activeCount = useMemo(() => clients.filter((c) => !c.archived).length, [clients])

async function handleCreate(e: React.FormEvent) {
e.preventDefault()
if (!form.name.trim() || !form.cuit.trim()) return
setCreating(true)
setFormError(null)
const sb = createClient()
const { data: userData } = await sb.auth.getUser()
const { data, error } = await sb
.from('clients')
.insert({
name: form.name.trim(),
cuit: form.cuit.trim(),
type: form.type,
owner: form.owner.trim(),
exercise: form.exercise.trim(),
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
<th>TIPO</th>
<th>A CARGO</th>
<th>EJERCICIO</th>
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
<td><span className={`type-pill type-${c.type.toLowerCase()}`}>{c.type}</span></td>
<td>{c.owner ? <span className="owner"><span className="owner-dot">{c.owner.split(' ').map((x) => x[0]).join('')}</span>{c.owner}</span> : <span className="drawer-muted">Sin asignar</span>}</td>
<td>{c.exercise || <span className="drawer-muted">—</span>}</td>
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
<input id="client-cuit" required value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} placeholder="30-12345678-9" />
</div>
<div className="form-field">
<label htmlFor="client-type">Tipo</label>
<select id="client-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FormState['type'] })}>
<option value="A">A</option>
<option value="B">B</option>
<option value="C">C</option>
</select>
</div>
<div className="form-field">
<label htmlFor="client-owner">A cargo de</label>
<input id="client-owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Ej: Mariana S." />
</div>
<div className="form-field">
<label htmlFor="client-exercise">Ejercicio</label>
<input id="client-exercise" value={form.exercise} onChange={(e) => setForm({ ...form, exercise: e.target.value })} placeholder="Ej: Junio" />
</div>
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
