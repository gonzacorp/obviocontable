'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => { if (data.user) window.location.replace('/') })
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) { setError('El correo o la contraseña no son correctos.'); setLoading(false); return }
    window.location.replace('/')
  }

  return <main className="login-shell"><section className="login-brand"><div className="login-brand-mark">O</div><div><strong>OBVIO</strong><span>Gestión contable, sin vueltas.</span></div><div className="login-message"><p>Todo tu estudio en un solo lugar.</p><span>Presentaciones, clientes y equipo bajo control.</span></div></section><section className="login-panel"><div className="login-form-wrap"><div className="mobile-brand"><span className="login-brand-mark">O</span><strong>OBVIO</strong></div><div className="login-icon"><LockKeyhole size={22} /></div><p className="eyebrow">Acceso seguro</p><h1>Ingresá a tu espacio</h1><p className="login-subtitle">Usá tus credenciales para continuar gestionando tu estudio.</p><form onSubmit={handleSubmit}><label>Correo electrónico<div className="input-with-icon"><Mail size={18} /><input type="email" required autoComplete="email" placeholder="nombre@estudio.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div></label><label>Contraseña<div className="input-with-icon"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" placeholder="Ingresá tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="login-button" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'} {!loading && <ArrowRight size={18} />}</button></form><div className="login-footer"><ShieldCheck size={15} /><span>Conexión protegida por Supabase Auth</span></div></div></section></main>
}
