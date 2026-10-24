import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Circle, ListTodo, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './components/AuthPage'
import TaskModal from './components/TaskModal'
import { taskApi } from './services/api'
import './styles.css'

const normalize = task => ({ ...task, status: (task.status || 'PENDING').toUpperCase(), priority: (task.priority || 'MEDIUM').toUpperCase() })

function Dashboard() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({})
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [modal, setModal] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [items, summary] = await Promise.all([taskApi.list(), taskApi.stats()])
      setTasks((Array.isArray(items) ? items : []).map(normalize))
      setStats(summary)
    } catch (exception) {
      setError(exception.message)
    }
  }
  useEffect(() => { load() }, [])

  const visible = useMemo(() => tasks.filter(task => (filter === 'ALL' || task.status === filter) &&
    `${task.title} ${task.description || ''}`.toLowerCase().includes(query.toLowerCase())), [tasks, filter, query])
  const save = async task => {
    try {
      if (modal?.id) await taskApi.update(modal.id, task)
      else await taskApi.create({ ...task, status: task.status || 'PENDING' })
      setModal(null)
      await load()
    } catch (exception) { setError(exception.message) }
  }
  const toggleStatus = async task => {
    try {
      await taskApi.status(task.id, task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')
      await load()
    } catch (exception) { setError(exception.message) }
  }
  const remove = async task => {
    if (!window.confirm('Delete this task?')) return
    try { await taskApi.remove(task.id); await load() } catch (exception) { setError(exception.message) }
  }
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return <main className="content">
    <header className="welcome-row"><div><p className="eyebrow">Tasker workspace</p><h1>Good morning, {firstName}</h1><p className="muted">Here’s what’s on your plate today.</p></div><button className="button primary" onClick={() => setModal({})}><Plus /> New task</button><button className="button secondary" onClick={logout}>Log out</button></header>
    {error && <div className="alert">{error}</div>}
    <section className="stats-grid">
      <Stat label="Total tasks" value={stats.totalTasks ?? 0} />
      <Stat label="In progress" value={stats.inProgressTasks ?? 0} />
      <Stat label="Completed" value={stats.completedTasks ?? 0} />
      <Stat label="Overdue" value={stats.overdueTasks ?? 0} />
    </section>
    <section className="tasks-section"><div className="section-heading"><h2>Your tasks</h2><span>{visible.length} tasks</span></div>
      <div className="toolbar"><div className="search-box"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search tasks..." /></div>
        {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(value => <button className={filter === value ? 'pill active' : 'pill'} onClick={() => setFilter(value)} key={value}>{value === 'ALL' ? 'All' : value.replace('_', ' ')}</button>)}</div>
      <div className="task-list">{visible.map(task => <TaskRow key={task.id} task={task} onStatus={() => toggleStatus(task)} onEdit={() => setModal(task)} onDelete={() => remove(task)} />)}</div>
    </section>
    {modal && <TaskModal task={modal.id ? modal : null} onClose={() => setModal(null)} onSave={save} />}
  </main>
}

function Stat({ label, value }) { return <div className="stat-card"><div><span>{label}</span><strong>{value}</strong></div></div> }
function TaskRow({ task, onStatus, onEdit, onDelete }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
  return <article className={task.status === 'COMPLETED' ? 'task-row completed' : 'task-row'}><button className="check-button" onClick={onStatus}>{task.status === 'COMPLETED' ? <CheckCircle2 /> : <Circle />}</button><div className="task-body"><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}<div className="task-meta"><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>{task.dueDate && <span className={overdue ? 'due overdue' : 'due'}><CalendarDays /> {overdue ? 'Overdue · ' : ''}{task.dueDate}</span>}</div></div><div className="task-actions"><button onClick={onEdit}><Pencil /></button><button onClick={onDelete}><Trash2 /></button></div></article>
}
function AppContent() { const { user, loading } = useAuth(); if (loading) return <div className="page-loading">Loading...</div>; return user ? <Dashboard /> : <AuthPage /> }
export default function App() { return <AuthProvider><AppContent /></AuthProvider> }
