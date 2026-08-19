const base = '/api/v1'
export const session = { get token() { return localStorage.getItem('pm-token') || '' }, set token(value: string) { localStorage.setItem('pm-token', value) }, clear() { localStorage.removeItem('pm-token') } }
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> { const response = await fetch(`${base}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}), ...options.headers } }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(Array.isArray(payload.message) ? payload.message[0] : payload.message || '请求失败，请稍后重试。'); return payload as T }
export const get = <T>(path: string) => api<T>(path)
export const post = <T>(path: string, body: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body) })
export const patch = <T>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
