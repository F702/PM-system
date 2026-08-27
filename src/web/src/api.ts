import { ref } from 'vue'

export class ApiError extends Error { constructor(public readonly status: number, message: string) { super(message) } }
export type CurrentUser = { id: string; username: string; role: 'DEMO' | 'USER' }
export const session = {
  user: ref<CurrentUser | null>(null),
  restored: false,
  get isDemo() { return this.user.value?.role === 'DEMO' },
  reset() { this.user.value = null; this.restored = true },
  async restore() { if (this.restored) return this.user.value; try { const result = await get<{ user: CurrentUser }>('/auth/me', { quiet401: true }); this.user.value = result.user } catch { this.user.value = null } this.restored = true; return this.user.value },
  async logout() { try { await post('/auth/logout', undefined) } finally { this.reset() } }
}

type RequestOptions = RequestInit & { quiet401?: boolean }
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { quiet401, ...init } = options
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  let response: Response
  try { response = await fetch(`/api/v1${path}`, { ...init, headers, credentials: 'include' }) } catch { throw new ApiError(0, '网络连接失败，请检查网络后重试') }
  const payload = await response.json().catch(() => ({})) as { message?: string | string[] }
  if (!response.ok) { const message = Array.isArray(payload.message) ? payload.message[0] : payload.message || '请求失败，请稍后重试'; if (response.status === 401 && !quiet401) session.reset(); throw new ApiError(response.status, message) }
  return payload as T
}
export const get = <T>(path: string, options: RequestOptions = {}) => request<T>(path, { ...options, method: 'GET' })
export const post = <T>(path: string, body?: unknown, options: RequestOptions = {}) => request<T>(path, { ...options, method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
export const patch = <T>(path: string, body: unknown, options: RequestOptions = {}) => request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) })
