// Timezone-aware helpers using Intl (no external tz library needed).

export function nowParts(timeZone) {
  const tz = timeZone || 'Africa/Johannesburg'
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false
  })
  const dateFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, weekday: 'long', day: 'numeric', month: 'long'
  })
  const now = new Date()
  return { time: fmt.format(now), date: dateFmt.format(now) }
}

// yyyy-mm-dd for "today" in a given timezone
export function todayInTz(timeZone) {
  const tz = timeZone || 'Africa/Johannesburg'
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date())
  const get = (t) => parts.find((p) => p.type === t)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

// Current hour (0-23) in a given timezone
export function hourInTz(timeZone) {
  const tz = timeZone || 'Africa/Johannesburg'
  const h = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour: '2-digit', hour12: false
  }).format(new Date())
  return parseInt(h, 10)
}

function addDays(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

// Show the checkout card once we are into the evening (>=18:00) the day
// BEFORE checkout, and all through checkout day itself.
export function showCheckout(checkOutDate, timeZone) {
  if (!checkOutDate) return false
  const today = todayInTz(timeZone)
  const dayBefore = addDays(checkOutDate, -1)
  if (today > checkOutDate) return false      // already gone
  if (today === checkOutDate) return true     // checkout morning
  if (today === dayBefore && hourInTz(timeZone) >= 18) return true
  return false
}
