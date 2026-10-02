import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user || user.app_metadata?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
const body = await request.json()
const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
const name = typeof body.name === 'string' ? body.name.trim() : ''
const role = body.role === 'admin' || body.role === 'editor' ? body.role : 'viewer'
if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
if (!name) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!)
// needs_password marca que esta persona todavía no eligió su propia contraseña: el link de
// invitación la deja con una sesión activa pero sin clave, así que /auth/callback usa esta
// bandera para mandarla primero a /reset-password antes de dejarla entrar al panel.
const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: name, needs_password: true }, redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${new URL(request.url).origin}/auth/callback` })
if (error) return NextResponse.json({ error: error.message }, { status: 400 })
// El rol va en app_metadata (no en user_metadata) porque solo este endpoint, con la service role key,
// puede escribirlo. user_metadata lo puede editar el propio usuario desde el cliente con
// supabase.auth.updateUser(), así que guardar el rol ahí permitiría que cualquier invitado se
// autoasigne "admin".
if (invited.user) {
const { error: roleError } = await admin.auth.admin.updateUserById(invited.user.id, { app_metadata: { role } })
if (roleError) return NextResponse.json({ ok: true, role, warning: `La invitación se envió, pero no pudimos asignar el rol automáticamente: ${roleError.message}` })
}
return NextResponse.json({ ok: true, role })
}
