import { Link } from 'react-router-dom'
import { ChartPieSlice, House, Plus, Receipt } from '@phosphor-icons/react'

const TAB = [
  { to: '/', label: 'Beranda', Ikon: House },
  { to: '/riwayat', label: 'Riwayat', Ikon: Receipt },
  { to: '/statistik', label: 'Statistik', Ikon: ChartPieSlice },
]

// dock asimetris V7, menempel di bawah layar walau halaman digulir
export default function Dock({ aktif }: { aktif: '/' | '/riwayat' | '/statistik' }) {
  return (
    <nav className="dock" aria-label="Navigasi utama" style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
      <div className="sq dock-in">
        {TAB.map(({ to, label, Ikon }) => (
          <Link key={to} to={to} className={to === aktif ? 'nv on' : 'nv'} aria-current={to === aktif ? 'page' : undefined} aria-label={label}>
            <Ikon size={24} weight="fill" />
          </Link>
        ))}
      </div>
      <Link to="/catat" className="sq dock-add" aria-label="Catat pengeluaran"><Plus size={26} weight="bold" /></Link>
    </nav>
  )
}
