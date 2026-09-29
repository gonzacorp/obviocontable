'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

type CellState = 'pending' | 'progress' | 'done' | 'late' | 'muted'

type Task = { state: CellState; label: string }
type Client = {
  id: string
  name: string
  cuit: string
  initials: string
  tone: string
  type: 'A' | 'B' | 'C'
  owner: string
  exercise: string
  tasks: Record<string, Task>
}

const taskColumns = ['Mon/Aut', 'Muni', 'IIBB', 'CM', 'IVA', 'Libro IVA', 'SICORE']

const clients: Client[] = [
  { id: '1', name: 'Estancia La Aurora', cuit: '30-71234567-8', initials: 'EA', tone: 'violet', type: 'C', owner: 'Mariana S.', exercise: 'Junio', tasks: { 'Mon/Aut': { state: 'done', label: '07 Sep' }, Muni: { state: 'progress', label: '10 Sep' }, IIBB: { state: 'pending', label: '12 Sep' }, CM: { state: 'pending', label: '15 Sep' }, IVA: { state: 'pending', label: '18 Sep' }, 'Libro IVA': { state: 'muted', label: 'No aplica' }, SICORE: { state: 'pending', label: '09 Sep' } } },
  { id: '2', name: 'Comercial Norte S.A.', cuit: '30-70987654-1', initials: 'CN', tone: 'gold', type: 'B', owner: 'Sofía R.', exercise: 'Diciembre', tasks: { 'Mon/Aut': { state: 'progress', label: '07 Sep' }, Muni: { state: 'done', label: '09 Sep' }, IIBB: { state: 'done', label: '12 Sep' }, CM: { state: 'pending', label: '15 Sep' }, IVA: { state: 'late', label: '18 Sep' }, 'Libro IVA': { state: 'pending', label: '18 Sep' }, SICORE: { state: 'pending', label: '09 Sep' } } },
  { id: '3', name: 'Estudio Bianchi', cuit: '27-33445566-9', initials: 'EB', tone: 'blue', type: 'C', owner: 'Mariana S.', exercise: 'Marzo', tasks: { 'Mon/Aut': { state: 'done', label: '07 Sep' }, Muni: { state: 'muted', label: 'Exento' }, IIBB: { state: 'progress', label: '12 Sep' }, CM: { state: 'pending', label: '15 Sep' }, IVA: { state: 'pending', label: '18 Sep' }, 'Libro IVA': { state: 'pending', label: '18 Sep' }, SICORE: { state: 'done', label: '09 Sep' } } },
  { id: '4', name: 'Grupo Horizonte', cuit: '30-71654321-2', initials: 'GH', tone: 'pink', type: 'B', owner: 'Sofía R.', exercise: 'Diciembre', tasks: { 'Mon/Aut': { state: 'pending', label: '07 Sep' }, Muni: { state: 'pending', label: '10 Sep' }, IIBB: { state: 'pending', label: '12 Sep' }, CM: { state: 'pending', label: '15 Sep' }, IVA: { state: 'pending', label: '21 Sep' }, 'Libro IVA': { state: 'pending', label: '21 Sep' }, SICORE: { state: 'pending', label: '09 Sep' } } },
  { id: '5', name: 'Librería Central', cuit: '27-29887766-4', initials: 'LC', tone: 'green', type: 'B', owner: 'Mariana S.', exercise: 'Enero', tasks: { 'Mon/Aut': { state: 'done', label: '07 Sep' }, Muni: { state: 'done', label: '10 Sep' }, IIBB: { state: 'progress', label: '12 Sep' }, CM: { state: 'muted', label: 'No aplica' }, IVA: { state: 'done', label: '18 Sep' }, 'Libro IVA': { state: 'done', label: '18 Sep' }, SICORE: { state: 'muted', label: 'No aplica' } } },
  { id: '6', name: 'Constructora del Sur', cuit: '30-72345678-5', initials: 'CS', tone: 'orange', type: 'C', owner: 'Sofía R.', exercise: 'Septiembre', tasks: { 'Mon/Aut': { state: 'pending', label: '07 Sep' }, Muni: { state: 'late', label: '10 Sep' }, IIBB: { state: 'pending', label: '12 Sep' }, CM: { state: 'pending', label: '15 Sep' }, IVA: { state: 'pending', label: '21 Sep' }, 'Libro IVA': { state: 'pending', label: '21 Sep' }, SICORE: { state: 'pending', label: '09 Sep' } } },
]

const stateLabels: Record<CellState, string> = { pending: 'Pendiente', progress: 'En proceso', done: 'Completado', late: 'Vencido', muted: 'No aplica' }
function Avatar({ client }: { client: Client }) {
  return <span className={`avatar avatar-${client.tone}`}>{client.initials}</span>
}

function StatCard({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) {
  return <div className="stat-card"><div className="stat-top"><span className={`stat-icon ${color}`}>{icon}</span><span className="stat-detail">{detail}</span></div><p className="stat-label">{label}</p><p className="stat-value">{value}</p></div>
}

export default function Page() {
  const [selected, setSelected] = useState<Client | null>(null)
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => { if (!data.user) window.location.replace('/login') })
  }, [])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const sidebarMenuRef = useRef<HTMLDivElement>(null)

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

  const filtered = clients.filter((client) => client.name.toLowerCase().includes(search.toLowerCase()) && (filter === 'Todos' || client.owner === filter))

  return <main className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
      <div className="brand"><div className="brand-mark">O</div>{sidebarOpen && <><span className="brand-name">OBVIO</span><span className="brand-dot" /></>}</div>
      <nav className="side-nav" aria-label="Navegación principal">
        <p className="nav-caption">Workspace</p>
        <button className="nav-item active"><LayoutDashboard size={18} /><span>Resumen</span></button>
        <button className="nav-item"><CalendarDays size={18} /><span>Presentaciones</span><span className="nav-badge">12</span></button>
        <button className="nav-item"><UsersRound size={18} /><span>Clientes</span></button>
        <button className="nav-item"><Clock3 size={18} /><span>Actividad</span></button>
        <p className="nav-caption space-top">Análisis</p>
        <button className="nav-item"><FileCheck2 size={18} /><span>Estadísticas</span></button>
        <button className="nav-item"><ListFilter size={18} /><span>Auditoría</span></button>
        <p className="nav-caption space-top">Configuración</p>
        <button className="nav-item"><Settings2 size={18} /><span>Preferencias</span></button>
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card"><CircleHelp size={18} /><div><strong>¿Necesitás ayuda?</strong><span>Visitá el centro de soporte</span></div></div>
        <div className="user-mini-wrap" ref={sidebarMenuRef}>
          <button className="user-mini" onClick={() => setSidebarMenuOpen((open) => !open)} aria-haspopup="true" aria-expanded={sidebarMenuOpen}>
            <span className="user-avatar">MS</span>{sidebarOpen && <div><strong>Mariana Soto</strong><span>Contadora de impuestos</span></div>}<MoreHorizontal size={17} />
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
              <span className="user-avatar small">MS</span><span>Mariana Soto</span><ChevronDown size={14} />
            </button>
            {profileMenuOpen && <div className="account-menu" role="menu">
              <button className="account-menu-item" role="menuitem" onClick={handleSignOut}><LogOut size={15} /> Cerrar sesión</button>
            </div>}
          </div>
        </div>
      </header>
      <div className="content-wrap">
        <div className="page-heading"><div><p className="eyebrow"><Sparkles size={13} /> Mi espacio de trabajo</p><h1>Buen día, Mariana<span>.</span></h1><p className="subtitle">Este es el estado de tus presentaciones para hoy.</p></div><button className="primary-button"><Plus size={17} /> Nueva presentación</button></div>
        <div className="stats-grid"><StatCard icon={<FileCheck2 size={17} />} label="Presentaciones del mes" value="128" detail="+12% vs. mes anterior" color="purple" /><StatCard icon={<Clock3 size={17} />} label="En proceso" value="24" detail="8 requieren atención" color="yellow" /><StatCard icon={<Check size={18} />} label="Completadas" value="89" detail="69.5% del total" color="green" /><StatCard icon={<Bell size={17} />} label="Próximos vencimientos" value="15" detail="En los próximos 7 días" color="red" /></div>
        <div className="section-heading"><div><h2>Presentaciones de septiembre</h2><p>Seguimiento de obligaciones impositivas de tu cartera.</p></div><div className="month-control"><button className="icon-button"><ChevronLeft size={16} /></button><strong>Septiembre 2026</strong><button className="icon-button"><ChevronRight size={16} /></button></div></div>
        <div className="toolbar"><div className="search-box"><Search size={17} /><input placeholder="Buscar por cliente o CUIT..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="toolbar-actions"><button className="filter-button"><Filter size={16} /> Filtros <span>2</span></button><div className="select-wrap"><SlidersHorizontal size={16} /><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar responsable"><option>Todos</option><option>Mariana S.</option><option>Sofía R.</option></select><ChevronDown size={15} /></div></div></div>
        <div className="legend"><span><i className="dot pending" /> Pendiente</span><span><i className="dot progress" /> En proceso</span><span><i className="dot done" /> Completado</span><span><i className="dot late" /> Vencido</span><span><i className="dot muted" /> No aplica</span><span className="legend-note">Actualizado hace 3 min</span></div>
        <div className="table-card"><div className="table-scroll"><table><thead><tr><th className="client-col">CLIENTE</th><th>TIPO</th><th>A CARGO</th>{taskColumns.map((col) => <th key={col}>{col}</th>)}<th aria-label="Acciones" /></tr></thead><tbody>{filtered.map((client) => <tr key={client.id}><td className="client-cell"><button onClick={() => setSelected(client)} className="client-button"><Avatar client={client} /><span><strong>{client.name}</strong><small>{client.cuit}</small></span></button></td><td><span className={`type-pill type-${client.type.toLowerCase()}`}>{client.type}</span></td><td><span className="owner"><span className="owner-dot">{client.owner.split(' ').map((x) => x[0]).join('')}</span>{client.owner}</span></td>{taskColumns.map((col) => { const task = client.tasks[col]; return <td key={col}><button className={`task-cell ${task.state}`} onClick={() => setSelected(client)} title={stateLabels[task.state]}>{task.state === 'done' && <Check size={12} />}{task.label}</button></td> })}<td><button className="row-more" aria-label={`Más opciones para ${client.name}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div><div className="table-footer"><span>Mostrando <strong>{filtered.length}</strong> de <strong>45 clientes</strong></span><div className="pagination"><button className="icon-button"><ChevronLeft size={15} /></button><button className="page-current">1</button><button>2</button><button>3</button><span>...</span><button>5</button><button className="icon-button"><ChevronRight size={15} /></button></div></div></div>
        <div className="bottom-grid"><div className="insight-card"><div className="insight-head"><div><p className="eyebrow">Rendimiento del equipo</p><h3>Actividad semanal</h3></div><button className="small-select">Esta semana <ChevronDown size={14} /></button></div><div className="chart-area"><div className="chart-labels"><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div><div className="chart"><div className="grid-line one" /><div className="grid-line two" /><div className="grid-line three" /><div className="grid-line four" /><svg viewBox="0 0 600 150" preserveAspectRatio="none" aria-label="Gráfico de actividad semanal"><path d="M8 116 C52 90, 74 105, 110 90 S170 68, 205 90 S260 110, 300 76 S352 48, 390 69 S435 94, 470 57 S535 40, 592 20 L592 150 L8 150 Z" fill="url(#chartFill)" /><path d="M8 116 C52 90, 74 105, 110 90 S170 68, 205 90 S260 110, 300 76 S352 48, 390 69 S435 94, 470 57 S535 40, 592 20" fill="none" stroke="#9d8cff" strokeWidth="3" strokeLinecap="round" /><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b9adff" stopOpacity=".3" /><stop offset="1" stopColor="#b9adff" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-days"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span></div></div></div></div><div className="overdue-card"><div className="insight-head"><div><p className="eyebrow">Atención requerida</p><h3>Próximos vencimientos</h3></div><button className="arrow-link">Ver todos <ChevronRight size={14} /></button></div><div className="overdue-list"><div><span className="date-badge red">18<span>SEP</span></span><p><strong>IVA</strong><small>Comercial Norte S.A.</small></p><span className="risk high">En 2 días</span></div><div><span className="date-badge yellow">19<span>SEP</span></span><p><strong>IIBB</strong><small>Estancia La Aurora</small></p><span className="risk medium">En 3 días</span></div><div><span className="date-badge purple">21<span>SEP</span></span><p><strong>IVA</strong><small>Grupo Horizonte</small></p><span className="risk low">En 5 días</span></div></div></div></div>
      </div>
    </section>
    {selected && <div className="drawer-overlay" onClick={() => setSelected(null)}><aside className="client-drawer" onClick={(e) => e.stopPropagation()}><div className="drawer-head"><span className="eyebrow">Ficha de cliente</span><button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar"><X size={18} /></button></div><div className="drawer-profile"><Avatar client={selected} /><div><h2>{selected.name}</h2><p>{selected.cuit}</p></div><span className={`type-pill type-${selected.type.toLowerCase()}`}>Tipo {selected.type}</span></div><div className="drawer-status"><span>Estado del período</span><strong><i className="dot progress" /> En seguimiento</strong></div><div className="drawer-section"><h4>Información de contacto</h4><dl><div><dt>Responsable de impuestos</dt><dd>{selected.owner}</dd></div><div><dt>Canal preferido</dt><dd>WhatsApp</dd></div><div><dt>Teléfono</dt><dd>+54 9 11 4567-8921</dd></div><div><dt>Entrega habitual</dt><dd>PDF y descarga ARCA</dd></div></dl></div><div className="drawer-section"><h4>Avance de septiembre</h4><div className="progress-line"><span style={{ width: '58%' }} /></div><p className="drawer-muted">4 de 7 presentaciones completadas</p></div><button className="secondary-button">Ver ficha completa <ChevronRight size={16} /></button></aside></div>}
  </main>
}
