'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, KeyRound, Mail, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function recoveryRedirectUrl() {
  const base = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`
  const url = new URL(base)
  url.searchParams.set('next', '/reset-password')
  return url.toString()
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: recoveryRedirectUrl() })
    setLoading(false)
    if (error && error.status === 429) {
      setError('Hiciste demasiados intentos. Esperá unos minutos y volvé a probar.')
      return
    }
    setSent(true)
  }

  return (
    <main className="login-shell">
      <section className="login-brand">
        <div className="login-brand-mark">O</div>
        <div><strong>OBVIO</strong><span>Gestión contable, sin vueltas.</span></div>
        <div className="login-message"><p>Recuperá tu acceso.</p><span>Te enviamos un enlace seguro para crear una nueva contraseña.</span></div>
      </section>
      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="mobile-brand"><span className="login-brand-mark">O</span><strong>OBVIO</strong></div>
          <div className="login-icon">{sent ? <MailCheck size={22} /> : <KeyRound size={22} />}</div>
          <p className="eyebrow">Recuperar contraseña</p>
          {sent ? (
            <>
              <h1>Revisá tu correo</h1>
              <p className="login-subtitle">Si <strong>{email}</strong> tiene una cuenta en OBVIO, vas a recibir un enlace para restablecer tu contraseña. Abrilo desde este mismo navegador.</p>
            </>
          ) : (
            <>
              <h1>¿Olvidaste tu contraseña?</h1>
              <p className="login-subtitle">Ingresá tu correo y te enviamos un enlace para crear una nueva.</p>
              <form onSubmit={handleSubmit}>
                <label>Correo electrónico
                  <div className="input-with-icon"><Mail size={18} /><input type="email" required autoComplete="email" placeholder="nombre@estudio.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                </label>
                {error && <p className="login-error" role="alert">{error}</p>}
                <button className="login-button" disabled={loading}>{loading ? 'Enviando…' : 'Enviar enlace'} {!loading && <ArrowRight size={18} />}</button>
              </form>
            </>
          )}
          <Link href="/login" className="login-back-link"><ArrowLeft size={16} /> Volver a ingresar</Link>
        </div>
      </section>
    </main>
  )
}
