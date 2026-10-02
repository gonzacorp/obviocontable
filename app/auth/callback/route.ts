import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_NEXT = new Set(['/', '/reset-password'])

export async function GET(request: Request) {
const { searchParams, origin } = new URL(request.url)
const code = searchParams.get('code')
const cookieStore = await cookies()
const isRecovery = cookieStore.get('obvio_recovery')?.value === '1'

if (code) {
const supabase = await createClient()
const { error } = await supabase.auth.exchangeCodeForSession(code)
if (!error) {
// Una persona recién invitada llega acá con sesión activa pero sin contraseña propia
// (el link de invitación la autentica solo). needs_password, guardado en user_metadata
// al invitarla, nos avisa para mandarla primero a elegir su clave.
const { data: { user } } = await supabase.auth.getUser()
const needsPassword = isRecovery || user?.user_metadata?.needs_password === true
const nextParam = needsPassword ? '/reset-password' : (searchParams.get('next') ?? '/')
const next = ALLOWED_NEXT.has(nextParam) ? nextParam : '/'
const response = NextResponse.redirect(`${origin}${next}`)
if (isRecovery) response.cookies.set('obvio_recovery', '', { path: '/', maxAge: 0 })
return response
}
}

return NextResponse.redirect(`${origin}/login?error=link`)
}
