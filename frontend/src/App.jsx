import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { appApi } from './api'

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value))
const dateLabel = (value) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))

function Avatar({ initials, color = 'violet', size = '' }) {
  return <span className={`avatar avatar-${color} ${size}`}>{initials}</span>
}

function Layout({ children, user, onLogout, groupId }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const handleLogout = async () => {
    try {
      await onLogout()
    } catch (error) {
      window.alert(error.message)
    }
  }
  const links = [
    { to: '/', label: 'Overview', icon: '⌂' },
    { to: `/groups/${groupId || 'g1'}`, label: 'My groups', icon: '◈' },
    { to: '/expenses', label: 'Expenses', icon: '▤' },
    { to: '/settlements', label: 'Settlements', icon: '↗' },
  ]
  return (
    <div className="app-shell">
      <aside className={mobileOpen ? 'sidebar is-open' : 'sidebar'}>
        <button className="brand" onClick={() => navigate('/')} aria-label="Go to dashboard">
          <span className="brand-mark">S</span><span>split<span className="brand-accent">smart</span></span>
        </button>
        <p className="eyebrow nav-heading">Workspace</p>
        <nav aria-label="Primary navigation">
          {links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><span className="nav-icon">{link.icon}</span>{link.label}</NavLink>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="tip-card"><span className="tip-icon">✦</span><strong>Stay even.</strong><span>Keep every shared cost clear and fair.</span></div>
          <button className="profile-button" onClick={handleLogout}><Avatar initials={user.initials} /><span><strong>{user.name}</strong><small>Log out</small></span><span className="more">•••</span></button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">☰</button><div className="breadcrumb">{location.pathname === '/' ? 'Overview' : location.pathname.includes('groups') ? 'My groups / Maple Residency' : location.pathname.slice(1).replace('-', ' ')}</div><div className="topbar-actions"><button className="icon-button" aria-label="Notifications">♧<span className="notification-dot" /></button><Avatar initials={user.initials} /></div></header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  )
}

function StatCard({ label, value, tone, detail }) {
  return <div className={`stat-card ${tone}`}><div className="stat-label">{label}<span className="stat-symbol">{tone === 'positive' ? '↗' : tone === 'negative' ? '↘' : '◌'}</span></div><strong>{value}</strong><span className="stat-detail">{detail}</span></div>
}

function Dashboard({ data }) {
  const navigate = useNavigate()
  if (!data.groups.length) {
    return <section className="panel empty-state"><p className="eyebrow">Your workspace</p><h1>No groups yet</h1><p className="muted">Create your first group to start sharing expenses.</p><button className="primary-button">＋ Create a group</button></section>
  }
  return <><section className="welcome-row"><div><p className="eyebrow">Saturday, 24 October 2026</p><h1>Good morning, Prathmesh <span className="wave">✦</span></h1><p className="muted">Here is your shared money snapshot.</p></div><button className="primary-button" onClick={() => navigate('/expenses/new')}>＋ Add expense</button></section>
    <section className="stats-grid"><StatCard label="You are owed" value={money(data.groups[0].balance.owedToYou)} tone="positive" detail="Across 2 groups" /><StatCard label="You owe" value={money(data.groups[0].balance.owed)} tone="negative" detail="Across 1 group" /><StatCard label="Net position" value={`+${money(data.groups[0].balance.net)}`} tone="neutral" detail="This month" /></section>
    <div className="content-grid"><section className="panel groups-panel"><div className="panel-heading"><div><p className="eyebrow">Your groups</p><h2>Keep things together</h2></div><button className="text-button" onClick={() => navigate('/groups/g1')}>View all <span>→</span></button></div><GroupCard group={data.groups[0]} /><div className="add-group-card"><span className="add-icon">＋</span><span><strong>Start a new group</strong><small>For a trip, home, or anything shared</small></span><span className="arrow">→</span></div></section><section className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent expenses</h2></div><button className="text-button" onClick={() => navigate('/expenses')}>See all <span>→</span></button></div>{data.recentExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)}</section></div>
    <section className="insight-banner"><div className="insight-icon">✦</div><div><strong>Small step, big clarity</strong><p>You've settled 3 payments this month. Keep your shared finances moving smoothly.</p></div><button className="icon-button" aria-label="Dismiss insight">×</button></section>
  </>
}

function GroupCard({ group }) {
  const navigate = useNavigate()
  return <button className="group-card" onClick={() => navigate('/groups/g1')}><div className="group-card-top"><span className="group-icon">MR</span><span className="status-pill">Active</span></div><h3>{group.name}</h3><p>{group.description}</p><div className="group-card-footer"><span><span className="mini-avatars"><Avatar initials="PA" size="mini" /><Avatar initials="AS" color="blue" size="mini" /><Avatar initials="IK" color="amber" size="mini" /><Avatar initials="+1" color="gray" size="mini" /></span> 4 members</span><strong>+{money(group.balance.net)}</strong></div></button>
}

function ExpenseRow({ expense }) {
  const categoryIcon = { Food: '✦', Utilities: '▦', Entertainment: '◆', Travel: '⌁' }[expense.category] || '•'
  return <div className="expense-row"><span className={`expense-icon ${expense.category.toLowerCase()}`}>{categoryIcon}</span><div className="expense-info"><strong>{expense.title}</strong><span>{expense.payer} · {dateLabel(expense.date)}</span></div><div className="expense-amount"><strong>{money(expense.amount)}</strong><span>{expense.category}</span></div></div>
}

function GroupPage({ group }) {
  const [tab, setTab] = useState('overview')
  const navigate = useNavigate()
  return <><section className="group-hero"><div><button className="back-button" onClick={() => navigate('/')}>← Back to overview</button><div className="group-title"><span className="group-icon large">MR</span><div><p className="eyebrow">Shared group</p><h1>{group.name}</h1><p className="muted">{group.description} · {group.members.length} members</p></div></div></div><button className="primary-button" onClick={() => navigate('/expenses/new')}>＋ Add expense</button></section>
    <div className="tabs" role="tablist">{['overview', 'expenses', 'members', 'settlements'].map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'tab active' : 'tab'} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div>
    {tab === 'overview' && <><section className="stats-grid group-stats"><StatCard label="Your net balance" value={`+${money(group.balance.net)}`} tone="positive" detail="You should receive" /><StatCard label="Group spending" value={money('5520.00')} tone="neutral" detail="This month" /><StatCard label="Pending settlements" value="3" tone="negative" detail="Suggested transfers" /></section><div className="content-grid"><section className="panel"><div className="panel-heading"><div><p className="eyebrow">Money flow</p><h2>Suggested settlements</h2></div><button className="text-button" onClick={() => setTab('settlements')}>View history <span>→</span></button></div>{group.suggestions.map((suggestion) => <Suggestion key={`${suggestion.from}-${suggestion.to}`} suggestion={suggestion} />)}</section><section className="panel"><div className="panel-heading"><div><p className="eyebrow">This month</p><h2>Spending by category</h2></div></div><div className="chart"><div className="bar-row"><span>Food</span><div><i style={{ width: '78%' }} /></div><strong>{money('2480')}</strong></div><div className="bar-row"><span>Utilities</span><div><i className="bar-blue" style={{ width: '50%' }} /></div><strong>{money('1360')}</strong></div><div className="bar-row"><span>Fun</span><div><i className="bar-amber" style={{ width: '35%' }} /></div><strong>{money('960')}</strong></div><div className="bar-row"><span>Travel</span><div><i className="bar-green" style={{ width: '27%' }} /></div><strong>{money('720')}</strong></div></div></section></div><section className="panel"><div className="panel-heading"><div><p className="eyebrow">Latest</p><h2>Recent expenses</h2></div><button className="text-button" onClick={() => setTab('expenses')}>See all <span>→</span></button></div>{group.expenses.slice(0, 3).map((expense) => <ExpenseRow key={expense.id} expense={expense} />)}</section></>}
    {tab === 'expenses' && <ExpenseList group={group} />}
    {tab === 'members' && <Members group={group} />}
    {tab === 'settlements' && <SettlementList group={group} />}
  </>
}

function Suggestion({ suggestion }) {
  return <div className="suggestion-row"><div className="transfer-people"><Avatar initials={suggestion.fromInitials} color="blue" /><span><strong>{suggestion.from}</strong><small>pays</small></span><span className="transfer-arrow">→</span><Avatar initials={suggestion.toInitials} /><span><strong>{suggestion.to}</strong><small>receives</small></span></div><strong className="suggestion-amount">{money(suggestion.amount)}</strong><button className="small-button">Record</button></div>
}

function ExpenseList({ group }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('All categories')
  const list = filter === 'All categories' ? group.expenses : group.expenses.filter((expense) => expense.category === filter)
  return <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Expense history</p><h2>{group.expenses.length} shared expenses</h2></div><button className="primary-button" onClick={() => navigate('/expenses/new')}>＋ Add expense</button></div><div className="filters"><label>Category<select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All categories</option><option>Food</option><option>Utilities</option><option>Entertainment</option><option>Travel</option></select></label><label>From<input type="date" /></label><label>To<input type="date" /></label></div><div className="table-list">{list.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)}</div></section>
}

function Members({ group }) {
  return <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Group members</p><h2>{group.members.length} people in {group.name}</h2></div><button className="secondary-button">＋ Add member</button></div><div className="member-list">{group.members.map((member) => <div className="member-row" key={member.id}><Avatar initials={member.initials} color={member.color} /><div><strong>{member.name}</strong><span>{member.email}</span></div><span className={member.role === 'Owner' ? 'owner-pill' : 'muted'}>{member.role}</span><button className="icon-button" aria-label={`More actions for ${member.name}`}>•••</button></div>)}</div></section>
}

function SettlementList({ group }) {
  return <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Settlement history</p><h2>Suggested and completed payments</h2></div><button className="secondary-button">＋ Record payment</button></div><div className="settlement-list"><div className="settlement-section-label">Suggested · 3 open</div>{group.suggestions.map((suggestion) => <Suggestion key={`${suggestion.from}-${suggestion.to}`} suggestion={suggestion} />)}<div className="settlement-section-label">Completed</div>{group.settlements.map((settlement) => <div className="settlement-row" key={settlement.id}><span className="check-icon">✓</span><div><strong>{settlement.from} paid {settlement.to}</strong><span>{dateLabel(settlement.date)} · Completed</span></div><strong>{money(settlement.amount)}</strong><button className="text-button">Void</button></div>)}</div></section>
}

function ExpenseForm() {
  const navigate = useNavigate()
  const [split, setSplit] = useState('equal')
  const [saved, setSaved] = useState(false)
  const submit = (event) => { event.preventDefault(); setSaved(true); setTimeout(() => navigate('/groups/g1'), 900) }
  return <section className="form-page"><button className="back-button" onClick={() => navigate(-1)}>← Cancel</button><div className="form-header"><p className="eyebrow">Maple Residency</p><h1>Add an expense</h1><p className="muted">Add a shared cost and choose how it should be split.</p></div><form className="panel expense-form" onSubmit={submit}><div className="form-grid"><label>Description<input required placeholder="e.g. Weekly groceries" /></label><label>Amount<div className="amount-input"><span>₹</span><input required inputMode="decimal" pattern="^\\d+(\\.\\d{1,2})?$" placeholder="0.00" /></div></label><label>Category<select defaultValue="Food"><option>Food</option><option>Utilities</option><option>Entertainment</option><option>Travel</option><option>Other</option></select></label><label>Date<input type="date" defaultValue="2026-10-24" required /></label><label>Payer<select defaultValue="u1"><option value="u1">Prathmesh Adhav</option><option value="u2">Aarav Sharma</option><option value="u3">Isha Kulkarni</option><option value="u4">Rohan Patil</option></select></label></div><fieldset><legend>Split between</legend><div className="participant-grid">{['Prathmesh Adhav', 'Aarav Sharma', 'Isha Kulkarni', 'Rohan Patil'].map((name, index) => <label className="check-card" key={name}><input type="checkbox" defaultChecked={index !== 3} /><Avatar initials={name.split(' ').map((part) => part[0]).join('')} color={['violet', 'blue', 'amber', 'green'][index]} /><span>{name}</span><span className="checkmark">✓</span></label>)}</div></fieldset><fieldset><legend>How should it be split?</legend><div className="split-options"><button type="button" className={split === 'equal' ? 'split-option active' : 'split-option'} onClick={() => setSplit('equal')}><span>÷</span><strong>Equally</strong><small>Everyone pays the same</small></button><button type="button" className={split === 'custom' ? 'split-option active' : 'split-option'} onClick={() => setSplit('custom')}><span>☷</span><strong>Custom amounts</strong><small>Set each person's share</small></button></div>{split === 'equal' ? <div className="split-preview"><span>Each person pays</span><strong>₹826.67</strong><small>Based on 3 participants</small></div> : <div className="custom-preview"><label>Prathmesh Adhav<input placeholder="₹ 0.00" /></label><label>Aarav Sharma<input placeholder="₹ 0.00" /></label><label>Isha Kulkarni<input placeholder="₹ 0.00" /></label></div>}</fieldset><div className="form-actions"><button type="button" className="secondary-button" onClick={() => navigate(-1)}>Cancel</button><button className="primary-button" type="submit">{saved ? 'Saved ✓' : 'Save expense'}</button></div></form></section>
}

function Auth({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false)
  const submit = (event) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    onLogin(values, isRegistering)
  }
  return <div className="auth-page"><div className="auth-decoration"><div className="auth-orb orb-one" /><div className="auth-orb orb-two" /><div className="auth-quote">“Clarity is kindness<br />to your future self.”</div></div><div className="auth-card"><div className="brand auth-brand"><span className="brand-mark">S</span><span>split<span className="brand-accent">smart</span></span></div><div className="auth-copy"><p className="eyebrow">{isRegistering ? 'Create your account' : 'Welcome back'}</p><h1>{isRegistering ? 'Start splitting smarter.' : 'Good to see you again.'}</h1><p className="muted">{isRegistering ? 'Bring a little more clarity to every shared expense.' : 'Your shared expenses, all in one calm place.'}</p></div><form onSubmit={submit} className="auth-form">{isRegistering && <label>Full name<input name="fullName" required placeholder="Your name" /></label>}<label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" required minLength="6" placeholder="••••••••" /></label>{!isRegistering && <div className="forgot-row"><label className="check-label"><input type="checkbox" /> Remember me</label><button type="button" className="text-button">Forgot password?</button></div>}<button className="primary-button full-width" type="submit">{isRegistering ? 'Create account' : 'Log in'} <span>→</span></button></form><p className="auth-switch">{isRegistering ? 'Already have an account?' : 'New to SplitSmart?'} <button className="text-button" onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? 'Log in' : 'Create an account'}</button></p><p className="mock-note">Demo mode · data is stored locally in this preview</p></div></div>
}

export default function App() {
  const [user, setUser] = useState(null)
  const [data, setData] = useState(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  useEffect(() => {
    appApi.me().then((response) => {
      const account = response.user
      setUser({
        ...account,
        name: account.fullName || account.name || 'Prathmesh Adhav',
        initials: account.initials || (account.fullName || account.name || 'PA').split(' ').map((part) => part[0]).join('').slice(0, 2),
      })
    }).catch(() => {}).finally(() => setSessionChecked(true))
  }, [])
  useEffect(() => { if (user) appApi.getDashboard().then(setData) }, [user])
  if (!sessionChecked) return <div className="loading-screen">Checking your session…</div>
  if (!user) return <Auth onLogin={async (values, registering) => {
    try {
      if (appApi.csrf) await appApi.csrf()
      const response = registering
        ? await appApi.register(values)
        : await appApi.login(values)
      const account = response.user || { fullName: 'Prathmesh Adhav', initials: 'PA' }
      setUser({
        ...account,
        name: account.fullName || account.name || 'Prathmesh Adhav',
        initials: account.initials || (account.fullName || 'PA').split(' ').map((part) => part[0]).join('').slice(0, 2),
      })
    } catch (error) {
      window.alert(error.message)
    }
  }} />
  if (!data) return <div className="loading-screen">Loading your workspace…</div>
  return <Layout user={user} groupId={data.groups[0]?.id} onLogout={async () => { await appApi.logout(); setUser(null) }}><Routes><Route path="/" element={<Dashboard data={data} />} /><Route path="/groups/:groupId" element={<GroupPage group={data.groups[0]} />} /><Route path="/expenses" element={<ExpenseList group={data.groups[0]} />} /><Route path="/expenses/new" element={<ExpenseForm />} /><Route path="/settlements" element={<SettlementList group={data.groups[0]} />} /><Route path="*" element={<Dashboard data={data} />} /></Routes></Layout>
}
