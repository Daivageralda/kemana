import { useLayoutEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'
import Beranda from './screens/Beranda'
import Catat from './screens/Catat'
import Riwayat from './screens/Riwayat'
import Detail from './screens/Detail'
import Statistik from './screens/Statistik'
import Profil from './screens/Profil'
import Sambutan from './screens/Sambutan'
import { sudahDisambut } from './lib/sambutan'

// dibaca saat rute dibuka, bukan saat App pertama render, supaya "Mulai catat" langsung ke Beranda
function Gerbang() {
  return sudahDisambut() ? <Beranda /> : <Navigate to="/sambutan" replace />
}

// alamat yang tidak dikenal
function TidakAda() {
  return (
    <main className="k pal-toska screen">
      <Link to="/" className="ibtn sq" aria-label="Kembali ke beranda"><CaretLeft size={18} weight="bold" /></Link>
      <h1 className="h1" style={{ marginTop: 16 }}>Nyasar, nih</h1>
      <p className="t2" style={{ marginTop: 8 }}>Halaman ini tidak ada. Balik ke beranda, yuk.</p>
    </main>
  )
}

export default function App() {
  // tiap pindah halaman mulai dari atas (posisi gulir jendela tidak ikut terbawa ke halaman lain)
  const { pathname } = useLocation()
  useLayoutEffect(() => window.scrollTo(0, 0), [pathname])
  return (
    <Routes>
      <Route path="/" element={<Gerbang />} />
      <Route path="/sambutan" element={<Sambutan />} />
      <Route path="/catat" element={<Catat />} />
      <Route path="/riwayat" element={<Riwayat />} />
      <Route path="/catatan/:id" element={<Detail />} />
      <Route path="/catatan/:id/ubah" element={<Catat />} />
      <Route path="/statistik" element={<Statistik />} />
      <Route path="/profil" element={<Profil />} />
      <Route path="*" element={<TidakAda />} />
    </Routes>
  )
}
