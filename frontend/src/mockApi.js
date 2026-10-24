const members = [
  { id: 'u1', name: 'Prathmesh Adhav', email: 'prathmesh@example.com', initials: 'PA', color: 'violet', role: 'Owner' },
  { id: 'u2', name: 'Aarav Sharma', email: 'aarav@example.com', initials: 'AS', color: 'blue', role: 'Member' },
  { id: 'u3', name: 'Isha Kulkarni', email: 'isha@example.com', initials: 'IK', color: 'amber', role: 'Member' },
  { id: 'u4', name: 'Rohan Patil', email: 'rohan@example.com', initials: 'RP', color: 'green', role: 'Member' },
]

const expenses = [
  { id: 'e1', title: 'Groceries', category: 'Food', date: '2026-10-22', amount: '2480.00', payer: 'Prathmesh Adhav', payerId: 'u1', participants: 4 },
  { id: 'e2', title: 'October electricity', category: 'Utilities', date: '2026-10-18', amount: '1360.00', payer: 'Aarav Sharma', payerId: 'u2', participants: 4 },
  { id: 'e3', title: 'Movie night', category: 'Entertainment', date: '2026-10-12', amount: '960.00', payer: 'Isha Kulkarni', payerId: 'u3', participants: 3 },
  { id: 'e4', title: 'Weekend cab', category: 'Travel', date: '2026-10-05', amount: '720.00', payer: 'Rohan Patil', payerId: 'u4', participants: 4 },
]

const group = {
  id: 'g1',
  name: 'Maple Residency',
  description: 'Flat 4B shared expenses',
  currency: 'INR',
  members,
  expenses,
  balance: { owed: '1280.00', owedToYou: '3450.00', net: '2170.00' },
  suggestions: [
    { from: 'Aarav Sharma', to: 'Prathmesh Adhav', amount: '980.00', fromInitials: 'AS', toInitials: 'PA' },
    { from: 'Isha Kulkarni', to: 'Prathmesh Adhav', amount: '1070.00', fromInitials: 'IK', toInitials: 'PA' },
    { from: 'Rohan Patil', to: 'Aarav Sharma', amount: '430.00', fromInitials: 'RP', toInitials: 'AS' },
  ],
  settlements: [
    { id: 's1', from: 'Aarav Sharma', to: 'Prathmesh Adhav', amount: '750.00', date: '2026-10-02', status: 'Completed' },
  ],
}

const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 220))

export const mockApi = {
  async csrf() {
    return delay({ token: 'mock-csrf' })
  },
  async login() {
    return delay({ user: members[0], token: 'mock-session' })
  },
  async register() {
    return delay({ user: members[0], token: 'mock-session' })
  },
  async me() {
    return delay({ user: members[0] })
  },
  async logout() {
    return delay(null)
  },
  async getDashboard() {
    return delay({ groups: [group], recentExpenses: expenses.slice(0, 3), user: members[0] })
  },
  async getGroup() {
    return delay(group)
  },
  async createExpense(expense) {
    return delay({ ...expense, id: `e${Date.now()}` })
  },
}
