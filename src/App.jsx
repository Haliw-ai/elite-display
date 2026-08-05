import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Display from './pages/Display.jsx'
import Guide from './pages/Guide.jsx'
import AdminApp from './pages/admin/AdminApp.jsx'

function Home() {
  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-sm tracking-[0.3em] text-neutral-500 uppercase">Elite Accommodation</div>
        <h1 className="text-3xl font-semibold">ELITE Display</h1>
        <p className="text-neutral-400">In-room guest information system.</p>
        <div className="grid gap-3 text-left">
          <Link to="/display?device=ELITEDEMO" className="rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 hover:border-neutral-600">
            <div className="font-medium">TV Display (demo)</div>
            <div className="text-sm text-neutral-500">/display?device=ELITEDEMO</div>
          </Link>
          <Link to="/guide?property=44869e0c-79e5-4e6a-9b27-c8124da7460d" className="rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 hover:border-neutral-600">
            <div className="font-medium">Phone Guide (demo)</div>
            <div className="text-sm text-neutral-500">/guide?property=…</div>
          </Link>
          <Link to="/admin" className="rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 hover:border-neutral-600">
            <div className="font-medium">Admin</div>
            <div className="text-sm text-neutral-500">/admin</div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/display" element={<Display />} />
      <Route path="/guide" element={<Guide />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
