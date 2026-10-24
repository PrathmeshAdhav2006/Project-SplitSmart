const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function readXsrfToken() {
  const cookie = document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='))
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null
}

async function request(path, options = {}) {
  const method = options.method || 'GET'
  const headers = { Accept: 'application/json', ...options.headers }
  if (options.body) headers['Content-Type'] = 'application/json'
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = readXsrfToken()
    if (token) headers['X-XSRF-TOKEN'] = token
  }
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, method, headers, credentials: 'include' })
  if (response.status === 204) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.message || 'The request could not be completed.')
    error.status = response.status
    error.fieldErrors = payload.fieldErrors || {}
    throw error
  }
  return payload
}

export const apiClient = {
  csrf: () => request('/api/auth/csrf'),
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),
  groups: () => request('/api/groups'),
  getDashboard: async () => {
    const groups = await request('/api/groups')
    const firstGroup = groups[0]
    if (!firstGroup) return { groups: [], recentExpenses: [], user: null }
    const [expenses, balances] = await Promise.all([
      request(`/api/groups/${firstGroup.id}/expenses`),
      request(`/api/groups/${firstGroup.id}/balances`),
    ])
    const currentUser = await request('/api/auth/me')
    const balance = balances.find((item) => item.userId === currentUser.user.id)
    return {
      groups: groups.map((group) => ({
        ...group,
        members: [],
        expenses: expenses,
        balance: {
          owed: balance && balance.netAmount < 0 ? String(Math.abs(balance.netAmount)) : '0.00',
          owedToYou: balance && balance.netAmount > 0 ? String(balance.netAmount) : '0.00',
          net: balance ? String(balance.netAmount) : '0.00',
        },
        suggestions: [],
        settlements: [],
      })),
      recentExpenses: expenses.slice(0, 3),
      user: currentUser.user,
    }
  },
  group: (id) => request(`/api/groups/${id}`),
  expenses: (groupId, category) => request(`/api/groups/${groupId}/expenses${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  createExpense: (groupId, body) => request(`/api/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(body) }),
  balances: (groupId) => request(`/api/groups/${groupId}/balances`),
  settlementSuggestions: (groupId) => request(`/api/groups/${groupId}/settlement-suggestions`),
  settlements: (groupId) => request(`/api/groups/${groupId}/settlements`),
}
