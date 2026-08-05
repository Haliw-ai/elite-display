import { useEffect, useMemo, useState } from 'react'
import { qrDataUrl, wifiPayload } from '../../lib/qr.js'

// Live, interactive preview of the guest-facing TV display and phone guide.
// Driven entirely by the `content` object passed from the editor form, so it
// updates in real time as the fields are edited (nothing is saved yet).

const CATEGORY_META = {
  coffee: { label: 'Coffee', icon: '☕' },
  beach: { label: 'Beaches', icon: '🏖️' },
  restaurant: { label: 'Restaurants', icon: '🍽️' },
  grocery: { label: 'Groceries', icon: '🛒' },
  pharmacy: { label: 'Pharmacies', icon: '💊' },
  sundowners: { label: 'Sundowners', icon: '🍸' }
}
const CATEGORY_ORDER = ['coffee', 'beach', 'restaurant', 'grocery', 'pharmacy', 'sundowners']

export default function LivePreview({ content = {}, propertyName, city, propertyId, manual = [], recs = [] }) {
  const [device, setDevice] = useState('tv')          // 'tv' | 'phone'
  const [sampleName, setSampleName] = useState('Alex') // pretend guest first name
  const [checkoutMode, setCheckoutMode] = useState(false)

  const accent = content.accent_color || '#C8A97E'
  const name = content.display_name || propertyName || 'Your property'

  return (
    <div className="space-y-3">
      {/* Preview controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg bg-neutral-900 border border-neutral-800 p-0.5">
          {['tv', 'phone'].map((d) => (
            <button key={d} onClick={() => setDevice(d)}
              className={`px-3 py-1 rounded-md text-sm ${device === d ? 'bg-[#C8A97E] text-black font-medium' : 'text-neutral-300'}`}>
              {d === 'tv' ? 'TV' : 'Phone'}
            </button>
          ))}
        </div>
        {device === 'tv' && (
          <>
            <input value={sampleName} onChange={(e) => setSampleName(e.target.value)} placeholder="Sample guest"
              className="w-28 rounded-lg bg-neutral-900 border border-neutral-800 px-2 py-1 text-sm outline-none focus:border-neutral-600" />
            <label className="flex items-center gap-1.5 text-sm text-neutral-400">
              <input type="checkbox" checked={checkoutMode} onChange={(e) => setCheckoutMode(e.target.checked)} />
              Checkout state
            </label>
          </>
        )}
        <span className="text-xs text-neutral-600 ml-auto">Live preview · unsaved</span>
      </div>

      {device === 'tv'
        ? <TvFrame content={content} name={name} accent={accent} sampleName={sampleName} checkoutMode={checkoutMode} propertyId={propertyId} />
        : <PhoneFrame content={content} name={name} city={city} accent={accent} manual={manual} recs={recs} />}
    </div>
  )
}

/* ------------------------------- TV preview ------------------------------- */

function TvFrame({ content, name, accent, sampleName, checkoutMode, propertyId }) {
  const [clock, setClock] = useState('')
  const [wifiQr, setWifiQr] = useState('')
  const [guideQr, setGuideQr] = useState('')

  useEffect(() => {
    const tick = () => {
      try {
        setClock(new Intl.DateTimeFormat('en-GB', {
          timeZone: content.timezone || 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', hour12: false
        }).format(new Date()))
      } catch { setClock('--:--') }
    }
    tick()
    const t = setInterval(tick, 10000)
    return () => clearInterval(t)
  }, [content.timezone])

  useEffect(() => {
    let alive = true
    if (content.wifi_ssid) {
      qrDataUrl(wifiPayload(content.wifi_ssid, content.wifi_password), { width: 240 })
        .then((q) => { if (alive) setWifiQr(q) })
    } else setWifiQr('')
    return () => { alive = false }
  }, [content.wifi_ssid, content.wifi_password])

  useEffect(() => {
    let alive = true
    const url = `${window.location.origin}/guide?property=${propertyId || ''}`
    qrDataUrl(url, { width: 240 }).then((q) => { if (alive) setGuideQr(q) })
    return () => { alive = false }
  }, [propertyId])

  const steps = (content.checkout_steps || '')
    .split('\n').map((s) => s.replace(/^\s*\d+\.\s*/, '').trim()).filter(Boolean)

  return (
    <DeviceShell label="TV · 16:9">
      <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-[#0b0b0c] text-white">
        {content.hero_image_url && (
          <img src={content.hero_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(11,11,12,0.55), rgba(11,11,12,0.85))' }} />
        <div className="relative z-10 h-full flex flex-col p-[3%]">
          {/* top bar */}
          <div className="flex items-start justify-between">
            <div>
              <div className="uppercase tracking-[0.3em]" style={{ color: accent, fontSize: '1.1cqw' }}>Elite Accommodation</div>
              <div className="text-neutral-300" style={{ fontSize: '1.6cqw' }}>{name}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold tabular-nums" style={{ fontSize: '4.5cqw' }}>{clock}</div>
            </div>
          </div>
          {/* center */}
          <div className="flex-1 flex flex-col justify-center">
            {checkoutMode ? (
              <div>
                <div className="uppercase tracking-widest" style={{ color: accent, fontSize: '1.2cqw' }}>
                  Checking out {content.check_out_time ? `by ${content.check_out_time}` : 'tomorrow'}
                </div>
                <div className="font-bold" style={{ fontSize: '3.6cqw' }}>
                  {sampleName ? `Safe travels, ${sampleName}` : 'Before you go'}
                </div>
                <ol className="mt-[1.5%] space-y-[0.6%]">
                  {steps.slice(0, 6).map((s, i) => (
                    <li key={i} className="text-neutral-200 flex gap-2" style={{ fontSize: '1.5cqw' }}>
                      <span className="font-bold" style={{ color: accent }}>{i + 1}.</span><span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div>
                <div className="text-neutral-300" style={{ fontSize: '2.4cqw' }}>{sampleName ? 'Welcome,' : 'Welcome to'}</div>
                <div className="font-bold" style={{ fontSize: '6cqw', lineHeight: 1.05 }}>{sampleName || name}</div>
                {content.welcome_message && (
                  <div className="mt-[1.5%] text-neutral-300 max-w-[70%]" style={{ fontSize: '1.6cqw' }}>{content.welcome_message}</div>
                )}
              </div>
            )}
          </div>
          {/* bottom cards */}
          <div className="grid grid-cols-2 gap-[2%]">
            <TvCard title="Wi-Fi" qr={wifiQr} accent={accent}
              lines={[['Network', content.wifi_ssid || '—'], ['Password', content.wifi_password || '—']]} />
            <TvCard title="Guest Guide" qr={guideQr} accent={accent}
              lines={[['Check-in', content.check_in_time || '15:00'], ['Check-out', content.check_out_time || '10:00']]} />
          </div>
        </div>
      </div>
    </DeviceShell>
  )
}

function TvCard({ title, qr, lines, accent }) {
  return (
    <div className="rounded-lg bg-black/40 border border-white/10 p-[2%] flex items-center gap-[3%]">
      {qr
        ? <img src={qr} alt="" className="rounded bg-white p-0.5" style={{ width: '9cqw', height: '9cqw' }} />
        : <div className="rounded bg-white/10" style={{ width: '9cqw', height: '9cqw' }} />}
      <div className="min-w-0">
        <div className="uppercase tracking-widest" style={{ color: accent, fontSize: '1cqw' }}>{title}</div>
        {lines.map(([k, v]) => (
          <div key={k} className="truncate" style={{ fontSize: '1.3cqw' }}>
            <span className="text-neutral-400">{k}: </span><span className="font-semibold">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ----------------------------- Phone preview ----------------------------- */

function PhoneFrame({ content, name, city, accent, manual, recs }) {
  const [wifiQr, setWifiQr] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    let alive = true
    if (content.wifi_ssid) {
      qrDataUrl(wifiPayload(content.wifi_ssid, content.wifi_password), { width: 200 })
        .then((q) => { if (alive) setWifiQr(q) })
    } else setWifiQr('')
    return () => { alive = false }
  }, [content.wifi_ssid, content.wifi_password])

  const grouped = useMemo(() => {
    const map = {}
    for (const r of recs || []) (map[r.category] ||= []).push(r)
    return map
  }, [recs])

  function copy(text, tag) {
    if (!text) return
    navigator.clipboard?.writeText(text).then(() => { setCopied(tag); setTimeout(() => setCopied(''), 1500) })
  }

  return (
    <DeviceShell label="Phone">
      <div className="mx-auto w-[320px] max-w-full">
        <div className="rounded-[2rem] border-[8px] border-neutral-800 bg-neutral-950 overflow-hidden shadow-xl">
          <div className="h-[560px] overflow-y-auto text-neutral-100">
            {/* hero */}
            <div className="relative h-40">
              {content.hero_image_url && <img src={content.hero_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.2), rgba(10,10,10,0.95))' }} />
              <div className="absolute bottom-0 p-4">
                <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: accent }}>Elite Accommodation</div>
                <div className="text-lg font-bold leading-tight">{name}</div>
                <div className="text-neutral-400 text-xs">{city}</div>
              </div>
            </div>

            <div className="px-4 py-3 space-y-3">
              {content.welcome_message && <p className="text-sm text-neutral-300">{content.welcome_message}</p>}

              <PSection title="Arrival & Access" accent={accent}>
                <PRow label="Check-in" value={content.check_in_time || '15:00'} />
                <PRow label="Check-out" value={content.check_out_time || '10:00'} />
                {content.access_code && (
                  <PRow label="Access code" value={content.access_code}
                    action={<CopyBtn done={copied === 'code'} accent={accent} onClick={() => copy(content.access_code, 'code')} />} />
                )}
                {content.parking_info && <p className="text-xs text-neutral-400 mt-1">{content.parking_info}</p>}
              </PSection>

              <PSection title="Wi-Fi" accent={accent}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <PRow label="Network" value={content.wifi_ssid || '—'}
                      action={<CopyBtn done={copied === 'ssid'} accent={accent} onClick={() => copy(content.wifi_ssid, 'ssid')} />} />
                    <PRow label="Password" value={content.wifi_password || '—'}
                      action={<CopyBtn done={copied === 'pw'} accent={accent} onClick={() => copy(content.wifi_password, 'pw')} />} />
                  </div>
                  {wifiQr && <img src={wifiQr} alt="" className="w-20 h-20 rounded bg-white p-1" />}
                </div>
              </PSection>

              {manual?.length > 0 && (
                <PSection title="House Manual" accent={accent}>
                  <div className="divide-y divide-white/5">
                    {manual.map((m) => <Accordion key={m.id || m.title} title={m.title} body={m.body} accent={accent} />)}
                  </div>
                </PSection>
              )}

              {recs?.length > 0 && (
                <PSection title="Around the Neighbourhood" accent={accent}>
                  {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((cat) => (
                    <div key={cat} className="mb-3">
                      <div className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <span>{CATEGORY_META[cat]?.icon}</span>{CATEGORY_META[cat]?.label || cat}
                      </div>
                      <div className="space-y-1.5">
                        {grouped[cat].map((r) => (
                          <div key={r.id || r.name} className="rounded-lg bg-white/5 border border-white/10 p-2">
                            <div className="flex justify-between gap-2">
                              <div className="text-sm font-medium">{r.name}</div>
                              {r.walk_time && <div className="text-[10px] text-neutral-400 whitespace-nowrap">{r.walk_time}</div>}
                            </div>
                            {r.description && <div className="text-xs text-neutral-400 mt-0.5">{r.description}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </PSection>
              )}

              {content.house_rules && (
                <PSection title="House Rules" accent={accent}>
                  <p className="text-xs text-neutral-300 whitespace-pre-line">{content.house_rules}</p>
                </PSection>
              )}
              {content.checkout_steps && (
                <PSection title="Before You Check Out" accent={accent}>
                  <p className="text-xs text-neutral-300 whitespace-pre-line">{content.checkout_steps}</p>
                </PSection>
              )}
              {content.emergency_contact && (
                <PSection title="Contact & Emergency" accent={accent}>
                  <p className="text-xs text-neutral-300 whitespace-pre-line">{content.emergency_contact}</p>
                </PSection>
              )}
              <div className="text-center text-[10px] text-neutral-600 pt-2">Elite Accommodation · Cape Town</div>
            </div>
          </div>
        </div>
      </div>
    </DeviceShell>
  )
}

/* ------------------------------ shared bits ------------------------------ */

function DeviceShell({ label, children }) {
  return (
    <div className="rounded-xl bg-neutral-900/40 border border-neutral-800 p-3" style={{ containerType: 'inline-size' }}>
      <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">{label}</div>
      {children}
    </div>
  )
}
function PSection({ title, accent, children }) {
  return (
    <section className="rounded-xl bg-neutral-900/70 border border-white/10 p-3">
      <h3 className="text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: accent }}>{title}</h3>
      {children}
    </section>
  )
}
function PRow({ label, value, action }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <div className="min-w-0">
        <div className="text-[10px] text-neutral-500">{label}</div>
        <div className="text-sm font-medium break-words">{value}</div>
      </div>
      {action}
    </div>
  )
}
function CopyBtn({ onClick, done, accent }) {
  return (
    <button onClick={onClick} className="text-[10px] px-2 py-1 rounded-md border border-white/15 hover:bg-white/10 whitespace-nowrap"
      style={done ? { borderColor: accent, color: accent } : {}}>{done ? 'Copied' : 'Copy'}</button>
  )
}
function Accordion({ title, body, accent }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="py-1.5">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between text-left">
        <span className="text-sm font-medium">{title}</span>
        <span style={{ color: accent }}>{open ? '–' : '+'}</span>
      </button>
      {open && <p className="text-xs text-neutral-400 mt-1.5 whitespace-pre-line">{body}</p>}
    </div>
  )
}
