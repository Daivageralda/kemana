import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { CaretDown, MagnifyingGlass, TrendDown, TrendUp } from '@phosphor-icons/react'
import Dock from '../components/Dock'
import HeaderRingkas from '../components/HeaderRingkas'
import { semuaCatatan, type Catatan } from '../data/catatan'
import { BAYAR, KATEGORI } from '../data/kategori'
import { ringkas, rupiah, tingkatPanas } from '../lib/ringkasan'

const sq = (r: number, s?: CSSProperties) => ({ '--r': `${r}px`, ...s }) as CSSProperties
const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const jam = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
const kunciBulan = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

export default function Riwayat() {
  const [kini] = useState(() => new Date())
  const [daftar, setDaftar] = useState<Catatan[]>([])
  const [galat, setGalat] = useState(false)
  const [bulan, setBulan] = useState(() => new Date(kini.getFullYear(), kini.getMonth(), 1))
  const [pilih, setPilih] = useState(kini.getDate())

  useEffect(() => {
    semuaCatatan().then(setDaftar, (e) => { console.error(e); setGalat(true) })
  }, [])

  const th = bulan.getFullYear()
  const bl = bulan.getMonth()
  const bulanIni = th === kini.getFullYear() && bl === kini.getMonth()
  // bulan lampau dihitung penuh; bulan berjalan sampai hari ini
  const r = ringkas(daftar, bulanIni ? kini : new Date(th, bl + 1, 0, 23, 59))
  const jumlahHari = new Date(th, bl + 1, 0).getDate()
  const geser = (new Date(th, bl, 1).getDay() + 6) % 7 // kalender mulai Senin

  const tglPilih = new Date(th, bl, pilih)
  const isiHari = daftar
    .filter((c) => { const w = new Date(c.waktu); return w.getFullYear() === th && w.getMonth() === bl && w.getDate() === pilih })
    .sort((a, b) => a.waktu.localeCompare(b.waktu))

  const gantiBulan = (v: string) => {
    if (!v) return
    const [y, m] = v.split('-').map(Number)
    const baru = new Date(y, m - 1, 1)
    if (baru > kini) return // pemilih iOS tidak menghormati max, bulan depan diabaikan
    setBulan(baru)
    setPilih(y === kini.getFullYear() && m - 1 === kini.getMonth() ? kini.getDate() : new Date(y, m, 0).getDate())
  }

  return (
    <main className="k pal-toska screen" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 110px)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
        {/* input bulan bawaan iOS/Android dibuat transparan di atas judul: ketuk judul, muncul pemilih bulan */}
        <label style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, height: 44, fontSize: 24, fontWeight: 800, letterSpacing: -0.6 }}>
          {bulan.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          <CaretDown size={16} weight="bold" />
          <input type="month" aria-label="Pilih bulan" value={kunciBulan(bulan)} max={kunciBulan(kini)} onChange={(e) => gantiBulan(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0 }} />
        </label>
        {/* shortcut: pencarian belum dibuat, tombol hanya tampilan */}
        <button type="button" className="ibtn sq" aria-label="Cari catatan"><MagnifyingGlass size={22} weight="bold" /></button>
      </header>

      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{rupiah(r.total)}</span>
        {r.persen !== null && (
          <span className="pill" style={{ height: 28, background: r.persen > 0 ? 'var(--acc)' : '#D7F0E6', color: 'var(--ink)' }}>
            {r.persen > 0 ? <TrendUp size={14} weight="bold" /> : <TrendDown size={14} weight="bold" />}{Math.abs(r.persen)}%
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600 }}>{galat ? 'Data gagal dibuka' : `${r.jumlahCatatan} catatan`}</span>
      </div>

      <div aria-hidden="true" style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, textAlign: 'center', fontSize: 12, fontWeight: 600 }}>
        {HARI.map((h) => <span key={h}>{h}</span>)}
      </div>
      <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
        {Array.from({ length: geser }, (_, i) => <span key={`k${i}`} />)}
        {Array.from({ length: jumlahHari }, (_, i) => {
          const n = i + 1
          const lewat = n <= r.harian.length
          const v = r.harian[i] ?? 0
          const on = n === pilih
          const cls = on ? 'sel' : lewat ? `hw-${tingkatPanas(v, r.perHari)}` : 'hw-0'
          const hariIniKah = bulanIni && n === kini.getDate()
          return (
            <button key={n} type="button" className={`sq hw ${cls}`} disabled={!lewat} aria-pressed={on}
              aria-label={`${n} ${bulan.toLocaleDateString('id-ID', { month: 'long' })}${lewat ? `, ${rupiah(v)}` : ''}`}
              onClick={() => setPilih(n)} style={lewat ? undefined : { opacity: 0.5 }}>
              {n}{hariIniKah && <span className="today" />}
            </button>
          )
        })}
      </div>
      <div aria-hidden="true" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
        Sedikit
        {[1, 2, 3, 4].map((t) => <span key={t} className={`hw-${t}`} style={{ width: 14, height: 14, borderRadius: 4 }} />)}
        Banyak
      </div>

      <section style={{ marginTop: 20 }} aria-label="Rincian hari terpilih">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.2 }}>
            {tglPilih.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
            {bulanIni && pilih === kini.getDate() ? ' · hari ini' : ''}
          </h2>
          <span className="amt">{rupiah(r.harian[pilih - 1] ?? 0)}</span>
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isiHari.map((c) => {
            const k = KATEGORI.find((x) => x.key === c.kategori) ?? KATEGORI[7]
            const b = BAYAR.find((x) => x.key === c.bayar)
            return (
              <Link key={c.id} to={`/catatan/${c.id}`} className={`sq p-${k.key}`} style={sq(18, { height: 64, padding: '0 14px 0 12px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--p)', color: 'var(--ink)' })}>
                <span className="sq tile" style={sq(12, { width: 40, height: 40, color: 'var(--pi)' })}><k.ikon size={22} weight="fill" /></span>
                <span className="grow">
                  <span className="t1 ell">{c.keterangan || k.nama}</span>
                  <span className="ell" style={{ fontSize: 12, fontWeight: 600, color: '#4F4F57' }}>{c.keterangan ? `${k.nama} · ` : ''}{b?.nama ?? c.bayar} · {jam(c.waktu)}</span>
                </span>
                <span className="amt">{rupiah(c.jumlah)}</span>
              </Link>
            )
          })}
          {isiHari.length === 0 && (
            <div className="sq" style={sq(18, { height: 64, padding: '0 16px', display: 'flex', alignItems: 'center', background: 'var(--card)' })}>
              <span className="t2">Tidak ada pengeluaran di hari ini. Dompet aman.</span>
            </div>
          )}
        </div>
      </section>

      <HeaderRingkas ambang={70} latar="var(--bg)">
        <span style={{ flex: 1, fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>{bulan.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
        <span className="amt">{rupiah(r.total)}</span>
      </HeaderRingkas>
      <Dock aktif="/riwayat" />
    </main>
  )
}
