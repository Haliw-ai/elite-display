import { useEffect, useState } from 'react'
import { adminListReservations } from '../../lib/supabase.js'

export default function Reservations({ property }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    adminListReservations(property.id)
      .then((d) => { if (alive) setRows(d || []) })
      .catch((e) => { if (alive) setError(e.message || 'Failed to load.') })
    return () => { alive = false }
  }, [property.id])

  if (error) return <div className="text-red-400">{error}</div>
  if (!rows) return <div className="text-neutral-500">Loading reservations…</div>
  if (rows.length === 0) return <div className="text-neutral-500">No upcoming confirmed reservations.</div>

  return (
    <div className="grid gap-2">
      <div className="text-sm text-neutral-500">{rows.length} upcoming confirmed (read-only, live from Guesty)</div>
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 flex items-center justify-between">
          <div className="font-medium">{r.guest_first_name || 'Guest'}</div>
          <div className="text-sm text-neutral-400 tabular-nums">{r.check_in} → {r.check_out}</div>
        </div>
      ))}
    </div>
  )
}
