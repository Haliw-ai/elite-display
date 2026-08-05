import { useEffect, useState } from 'react'
import { supabase, adminListProperties } from '../../lib/supabase.js'
import ContentEditor from './ContentEditor.jsx'
import ListEditor from './ListEditor.jsx'
import Devices from './Devices.jsx'
import Reservations from './Reservations.jsx'

const TABS = ['Content', 'House Manual', 'Recommendations', 'Devices', 'Reservations']

export default function Dashboard({ session }) {
  const [props, setProps] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('Content')

  async function loadProps() {
    try { setProps(await adminListProperties()) }
    catch (e) {
      setError(e.message?.includes('not authorized')
        ? 'Your account is not on the display admin allowlist.'
        : (e.message || 'Failed to load properties.'))
    }
  }
  useEffect(() => { loadProps() }, [])

  if (error) {
    return (
      <Shell email={session.user.email}>
        <div className="text-red-400">{error}</div>
      </Shell>
    )
  }
  if (!props) {
    return <Shell email={session.user.email}><div className="text-neutral-500">Loading properties…</div></Shell>
  }

  if (!selected) {
    return (
      <Shell email={session.user.email}>
        <h2 className="text-lg font-semibold mb-4">Properties ({props.length})</h2>
        <div className="grid gap-2">
          {props.map((p) => (
            <button key={p.id} onClick={() => { setSelected(p); setTab('Content') }}
              className="text-left rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 hover:border-neutral-600">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{p.public_name || p.name}</div>
                <div className="flex items-center gap-2 text-xs">
                  {p.is_published
                    ? <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">Published</span>
                    : p.has_content
                      ? <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">Draft</span>
                      : <span className="px-2 py-0.5 rounded-full bg-neutral-700/40 text-neutral-400">No content</span>}
                  {p.device_count > 0 && <span className="text-neutral-500">{p.device_count} device(s)</span>}
                </div>
              </div>
              <div className="text-sm text-neutral-500">{p.city}{p.archived ? ' · archived' : ''}</div>
            </button>
          ))}
        </div>
      </Shell>
    )
  }

  return (
    <Shell email={session.user.email}>
      <button onClick={() => { setSelected(null); loadProps() }} className="text-sm text-neutral-400 hover:text-white mb-3">← All properties</button>
      <h2 className="text-xl font-semibold">{selected.public_name || selected.name}</h2>
      <div className="text-sm text-neutral-500 mb-4">{selected.city}</div>

      <div className="flex flex-wrap gap-2 mb-5 border-b border-neutral-800 pb-3">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm ${tab === t ? 'bg-[#C8A97E] text-black font-medium' : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Content' && <ContentEditor property={selected} />}
      {tab === 'House Manual' && (
        <ListEditor
          property={selected}
          table="display_house_manual_items"
          fields={[
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'body', label: 'Body', type: 'textarea' },
            { key: 'sort_order', label: 'Sort order', type: 'number' }
          ]}
          titleField="title"
        />
      )}
      {tab === 'Recommendations' && (
        <ListEditor
          property={selected}
          table="display_recommendations"
          fields={[
            { key: 'category', label: 'Category', type: 'select',
              options: ['coffee', 'beach', 'restaurant', 'grocery', 'pharmacy', 'sundowners'] },
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'walk_time', label: 'Walk time', type: 'text' },
            { key: 'map_url', label: 'Map URL', type: 'text' },
            { key: 'image_url', label: 'Image URL', type: 'text' },
            { key: 'sort_order', label: 'Sort order', type: 'number' }
          ]}
          titleField="name"
        />
      )}
      {tab === 'Devices' && <Devices property={selected} onChange={loadProps} />}
      {tab === 'Reservations' && <Reservations property={selected} />}
    </Shell>
  )
}

function Shell({ email, children }) {
  return (
    <div className="min-h-full">
      <header className="border-b border-neutral-800 px-5 py-3 flex items-center justify-between sticky top-0 bg-neutral-950/90 backdrop-blur z-10">
        <div className="text-sm tracking-[0.25em] uppercase text-[#C8A97E]">ELITE Display · Admin</div>
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <span className="hidden sm:inline">{email}</span>
          <button onClick={() => supabase.auth.signOut()} className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-600">Sign out</button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-5">{children}</main>
    </div>
  )
}
