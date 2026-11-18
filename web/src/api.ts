// The only place the front end talks to the back end. Everything goes through /api.

export type Address = { street: string; city: string; province: string; country: string; zip: string; phone: string | null }

export type User = {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'customer' | 'admin'
  address: Address | null
  card: { name: string; last4: string; expiry: string } | null
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch('/api' + path, {
    method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
    headers: init.body === undefined ? undefined : { 'content-type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`)
  return data as T
}
