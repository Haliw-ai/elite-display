import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getDisplay, touchDevice } from '../lib/supabase.js'
import { qrDataUrl, wifiPayload } from '../lib/qr.js'
import { nowParts, showCheckout } from '../lib/time.js'

const CACHE_PREFIX = 'elite-display:'
const REFRESH_MS = 15 * 60 * 1000   // 15 min data refresh
const HEARTBEAT_MS = 5 * 60 * 1000  // 5 min heartbeat

export default function Display() {
  const [params] = useSearchParams()
  const deviceKey = params.get('device') || ''
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [clock, setClock] = useState({ time: '', date: '' })
  const [wifiQr, setWifiQr] = useState('')
  const [guideQr, setGuideQr] = useState('')

  const cacheKey = CACHE_PREFIX + deviceKey

  const load = useCallback(async () => {
    if (!deviceKey) { setError('No device key. Add ?device=YOURKEY to the URL.'); return }
    try {
      const res = await getDisplay(deviceKey)
      if (!res || res.ok === false) throw new Error('Display not found for this device.')
      setData(res)
      setError('')
      try { localStorage.setItem(cacheKey, JSON.stringify(res)) } catch {}
    } catch (e) {
      // Fall back to last-good cache so the TV never goes blank.
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) { setData(JSON.parse(cached)); setError(''); return }
      } catch {}
      setError(e.message || 'Could not load display.')
    }
  }, [deviceKey, cacheKey])

  // Initial + periodic data refresh
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setInterval(load, REFRESH_MS)
    return () => clearInterval(t)
  }, [load])

  // Heartbeat
  useEffect(() => {
    if (!deviceKey) return
    const beat = () => { touchDevice(deviceKey).catch(() => {}) }
    beat()
    const t = setInterval(beat, HEARTBEAT_MS)
    return () => clearInterval(t)
  }, [deviceKey])

  // Live clock
  const tz = data?.timezone
  useEffect(() => {
    const tick = () => setClock(nowParts(tz))
    tick()
    const t = setInterval(tick, 1000 * 10)
    return () => clearInterval(t)
  }, [tz])

  // QR codes
  const prop = data?.property
  useEffect(() => {
    let alive = true
    async function gen() {
      if (prop?.wifi_ssid) {
        const q = await qrDataUrl(wifiPayload(prop.wifi_ssid, prop.wifi_password), { width: 360 })
        if (alive) setWifiQr(q)
      }
      if (prop?.id) {
        const guideUrl = `${window.location.origin}/guide?property=${prop.id}`
        const q = await qrDataUrl(guideUrl, { width: 360 })
        if (alive) setGuideQr(q)
      }
    }
    gen()
    return () => { alive = false }
  }, [prop?.id, prop?.wifi_ssid, prop?.wifi_password])

  const accent = prop?.accent_color || '#C8A97E'
  const firstName = data?.guest?.first_name
  const checkoutMode = useMemo(
    () => showCheckout(data?.guest?.check_out, tz),
    [data?.guest?.check_out, tz]
  )

  if (error && !data) {
    return (
      <div className="min-h-full flex items-center justify-center p-10 text-center">
        <div>
          <div className="text-2xl font-semibold mb-2">ELITE Display</div>
          <div className="text-neutral-400">{error}</div>
        </div>
      </div>
    )
  }
  if (!data) {
    return <div className="min-h-full flex items-center justify-center text-neutral-500">Loading…</div>
  }

  return (
    <div
      className="min-h-full w-full relative overflow-hidden"
      style={{ backgroundColor: '#0b0b0c' }}
    >
      {/* Hero background */}
      {prop?.hero_image_url && (
        <img
          src={prop.hero_image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(11,11,12,0.55) 0%, rgba(11,11,12,0.85) 100%)' }} />

      <div className="relative z-10 min-h-full flex flex-col p-10 lg:p-16">
        {/* Top bar */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm lg:text-base tracking-[0.35em] uppercase" style={{ color: accent }}>
              Elite Accommodation
            </div>
            <div className="mt-1 text-lg lg:text-2xl text-neutral-300">{prop?.name}</div>
          </div>
          <div className="text-right">
            <div className="text-5xl lg:text-7xl font-semibold tabular-nums">{clock.time}</div>
            <div className="text-neutral-400 lg:text-lg">{clock.date}</div>
          </div>
        </div>

        {/* Center greeting / checkout */}
        <div className="flex-1 flex flex-col justify-center">
          {checkoutMode ? (
            <CheckoutCard prop={prop} accent={accent} firstName={firstName} />
          ) : (
            <div>
              <div className="text-2xl lg:text-4xl text-neutral-300">
                {firstName ? 'Welcome,' : 'Welcome to'}
              </div>
              <div className="text-6xl lg:text-8xl font-bold mt-2" style={{ color: '#fff' }}>
                {firstName || prop?.name}
              </div>
              {prop?.welcome_message && (
                <div className="mt-6 text-xl lg:text-2xl text-neutral-300 max-w-3xl">
                  {prop.welcome_message}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom: Wi-Fi + Guide QRs */}
        <div className="grid grid-cols-2 gap-6 lg:gap-10">
          <InfoCard
            title="Wi-Fi"
            qr={wifiQr}
            accent={accent}
            lines={[
              ['Network', prop?.wifi_ssid || '—'],
              ['Password', prop?.wifi_password || '—']
            ]}
            hint="Scan to join automatically"
          />
          <InfoCard
            title="Guest Guide"
            qr={guideQr}
            accent={accent}
            lines={[
              ['Check-in', prop?.check_in_time || '15:00'],
              ['Check-out', prop?.check_out_time || '10:00']
            ]}
            hint="Scan for the full guidebook"
          />
        </div>
      </div>
    </div>
  )
}

function InfoCard({ title, qr, lines, hint, accent }) {
  return (
    <div className="rounded-3xl bg-black/40 backdrop-blur border border-white/10 p-6 lg:p-8 flex items-center gap-6">
      {qr ? (
        <img src={qr} alt="" className="w-28 h-28 lg:w-40 lg:h-40 rounded-xl bg-white p-2" />
      ) : (
        <div className="w-28 h-28 lg:w-40 lg:h-40 rounded-xl bg-white/10" />
      )}
      <div className="min-w-0">
        <div className="text-sm tracking-widest uppercase mb-3" style={{ color: accent }}>{title}</div>
        {lines.map(([k, v]) => (
          <div key={k} className="mb-1">
            <span className="text-neutral-400 text-sm lg:text-base">{k}: </span>
            <span className="font-semibold text-lg lg:text-2xl break-all">{v}</span>
          </div>
        ))}
        <div className="text-neutral-500 text-xs lg:text-sm mt-2">{hint}</div>
      </div>
    </div>
  )
}

function CheckoutCard({ prop, accent, firstName }) {
  const steps = (prop?.checkout_steps || '')
    .split('\n')
    .map((s) => s.replace(/^\s*\d+\.\s*/, '').trim())
    .filter(Boolean)
  return (
    <div className="rounded-3xl bg-black/40 backdrop-blur border border-white/10 p-8 lg:p-10 max-w-4xl">
      <div className="text-sm tracking-widest uppercase mb-2" style={{ color: accent }}>
        Checking out {prop?.check_out_time ? `by ${prop.check_out_time}` : 'tomorrow'}
      </div>
      <div className="text-4xl lg:text-5xl font-bold mb-6">
        {firstName ? `Safe travels, ${firstName}` : 'Before you go'}
      </div>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-lg lg:text-2xl text-neutral-200">
            <span className="font-bold" style={{ color: accent }}>{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
