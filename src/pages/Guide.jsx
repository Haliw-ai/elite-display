import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getGuide } from '../lib/supabase.js'
import { qrDataUrl, wifiPayload } from '../lib/qr.js'

const CACHE_PREFIX = 'elite-guide:'

const CATEGORY_META = {
  coffee: { label: 'Coffee', icon: '☕' },
  beach: { label: 'Beaches', icon: '🏖️' },
  restaurant: { label: 'Restaurants', icon: '🍽️' },
  grocery: { label: 'Groceries', icon: '🛒' },
  pharmacy: { label: 'Pharmacies', icon: '💊' },
  sundowners: { label: 'Sundowners', icon: '🍸' }
}
const CATEGORY_ORDER = ['coffee', 'beach', 'restaurant', 'grocery', 'pharmacy', 'sundowners']

export default function Guide() {
  const [params] = useSearchParams()
  const propertyId = params.get('property') || ''
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [wifiQr, setWifiQr] = useState('')
  const [copied, setCopied] = useState('')

  const cacheKey = CACHE_PREFIX + propertyId

  useEffect(() => {
    let alive = true
    async function load() {
      if (!propertyId) { setError('No property. Add ?property=ID to the URL.'); return }
      try {
        const res = await getGuide(propertyId)
        if (!res || res.ok === false) throw new Error('Guide not found.')
        if (!alive) return
        setData(res); setError('')
        try { localStorage.setItem(cacheKey, JSON.stringify(res)) } catch {}
      } catch (e) {
        try {
          const cached = localStorage.getItem(cacheKey)
          if (cached && alive) { setData(JSON.parse(cached)); return }
        } catch {}
        if (alive) setError(e.message || 'Could not load guide.')
      }
    }
    load()
    return () => { alive = false }
  }, [propertyId, cacheKey])

  const prop = data?.property
  const accent = prop?.accent_color || '#C8A97E'

  useEffect(() => {
    let alive = true
    if (prop?.wifi_ssid) {
      qrDataUrl(wifiPayload(prop.wifi_ssid, prop.wifi_password), { width: 280 })
        .then((q) => { if (alive) setWifiQr(q) })
    }
    return () => { alive = false }
  }, [prop?.wifi_ssid, prop?.wifi_password])

  const grouped = useMemo(() => {
    const recs = data?.recommendations || []
    const map = {}
    for (const r of recs) {
      (map[r.category] ||= []).push(r)
    }
    return map
  }, [data])

  function copy(text, tag) {
    if (!text) return
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(tag)
      setTimeout(() => setCopied(''), 1500)
    })
  }

  if (error && !data) {
    return <div className="min-h-full flex items-center justify-center p-8 text-center text-neutral-400">{error}</div>
  }
  if (!data) {
    return <div className="min-h-full flex items-center justify-center text-neutral-500">Loading…</div>
  }

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100">
      <div className="max-w-lg mx-auto pb-16">
        {/* Hero */}
        <div className="relative h-56">
          {prop?.hero_image_url && (
            <img src={prop.hero_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.2), rgba(10,10,10,0.95))' }} />
          <div className="absolute bottom-0 p-6">
            <div className="text-xs tracking-[0.3em] uppercase" style={{ color: accent }}>Elite Accommodation</div>
            <h1 className="text-2xl font-bold mt-1">{prop?.name}</h1>
            <div className="text-neutral-400 text-sm">{prop?.city}</div>
          </div>
        </div>

        <div className="px-5 space-y-4 -mt-2">
          {prop?.welcome_message && (
            <p className="text-neutral-300">{prop.welcome_message}</p>
          )}

          {/* Arrival / access */}
          <Section title="Arrival & Access" accent={accent}>
            <Row label="Check-in" value={prop?.check_in_time || '15:00'} />
            <Row label="Check-out" value={prop?.check_out_time || '10:00'} />
            {prop?.address && <Row label="Address" value={prop.address} />}
            {prop?.access_code && (
              <Row label="Access code" value={prop.access_code}
                action={<CopyBtn onClick={() => copy(prop.access_code, 'code')} done={copied === 'code'} accent={accent} />} />
            )}
            {prop?.parking_info && <p className="text-neutral-300 text-sm mt-2">{prop.parking_info}</p>}
          </Section>

          {/* Wi-Fi */}
          <Section title="Wi-Fi" accent={accent}>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Row label="Network" value={prop?.wifi_ssid || '—'}
                  action={<CopyBtn onClick={() => copy(prop?.wifi_ssid, 'ssid')} done={copied === 'ssid'} accent={accent} />} />
                <Row label="Password" value={prop?.wifi_password || '—'}
                  action={<CopyBtn onClick={() => copy(prop?.wifi_password, 'pw')} done={copied === 'pw'} accent={accent} />} />
              </div>
              {wifiQr && <img src={wifiQr} alt="Wi-Fi QR" className="w-24 h-24 rounded-lg bg-white p-1" />}
            </div>
          </Section>

          {/* House manual */}
          {data.house_manual?.length > 0 && (
            <Section title="House Manual" accent={accent}>
              <div className="divide-y divide-white/5">
                {data.house_manual.map((item) => (
                  <Accordion key={item.id} title={item.title} body={item.body} accent={accent} />
                ))}
              </div>
            </Section>
          )}

          {/* Recommendations */}
          {(data.recommendations?.length > 0) && (
            <Section title="Around the Neighbourhood" accent={accent}>
              {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((cat) => (
                <div key={cat} className="mb-4">
                  <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span>{CATEGORY_META[cat]?.icon}</span>{CATEGORY_META[cat]?.label || cat}
                  </div>
                  <div className="space-y-2">
                    {grouped[cat].map((r) => (
                      <a key={r.id} href={r.map_url || '#'} target="_blank" rel="noreferrer"
                        className="block rounded-xl bg-white/5 border border-white/10 p-3 hover:border-white/25">
                        <div className="flex justify-between gap-2">
                          <div className="font-medium">{r.name}</div>
                          {r.walk_time && <div className="text-xs text-neutral-400 whitespace-nowrap">{r.walk_time}</div>}
                        </div>
                        {r.description && <div className="text-sm text-neutral-400 mt-0.5">{r.description}</div>}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* House rules */}
          {prop?.house_rules && (
            <Section title="House Rules" accent={accent}>
              <p className="text-neutral-300 text-sm whitespace-pre-line">{prop.house_rules}</p>
            </Section>
          )}

          {/* Checkout */}
          {prop?.checkout_steps && (
            <Section title="Before You Check Out" accent={accent}>
              <p className="text-neutral-300 text-sm whitespace-pre-line">{prop.checkout_steps}</p>
            </Section>
          )}

          {/* Contact */}
          {prop?.emergency_contact && (
            <Section title="Contact & Emergency" accent={accent}>
              <p className="text-neutral-300 text-sm whitespace-pre-line">{prop.emergency_contact}</p>
            </Section>
          )}

          <div className="text-center text-xs text-neutral-600 pt-4">Elite Accommodation · Cape Town</div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, accent, children }) {
  return (
    <section className="rounded-2xl bg-neutral-900/70 border border-white/10 p-4">
      <h2 className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: accent }}>{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, value, action }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="min-w-0">
        <div className="text-xs text-neutral-500">{label}</div>
        <div className="font-medium break-words">{value}</div>
      </div>
      {action}
    </div>
  )
}

function CopyBtn({ onClick, done, accent }) {
  return (
    <button onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/10 whitespace-nowrap"
      style={done ? { borderColor: accent, color: accent } : {}}>
      {done ? 'Copied' : 'Copy'}
    </button>
  )
}

function Accordion({ title, body, accent }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="py-2">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between text-left">
        <span className="font-medium">{title}</span>
        <span style={{ color: accent }}>{open ? '–' : '+'}</span>
      </button>
      {open && <p className="text-sm text-neutral-400 mt-2 whitespace-pre-line">{body}</p>}
    </div>
  )
}
