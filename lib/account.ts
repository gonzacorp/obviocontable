type AccountUser = { email?: string | null; user_metadata?: Record<string, unknown> | null } | null | undefined

export function getDisplayName(user: AccountUser): string {
const meta = user?.user_metadata ?? {}
const fromMeta = (meta.full_name ?? meta.name) as string | undefined
if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim()
const emailName = typeof user?.email === 'string' ? user.email.split('@')[0] : ''
if (!emailName) return ''
return emailName.replace(/[._-]+/g, ' ').trim().split(' ').filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function getInitials(name: string): string {
const parts = name.trim().split(/\s+/).filter(Boolean)
if (parts.length === 0) return ''
if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
return (parts[0][0] + parts[1][0]).toUpperCase()
}
