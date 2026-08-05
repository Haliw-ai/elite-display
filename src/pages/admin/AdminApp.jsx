import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'

export default function AdminApp() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <div className="min-h-full flex items-center justify-center text-neutral-500">Loading…</div>
  }
  if (!session) return <Login />
  return <Dashboard session={session} />
}
