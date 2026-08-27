const base = (process.env.APP_URL || '').replace(/\/$/, '')
if (!base) throw new Error('Set APP_URL, for example https://pm.example.com')
const cookie = { value: '' }
const request = async (path, options = {}) => {
  const response = await fetch(`${base}/api/v1${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(cookie.value ? { Cookie: cookie.value } : {}), ...(options.headers || {}) }, redirect: 'manual' })
  const setCookie = response.headers.get('set-cookie'); if (setCookie) cookie.value = setCookie.split(';')[0]
  const payload = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(`${path}: ${response.status} ${JSON.stringify(payload)}`)
  return payload
}
await request('/health/live')
await request('/health/ready')
await request('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'admin', password: 'admin' }) })
await request('/dashboard')
await request('/auth/logout', { method: 'POST' })
console.log('Smoke test passed')
