'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getDisplayName, getInitials } from '@/lib/account'
import {
Bell,
CalendarClock,
CalendarDays,
ChevronDown,
ChevronRight,
CircleHelp,
Clock3,
FileCheck2,
LayoutDashboard,
ListFilter,
LogOut,
KeyRound,
Mail,
MoreHorizontal,
PanelLeftClose,
Plus,
Settings2,
ShieldCheck,
Sparkles,
UserCircle2,
UsersRound,
X,
} from 'lucide-react'

type Role = 'admin' | 'editor' | 'viewer'

const ROLE_LABEL: Record<Role, string> = { admin: 'Administrador', editor: 'Editor', viewer: 'Solo lectura' }

type InviteForm = { name: string; email: string; role: Role }

const EMPTY_INVITE: InviteForm = { name: '', email: '', role: 'viewer' }

export default function PreferenciasPage() {
const [accountName, setAccountName] = useState('')
const [accountEmail, setAccountEmail] = useState('')
const [accountRole, setAccountRole] = useState<Role>('viewer')
useEffect(() => {
createClient().auth.getUser().then(({ data }) => {
if (!data.user) { window.location.replace('/login'); return }
setAccountName(getDisplayName(data.user))
setAccountEmail(data.user.email ?? '')
const role = data.user.app_metadata?.role
setAccountRole(role === 'admin' || role === 'editor' ? role : 'viewer')
})
}, [])

const [sidebarOpen, setSidebarOpen] = useState(true)
const [profileMenuOpen, setProfileMenuOpen] = useState(false)
const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false)
const profileMenuRef = useRef<HTMLDivElement>(null)
const sidebarMenuRef = useRef<HTMLDivElement>(null)
const accountInitials = getInitials(accountName) || 'U'
const isAdmin = accountRole === 'admin'

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

const [pwOpen, setPwOpen] = useState(false)
const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
const [pwSaving, setPwSaving] = useState(false)
const [pwError, setPwError] = useState<string | null>(null)
const [pwDone, setPwDone] = useState(false)

async function handleChangePassword(event: FormEvent) {
event.preventDefault()
setPwError(null)
if (pw.next.length < 8) { setPwError('La nueva contraseña debe tener al menos 8 caracteres.'); return }
if (pw.next !== pw.confirm) { setPwError('Las contraseñas nuevas no coinciden.'); return }
if (pw.next === pw.current) { setPwError('La nueva contraseña debe ser distinta a la actual.'); return }
setPwSaving(true)
const sb = createClient()
// Verifica la contraseña actual antes de cambiarla.
const { error: authError } = await sb.auth.signInWithPassword({ email: accountEmail, password: pw.current })
if (authError) { setPwError('La contraseña actual no es correcta.'); setPwSaving(false); return }
const { error } = await sb.auth.updateUser({ password: pw.next })
if (error) {
setPwError(error.code === 'same_password' ? 'La nueva contraseña debe ser distinta a la actual.' : error.code === 'weak_password' ? 'La contraseña es demasiado débil. Probá con una más larga.' : 'No pudimos cambiar la contraseña. Probá de nuevo.')
setPwSaving(false)
return
}
setPwSaving(false)
setPwOpen(false)
setPw({ current: '', next: '', confirm: '' })
setPwDone(true)
}

const [modalOpen, setModalOpen] = useState(false)
const [invite, setInvite] = useState<InviteForm>(EMPTY_INVITE)
const [sending, setSending] = useState(false)
const [formError, setFormError] = useState<string | null>(null)
const [lastInvited, setLastInvited] = useState<string | null>(null)
const [inviteWarning, setInviteWarning] = useState<string | null>(null)

async function handleInvite(event: FormEvent) {
event.preventDefault()
if (!invite.name.trim() || !invite.email.trim()) return
setSending(true)
setFormError(null)
try {
const response = await fetch('/api/admin/invite', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ name: invite.name.trim(), email: invite.email.trim(), role: invite.role }),
})
const body = await response.json().catch(() => ({}))
if (!response.ok) {
setFormError(body.error ?? 'No pudimos enviar la invitación.')
setSending(false)
return
}
setLastInvited(invite.email.trim())
setInviteWarning(typeof body.warning === 'string' ? body.warning : null)
setInvite(EMPTY_INVITE)
setModalOpen(false)
} catch {
setFormError('No pudimos enviar la invitación. Probá de nuevo.')
} finally {
setSending(false)
}
}

return <main className="app-shell">
<aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
<div className="brand"><div className="brand-mark">O</div>{sidebarOpen && <><span className="brand-name">OBVIO</span><span className="brand-dot" /></>}</div>
<nav className="side-nav" aria-label="Navegación principal">
<p className="nav-caption">Workspace</p>
<Link href="/" className="nav-item"><LayoutDashboard size={18} /><span>Resumen</span></Link>
<button className="nav-item"><CalendarDays size={18} /><span>Presentaciones</span><span className="nav-badge">12</span></button>
<Link href="/vencimientos" className="nav-item"><CalendarClock size={18} /><span>Vencimientos</span></Link>
<Link href="/clientes" className="nav-item"><UsersRound size={18} /><span>Clientes</span></Link>
<button className="nav-item"><Clock3 size={18} /><span>Actividad</span></button>
<p className="nav-caption space-top">Análisis</p>
<button className="nav-item"><FileCheck2 size={18} /><span>Estadísticas</span></button>
<button className="nav-item"><ListFilter size={18} /><span>Auditoría</span></button>
<p className="nav-caption space-top">Configuración</p>
<Link href="/preferencias" className="nav-item active"><Settings2 size={18} /><span>Preferencias</span></Link>
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
<div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>Preferencias</strong></div>
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
<div><p className="eyebrow"><Sparkles size={13} /> Configuración</p><h1>Preferencias<span>.</span></h1><p className="subtitle">Gestioná tu cuenta y quién tiene acceso a tu estudio.</p></div>
</div>

<div className="stats-grid" style={{ gridTemplateColumns: '1.1fr 1fr', marginBottom: 16 }}>
<div className="stat-card">
<div className="stat-top"><span className="stat-icon purple"><UserCircle2 size={17} /></span></div>
<p className="stat-label">Tu cuenta</p>
<p className="stat-value" style={{ fontSize: 19 }}>{accountName || 'Cargando...'}</p>
<p className="stat-detail" style={{ marginTop: 8 }}>{accountEmail}</p>
</div>
<div className="stat-card">
<div className="stat-top"><span className="stat-icon green"><ShieldCheck size={17} /></span></div>
<p className="stat-label">Rol</p>
<p className="stat-value" style={{ fontSize: 19 }}>{ROLE_LABEL[accountRole]}</p>
<p className="stat-detail" style={{ marginTop: 8 }}>{isAdmin ? 'Podés invitar y gestionar personas' : 'Un administrador gestiona los accesos'}</p>
</div>
</div>

<div className="table-card" style={{ padding: 19, marginBottom: 16 }}>
<div className="insight-head">
<div><p className="eyebrow">Seguridad</p><h3>Contraseña</h3></div>
<button className="button-outline" onClick={() => { setPw({ current: '', next: '', confirm: '' }); setPwError(null); setPwOpen(true) }}><KeyRound size={16} /> Cambiar contraseña</button>
</div>
{pwDone && <p className="form-success">Tu contraseña se cambió correctamente.</p>}
</div>

<div className="table-card" style={{ padding: 19 }}>
<div className="insight-head">
<div><p className="eyebrow">Equipo</p><h3>Personas con acceso</h3></div>
{isAdmin && <button className="primary-button" onClick={() => { setInvite(EMPTY_INVITE); setFormError(null); setModalOpen(true) }}><Plus size={17} /> Invitar persona</button>}
</div>
{lastInvited && <p className="form-success">Le enviamos una invitación a <strong>{lastInvited}</strong> para que cree su cuenta.</p>}
{inviteWarning && <p className="form-error">{inviteWarning}</p>}
{!isAdmin && <p className="drawer-muted" style={{ marginTop: 14 }}>Solo un administrador puede invitar nuevas personas al estudio.</p>}
</div>
</div>
</section>

{pwOpen && (
<div className="modal-overlay" onClick={() => !pwSaving && setPwOpen(false)}>
<div className="modal-card" onClick={(e) => e.stopPropagation()}>
<div className="drawer-head">
<div><h2>Cambiar contraseña</h2><p className="modal-subtitle">Ingresá tu contraseña actual y elegí una nueva.</p></div>
<button className="icon-button" onClick={() => setPwOpen(false)} aria-label="Cerrar"><X size={18} /></button>
</div>
<form onSubmit={handleChangePassword}>
<div className="form-field">
<label htmlFor="pw-current">Contraseña actual</label>
<input id="pw-current" type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
</div>
<div className="form-field">
<label htmlFor="pw-next">Nueva contraseña</label>
<input id="pw-next" type="password" required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
</div>
<div className="form-field">
<label htmlFor="pw-confirm">Repetir nueva contraseña</label>
<input id="pw-confirm" type="password" required minLength={8} autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
</div>
{pwError && <p className="form-error">{pwError}</p>}
<div className="form-actions">
<button type="button" className="button-outline" onClick={() => setPwOpen(false)} disabled={pwSaving}>Cancelar</button>
<button type="submit" className="primary-button" disabled={pwSaving} style={{ justifyContent: 'center' }}>{pwSaving ? 'Guardando...' : 'Guardar contraseña'}</button>
</div>
</form>
</div>
</div>
)}

{modalOpen && (
<div className="modal-overlay" onClick={() => !sending && setModalOpen(false)}>
<div className="modal-card" onClick={(e) => e.stopPropagation()}>
<div className="drawer-head">
<div><h2>Invitar persona</h2><p className="modal-subtitle">Le vamos a mandar un email para que elija su contraseña y entre a OBVIO.</p></div>
<button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Cerrar"><X size={18} /></button>
</div>
<form onSubmit={handleInvite}>
<div className="form-field">
<label htmlFor="invite-name">Nombre y apellido</label>
<input id="invite-name" required value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} placeholder="Ej: Ayrton Nacer" />
</div>
<div className="form-field">
<label htmlFor="invite-email">Email</label>
<div className="input-with-icon"><Mail size={16} /><input id="invite-email" type="email" required value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="nombre@estudio.com" /></div>
</div>
<div className="form-field">
<label htmlFor="invite-role">Rol</label>
<select id="invite-role" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as Role })}>
<option value="viewer">Solo lectura</option>
<option value="editor">Editor</option>
<option value="admin">Administrador</option>
</select>
</div>
{formError && <p className="form-error">{formError}</p>}
<div className="form-actions">
<button type="button" className="button-outline" onClick={() => setModalOpen(false)} disabled={sending}>Cancelar</button>
<button type="submit" className="primary-button" disabled={sending} style={{ justifyContent: 'center' }}>{sending ? 'Enviando...' : 'Enviar invitación'}</button>
</div>
</form>
</div>
</div>
)}
</main>
}
