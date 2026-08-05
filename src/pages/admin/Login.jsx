import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="text-xs tracking-[0.3em] uppercase text-[#C8A97E]">Elite Accommodation</div>
          <h1 className="text-2xl font-semibold mt-1">Display Admin</h1>
        </div>
        <input type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 outline-none focus:border-neutral-600" />
        <input type="password" required placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 outline-none focus:border-neutral-600" />
        {error && <div className="text-sm text-red-400">{error}</div>}
        <button disabled={busy}
          className="w-full rounded-xl bg-[#C8A97E] text-black font-semibold py-3 disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-xs text-neutral-500 text-center">
          Access is limited to the display admin allowlist.
        </p>
      </form>
    </div>
  )
}
