import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

const FIELDS = [
  { key: 'display_name', label: 'Display name', type: 'text' },
  { key: 'hero_image_url', label: 'Hero image URL', type: 'text' },
  { key: 'timezone', label: 'Timezone', type: 'text', placeholder: 'Africa/Johannesburg' },
  { key: 'accent_color', label: 'Accent color', type: 'text', placeholder: '#C8A97E' },
  { key: 'wifi_ssid', label: 'Wi-Fi network', type: 'text' },
  { key: 'wifi_password', label: 'Wi-Fi password', type: 'text' },
  { key: 'check_in_time', label: 'Check-in time', type: 'text', placeholder: '15:00' },
  { key: 'check_out_time', label: 'Check-out time', type: 'text', placeholder: '10:00' },
  { key: 'access_code', label: 'Access code', type: 'text' },
  { key: 'welcome_message', label: 'Welcome message', type: 'textarea' },
  { key: 'parking_info', label: 'Parking info', type: 'textarea' },
  { key: 'house_rules', label: 'House rules', type: 'textarea' },
  { key: 'checkout_steps', label: 'Checkout steps', type: 'textarea' },
  { key: 'emergency_contact', label: 'Emergency contact', type: 'textarea' }
]

export default function ContentEditor({ property }) {
  const [form, setForm] = useState(null)
  const [published, setPublished] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    let alive = true
    supabase.from('display_content').select('*').eq('property_id', property.id).maybeSingle()
      .then(({ data }) => {
        if (!alive) return
        const base = {}
        for (const f of FIELDS) base[f.key] = data?.[f.key] ?? ''
        setForm(base)
        setPublished(data?.is_published ?? false)
      })
    return () => { alive = false }
  }, [property.id])

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function save(nextPublished = published) {
    setStatus('Saving…')
    const payload = { property_id: property.id, is_published: nextPublished, updated_at: new Date().toISOString() }
    for (const f of FIELDS) payload[f.key] = form[f.key] === '' ? null : form[f.key]
    const { error } = await supabase.from('display_content').upsert(payload, { onConflict: 'property_id' })
    if (error) { setStatus('Error: ' + error.message); return }
    setPublished(nextPublished)
    setStatus('Saved ✓')
    setTimeout(() => setStatus(''), 2000)
  }

  if (!form) return <div className="text-neutral-500">Loading content…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published (visible on TV & guide)
        </label>
        <div className="flex items-center gap-3">
          {status && <span className="text-sm text-neutral-400">{status}</span>}
          <button onClick={() => save()} className="px-4 py-2 rounded-lg bg-[#C8A97E] text-black font-medium text-sm">Save</button>
        </div>
      </div>

      <div className="grid gap-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-xs text-neutral-500 mb-1">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea rows={3} value={form[f.key]} placeholder={f.placeholder || ''}
                onChange={(e) => set(f.key, e.target.value)}
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-600" />
            ) : (
              <input type="text" value={form[f.key]} placeholder={f.placeholder || ''}
                onChange={(e) => set(f.key, e.target.value)}
                className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-600" />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <a href={`/guide?property=${property.id}`} target="_blank" rel="noreferrer"
          className="text-sm text-[#C8A97E] hover:underline">Preview guide ↗</a>
        <span className="text-neutral-700">·</span>
        <span className="text-sm text-neutral-500">
          Fallbacks apply for blank fields (Wi-Fi / photo / access code from the Guesty record).
        </span>
      </div>
    </div>
  )
}
