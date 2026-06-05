/**
 * Derive a usable display first name from an email when the backend has no
 * `first_name` field yet. "elena.marsh@example.com" → "Elena", "smoke@x" → "Smoke".
 */
export function deriveFirstNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const first = local.split(/[.+_-]/)[0] ?? ''
  if (first.length === 0) return ''
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}
