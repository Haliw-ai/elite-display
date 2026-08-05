import QRCode from 'qrcode'

export async function qrDataUrl(text, opts = {}) {
  if (!text) return ''
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: opts.width || 320,
      color: {
        dark: opts.dark || '#0b0b0c',
        light: opts.light || '#ffffff'
      }
    })
  } catch (e) {
    console.error('QR error', e)
    return ''
  }
}

// Standard Wi-Fi join payload (Android/iOS camera recognises this)
export function wifiPayload(ssid, password) {
  if (!ssid) return ''
  const esc = (s) => String(s || '').replace(/([\\;,:"])/g, '\\$1')
  return `WIFI:T:WPA;S:${esc(ssid)};P:${esc(password)};;`
}
