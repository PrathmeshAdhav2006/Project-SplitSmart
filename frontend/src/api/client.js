const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const asMoney = (value) => Number(value || 0).toFixed(2)
const initials = (name) => (name || '?').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
const colors = ['violet', 'blue', 'amber', 'green']

function normalizeExpense(expense) {
  return {
    ...expense,
    title: expense.description,
    date: expense.expenseDate,
    amount: asMoney(expense.amount),
    payer: expense.payerName || `Member ${expense.payerId}`,
    participants: expense.participants || 0,
  }
}

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
    const [expenses, balances, members, suggestions, settlements, currentUser] = await Promise.all([
      request(`/api/groups/${firstGroup.id}/expenses`),
      request(`/api/groups/${firstGroup.id}/balances`),
      request(`/api/groups/${firstGroup.id}/members`),
      request(`/api/groups/${firstGroup.id}/settlement-suggestions`),
      request(`/api/groups/${firstGroup.id}/settlements`),
      request('/api/auth/me'),
    ])
    const balance = balances.find((item) => item.userId === currentUser.user.id)
    const normalizedExpenses = expenses.map(normalizeExpense)
    return {
      groups: groups.map((group) => ({
        ...group,
        members: members.map((member, index) => ({
          ...member,
          id: `u${member.userId}`,
          name: member.fullName,
          initials: initials(member.fullName),
          color: colors[index % colors.length],
        })),
        expenses: normalizedExpenses,
        balance: {
          owed: balance && Number(balance.netAmount) < 0 ? asMoney(Math.abs(Number(balance.netAmount))) : '0.00',
          owedToYou: balance && Number(balance.netAmount) > 0 ? asMoney(balance.netAmount) : '0.00',
          net: balance ? asMoney(balance.netAmount) : '0.00',
        },
        suggestions: suggestions.map((item) => ({
          ...item,
          from: item.payerName,
          to: item.receiverName,
          amount: asMoney(item.amount),
          fromInitials: initials(item.payerName),
          toInitials: initials(item.receiverName),
        })),
        settlements: settlements.map((item) => ({
          ...item,
          from: members.find((member) => member.userId === item.payerId)?.fullName || `Member ${item.payerId}`,
          to: members.find((member) => member.userId === item.receiverId)?.fullName || `Member ${item.receiverId}`,
          amount: asMoney(item.amount),
          date: item.settlementDate,
        })),
      })),
      recentExpenses: normalizedExpenses.slice(0, 3),
      user: currentUser.user,
    }
  },
  group: (id) => request(`/api/groups/${id}`),
  expenses: async (groupId, category) => (await request(`/api/groups/${groupId}/expenses${category ? `?category=${encodeURIComponent(category)}` : ''}`)).map(normalizeExpense),
  createExpense: (groupId, body) => request(`/api/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(body) }),
  balances: (groupId) => request(`/api/groups/${groupId}/balances`),
  settlementSuggestions: (groupId) => request(`/api/groups/${groupId}/settlement-suggestions`),
  settlements: (groupId) => request(`/api/groups/${groupId}/settlements`),
}
