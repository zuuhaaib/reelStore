import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type User } from '../api.ts'
import { useAuth } from '../auth.tsx'
import { useSafeNext } from '../safeNext.ts'

/** Registration: account, default shipping address and default card (all required by the spec). */
export default function Register() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const next = useSafeNext()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setBusy(true)
    setError('')
    try {
      const { user } = await api<{ user: User }>('/auth/register', {
        body: {
          email: f.email,
          password: f.password,
          firstName: f.firstName,
          lastName: f.lastName,
          address: { street: f.street, city: f.city, province: f.province, country: f.country, zip: f.zip, phone: f.phone },
          card: { name: f.cardName, number: f.cardNumber, expiry: f.cardExpiry },
        },
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
      <h1>Create account</h1>
      <fieldset>
        <legend>Account</legend>
        <div className="row">
          <label>First name<input name="firstName" autoComplete="given-name" required /></label>
          <label>Last name<input name="lastName" autoComplete="family-name" required /></label>
        </div>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password (8+ characters)<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      </fieldset>
      <fieldset>
        <legend>Shipping address</legend>
        <label>Street<input name="street" autoComplete="street-address" required /></label>
        <div className="row">
          <label>City<input name="city" autoComplete="address-level2" required /></label>
          <label>Province<input name="province" autoComplete="address-level1" required /></label>
        </div>
        <div className="row">
          <label>Country<input name="country" autoComplete="country-name" defaultValue="Canada" required /></label>
          <label>Postal code<input name="zip" autoComplete="postal-code" required /></label>
        </div>
        <label>Phone (optional)<input name="phone" type="tel" autoComplete="tel" /></label>
      </fieldset>
      <fieldset>
        <legend>Credit card</legend>
        <label>Name on card<input name="cardName" autoComplete="cc-name" required /></label>
        <div className="row">
          <label>Card number<input name="cardNumber" inputMode="numeric" autoComplete="cc-number" required /></label>
          <label>Expiry (MM/YY)<input name="cardExpiry" placeholder="MM/YY" autoComplete="cc-exp" pattern="(0[1-9]|1[0-2])/\d{2}" required /></label>
        </div>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      <button disabled={busy}>Create account</button>
      <p>Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></p>
    </form>
  )
}
