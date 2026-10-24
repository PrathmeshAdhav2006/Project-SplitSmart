import { useState } from 'react'
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

export default function AuthPage({ initialMode = 'login' }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true)
    if (mode === 'register' && form.password !== form.confirmPassword) { setError('Passwords do not match'); setBusy(false); return }
    try { await (mode === 'login' ? login({ email: form.email, password: form.password }) : register({ name: form.name, email: form.email, password: form.password })) }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return <main className="auth-shell">
    <section className="auth-intro"><Logo /><div className="intro-copy"><p className="eyebrow">A calmer way to work</p><h1>Make space for<br /><em>great work.</em></h1><p>Organize your day, keep momentum, and finish what matters.</p><div className="intro-points"><span><CheckCircle2 /> Simple by design</span><span><CheckCircle2 /> Built for focus</span></div></div><div className="intro-shape" /></section>
    <section className="auth-panel"><div className="auth-card"><div className="mobile-logo"><Logo /></div><p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Start for free'}</p><h2>{mode === 'login' ? 'Sign in to Tasker' : 'Create your account'}</h2><p className="muted">{mode === 'login' ? 'Your tasks are waiting for you.' : 'A clearer day starts here.'}</p>
      <form onSubmit={submit}>{mode === 'register' && <label>Full name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Alex Morgan" /></label>}<label>Email address<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label><label>Password<div className="password-input"><input required minLength="8" type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff /> : <Eye />}</button></div></label>{mode === 'register' && <label>Confirm password<input required minLength="8" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} /></label>}{error && <div className="form-error">{error}</div>}<button className="button primary full" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight /></>}</button></form>
      <p className="switch-auth">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Create one' : 'Sign in'}</button></p>
    </div></section>
  </main>
}
