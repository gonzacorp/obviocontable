const TONES = ['violet', 'gold', 'blue', 'pink', 'green', 'orange']

export function toneForName(name: string) {
let hash = 0
for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
return TONES[hash % TONES.length]
}

export function initialsForName(name: string) {
const parts = name.trim().split(/\s+/).filter(Boolean)
const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
return initials.toUpperCase() || '?'
}
