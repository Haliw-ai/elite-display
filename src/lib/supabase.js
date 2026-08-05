import { createClient } from '@supabase/supabase-js'

// Prefer env vars; fall back to the project's public values so the app also
// runs in environments that don't load .env (e.g. Bolt/StackBlitz imports).
// The anon (publishable) key is browser-safe by design — RLS protects all data.
const FALLBACK_URL = 'https://xwdlcbmbirlaacegvpcy.supabase.co'
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZGxjYm1iaXJsYWFjZWd2cGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTY2NTQsImV4cCI6MjA4OTA3MjY1NH0.AS0BxXrrlpuGdCOJZeo4ByLK6xAe2vbDaW-M11-AjqE'

const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true }
})

// ---- Public RPCs (anon-safe, SECURITY DEFINER) ----
export async function getDisplay(deviceKey) {
  const { data, error } = await supabase.rpc('get_display', { p_device_key: deviceKey })
  if (error) throw error
  return data
}

export async function getGuide(propertyId) {
  const { data, error } = await supabase.rpc('get_guide', { p_property_id: propertyId })
  if (error) throw error
  return data
}

export async function touchDevice(deviceKey) {
  const { data, error } = await supabase.rpc('touch_device', { p_device_key: deviceKey })
  if (error) throw error
  return data
}

// ---- Admin RPCs (require auth + display_admins allowlist) ----
export async function adminListProperties() {
  const { data, error } = await supabase.rpc('admin_list_properties')
  if (error) throw error
  return data
}

export async function adminListReservations(propertyId) {
  const { data, error } = await supabase.rpc('admin_list_reservations', { p_property_id: propertyId })
  if (error) throw error
  return data
}
