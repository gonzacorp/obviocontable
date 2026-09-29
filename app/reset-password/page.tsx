'use client'

import { FormEvent, useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    const { error } = await createClient().auth.updateUser({ password })
    if (error) {
      setError(error.code === 'same_password' ? 'La nueva contraseña debe ser distinta a la anterior.' : error.code === 'weak_password' ? 'La contraseña es demasiado débil. Probá con una más larga.' : 'No pudimos guardar la contraseña. El enlace puede haber vencido; pedí uno nuevo.')
      setLoading(false)
      return
    }
    window.location.replace('/')
  }

  return (
    <main className="login-shell">
      <section className="login-brand">
        <div className="login-brand-mark">O</div>
        <div><strong>OBVIO</strong><span>Gestión contable, sin vueltas.</span></div>
        <div className="login-message"><p>Una nueva contraseña.</p><span>Elegí una clave segura que solo vos conozcas.</span></div>
      </section>
      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="mobile-brand"><span className="login-brand-mark">O</span><strong>OBVIO</strong></div>
          <div className="login-icon"><LockKeyhole size={22} /></div>
          <p className="eyebrow">Restablecer contraseña</p>
          <h1>Creá tu contraseña</h1>
          <p className="login-subtitle">Usá al menos 8 caracteres. La vas a usar para ingresar a OBVIO.</p>
          <form onSubmit={handleSubmit}>
            <label>Nueva contraseña
              <div className="input-with-icon"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            </label>
            <label>Repetir contraseña
              <div className="input-with-icon"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" placeholder="Repetí la contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
            </label>
            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="login-button" disabled={loading}>{loading ? 'Guardando…' : 'Guardar y entrar'} {!loading && <ArrowRight size={18} />}</button>
          </form>
          <div className="login-footer"><ShieldCheck size={15} /><span>Conexión protegida por Supabase Auth</span></div>
        </div>
      </section>
    </main>
  )
}
