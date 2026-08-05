import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

function randomKey() {
  const s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = 'ELITE'
  for (let i = 0; i < 5; i++) out += s[Math.floor(Math.random() * s.length)]
  return out
}
function isOnline(lastSeen) {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 15 * 60 * 1000
}

export default function Devices({ property, onChange }) {
  const [rows, setRows] = useState(null)
  const [label, setLabel] = useState('')
  const [key, setKey] = useState(randomKey())
  const [status, setStatus] = useState('')

  async function load() {
    const { data } = await supabase.from('display_devices').select('*')
      .eq('assigned_property_id', property.id).order('created_at', { ascending: true })
    setRows(data || [])
  }
  useEffect(() => { load() }, [property.id])

  async function add() {
    setStatus('Adding…')
    const { error } = await supabase.from('display_devices').insert({
      device_key: key.trim().toUpperCase(),
      label: label.trim() || 'New device',
      assigned_property_id: property.id
    })
    if (error) { setStatus('Error: ' + error.message); return }
    setLabel(''); setKey(randomKey()); setStatus('')
    load(); onChange?.()
  }

  async function remove(id) {
    if (!confirm('Delete this device?')) return
    await supabase.from('display_devices').delete().eq('id', id)
    load(); onChange?.()
  }

  if (!rows) return <div className="text-neutral-500">Loading devices…</div>

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {rows.length === 0 && <div className="text-neutral-500 text-sm">No devices assigned yet.</div>}
        {rows.map((d) => (
          <div key={d.id} className="rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${isOnline(d.last_seen_at) ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                  {d.label}
                </div>
                <div className="text-xs text-neutral-500 font-mono mt-0.5">{d.device_key}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a href={`/display?device=${d.device_key}`} target="_blank" rel="noreferrer" className="text-sm text-[#C8A97E] hover:underline">Open ↗</a>
                <button onClick={() => remove(d.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
              </div>
            </div>
            <div className="text-xs text-neutral-600 mt-1">
              {isOnline(d.last_seen_at) ? 'Online' : d.last_seen_at ? `Last seen ${new Date(d.last_seen_at).toLocaleString()}` : 'Never seen'}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <div className="text-sm font-medium">Add a device</div>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Lounge TV)"
          className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-600" />
        <div className="flex gap-2">
          <input value={key} onChange={(e) => setKey(e.target.value)}
            className="flex-1 rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm font-mono outline-none focus:border-neutral-600" />
          <button onClick={() => setKey(randomKey())} className="px-3 py-2 rounded-lg border border-neutral-800 text-sm">Regenerate</button>
        </div>
        {status && <div className="text-sm text-neutral-400">{status}</div>}
        <button onClick={add} className="px-4 py-2 rounded-lg bg-[#C8A97E] text-black font-medium text-sm">Add device</button>
      </div>
    </div>
  )
}
