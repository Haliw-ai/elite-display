import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env')
}

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
