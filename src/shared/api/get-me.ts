import { apiClient } from './client'
import type { User } from './user'

/** Single in-flight promise dedupe — when patient + medical-record fire on the
 * same tick, only one POST /auth/me request hits the wire. */
let inFlight: Promise<User> | null = null

export function getMe(): Promise<User> {
  if (inFlight) return inFlight
  inFlight = apiClient.post<User>('/auth/me').finally(() => {
    // Clear after the microtask completes so the next call hits the network.
    queueMicrotask(() => {
      inFlight = null
    })
  })
  return inFlight
}
