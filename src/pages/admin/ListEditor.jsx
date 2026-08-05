import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

// Generic editor for display_house_manual_items and display_recommendations.
export default function ListEditor({ property, table, fields, titleField }) {
  const [rows, setRows] = useState(null)
  const [editing, setEditing] = useState(null) // row object or 'new'
  const [status, setStatus] = useState('')

  async function load() {
    const { data } = await supabase.from(table).select('*')
      .eq('property_id', property.id).order('sort_order', { ascending: true })
    setRows(data || [])
  }
  useEffect(() => { load() }, [property.id, table])

  function blank() {
    const o = { property_id: property.id }
    for (const f of fields) o[f.key] = f.type === 'number' ? 0 : ''
    if (fields.find((f) => f.key === 'category')) o.category = fields.find((f) => f.key === 'category').options[0]
    return o
  }

  async function save(row) {
    setStatus('Saving…')
    const payload = { ...row }
    for (const f of fields) if (f.type === 'number') payload[f.key] = Number(payload[f.key]) || 0
    let res
    if (row.id) res = await supabase.from(table).update(payload).eq('id', row.id)
    else res = await supabase.from(table).insert(payload)
    if (res.error) { setStatus('Error: ' + res.error.message); return }
    setEditing(null); setStatus(''); load()
  }

  async function remove(id) {
    if (!confirm('Delete this item?')) return
    await supabase.from(table).delete().eq('id', id)
    load()
  }

  if (!rows) return <div className="text-neutral-500">Loading…</div>

  if (editing) {
    return (
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs text-neutral-500 mb-1">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea rows={3} value={editing[f.key] ?? ''} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-600" />
            ) : f.type === 'select' ? (
              <select value={editing[f.key] ?? f.options[0]} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-600">
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type === 'number' ? 'number' : 'text'} value={editing[f.key] ?? ''}
                onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-600" />
            )}
          </div>
        ))}
        {status && <div className="text-sm text-neutral-400">{status}</div>}
        <div className="flex gap-2">
          <button onClick={() => save(editing)} className="px-4 py-2 rounded-lg bg-[#C8A97E] text-black font-medium text-sm">Save</button>
          <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-neutral-800 text-sm">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="text-sm text-neutral-500">{rows.length} item(s)</div>
        <button onClick={() => setEditing(blank())} className="px-3 py-1.5 rounded-lg bg-[#C8A97E] text-black font-medium text-sm">+ Add</button>
      </div>
      <div className="grid gap-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium truncate">{r[titleField] || '(untitled)'}</div>
              {r.category && <div className="text-xs text-neutral-500">{r.category}{r.walk_time ? ` · ${r.walk_time}` : ''}</div>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditing(r)} className="text-sm text-neutral-300 hover:text-white">Edit</button>
              <button onClick={() => remove(r.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
