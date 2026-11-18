import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type User } from '../api.ts'
import { useAuth } from '../auth.tsx'
import { useSafeNext } from '../safeNext.ts'

/** Sign-in page. ?next=/checkout sends the user back where they came from. */
export default function Login() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const next = useSafeNext()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      const { user } = await api<{ user: User }>('/auth/login', {
        body: { email: form.get('email'), password: form.get('password') },
      })
      setUser(user)
      navigate(next)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Sign in</h1>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button disabled={busy}>Sign in</button>
      <p>New here? <Link to={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link></p>
    </form>
  )
}
