import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_NEXT = new Set(['/', '/reset-password'])

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const cookieStore = await cookies()
  const isRecovery = cookieStore.get('obvio_recovery')?.value === '1'
  const nextParam = isRecovery ? '/reset-password' : (searchParams.get('next') ?? '/')
  const next = ALLOWED_NEXT.has(nextParam) ? nextParam : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`)
      if (isRecovery) response.cookies.set('obvio_recovery', '', { path: '/', maxAge: 0 })
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`)
}
