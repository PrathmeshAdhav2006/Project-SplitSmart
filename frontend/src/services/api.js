const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
let csrfToken

const cookie = (name) => document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))?.split('=')[1]

async function getCsrf() {
  if (csrfToken) return csrfToken
  try {
    const response = await fetch(`${API}/api/csrf`, { credentials: 'include' })
    if (response.ok) {
      const body = await response.json().catch(() => ({}))
      csrfToken = body.token || body.csrfToken || cookie('XSRF-TOKEN') || cookie('XSRF-TOKEN'.toLowerCase())
    }
  } catch { /* requests will still work with cookie-based CSRF configurations */ }
  return csrfToken || cookie('XSRF-TOKEN')
}

async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = { Accept: 'application/json', ...(options.headers || {}) }
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await getCsrf()
    if (token) { headers['X-CSRF-TOKEN'] = token; headers['X-XSRF-TOKEN'] = token }
  }
  const response = await fetch(`${API}${path}`, { ...options, method, headers, credentials: 'include' })
  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || data.error || `Request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return data
}

export const authApi = {
  me: () => request('/api/auth/me'),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/api/auth/logout', { method: 'POST' })
}
export const taskApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value))
    return request(`/api/tasks${params.toString() ? `?${params}` : ''}`)
  },
  stats: () => request('/api/tasks/stats'),
  create: (task) => request('/api/tasks', { method: 'POST', body: JSON.stringify(task) }),
  update: (id, task) => request(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(task) }),
  remove: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
  status: (id, status) => request(`/api/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
}
