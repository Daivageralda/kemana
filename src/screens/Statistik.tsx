import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb } from '@phosphor-icons/react'
import Dock from '../components/Dock'
import HeaderRingkas from '../components/HeaderRingkas'
import { semuaCatatan, type Catatan } from '../data/catatan'
import { KATEGORI } from '../data/kategori'
import { rupiah, singkat } from '../lib/ringkasan'
import { statistik, type Rentang } from '../lib/statistik'

const sq = (r: number, s?: CSSProperties) => ({ '--r': `${r}px`, ...s }) as CSSProperties
const RENTANG: { key: Rentang; nama: string; judul: string }[] = [
  { key: 'minggu', nama: 'Minggu', judul: 'Minggu ini' },
  { key: 'bulan', nama: 'Bulan', judul: 'Bulan ini' },
  { key: 'tahun', nama: 'Tahun', judul: 'Tahun ini' },
]
const info = (key: string) => KATEGORI.find((x) => x.key === key) ?? KATEGORI[7]
const rb = (n: number) => { const s = singkat(n); return `Rp ${s.angka}${s.satuan}` }

function Naik({ persen }: { persen: number }) {
  return <span className="pill" style={{ height: 24, padding: '0 8px', fontSize: 11, background: 'var(--ink)', color: '#fff' }}>+{persen}%</span>
}

export default function Statistik() {
  const [kini] = useState(() => new Date())
  const [daftar, setDaftar] = useState<Catatan[]>([])
  const [galat, setGalat] = useState(false)
  const [rentang, setRentang] = useState<Rentang>('bulan')

  useEffect(() => {
    semuaCatatan().then(setDaftar, (e) => { console.error(e); setGalat(true) })
  }, [])

  const s = statistik(daftar, rentang, kini)
  const kat = s.kategori
  const judul = RENTANG.find((r) => r.key === rentang)!.judul
  // tandai satu kategori yang paling melonjak dibanding periode sebelumnya (minimal +10%)
  const lonjak = kat.filter((k) => (k.naik ?? 0) >= 10).sort((a, b) => (b.naik ?? 0) - (a.naik ?? 0))[0]?.key

  return (
    <main className="k pal-toska screen" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 110px)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6 }}>Statistik</h1>
        <div className="sq" role="group" aria-label="Rentang waktu" style={sq(13, { height: 44, padding: 4, display: 'flex', gap: 2, background: 'var(--ink)' })}>
          {RENTANG.map((r) => {
            const on = r.key === rentang
            return (
              <button key={r.key} type="button" className={on ? 'sq' : undefined} aria-pressed={on} onClick={() => setRentang(r.key)}
                style={on ? sq(10, { padding: '0 12px', fontSize: 12, fontWeight: 800, background: 'var(--acc)', color: 'var(--ink)' }) : { padding: '0 10px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.75)' }}>
                {r.nama}
              </button>
            )
          })}
        </div>
      </header>

      {kat.length === 0 ? (
        <div className="sq" style={sq(20, { marginTop: 20, padding: 20, background: 'var(--card)' })}>
          <p className="t1">{galat ? 'Data gagal dibuka.' : `${judul} belum ada catatan.`}</p>
          <p className="t2" style={{ marginTop: 4 }}>Catat pengeluaran dulu, nanti ketahuan uangmu ke mana.</p>
        </div>
      ) : (
        <>
          <h2 style={{ marginTop: 20, fontSize: 32, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.1 }}>
            {judul}, uangmu<br />paling banyak ke<br /><span className="mark">{info(kat[0].key).nama}.</span>
          </h2>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {kat.map((k, i) => {
              const { nama, ikon: Ikon } = info(k.key)
              const pill = k.key === lonjak && k.naik !== null ? <Naik persen={k.naik} /> : null
              if (i === 0) {
                return (
                  <Link key={k.key} to="/riwayat" className="sq" style={sq(26, { gridRow: kat.length >= 3 ? 'span 2' : undefined, gridColumn: kat.length === 1 ? '1 / 3' : undefined, minHeight: 132, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12, background: 'var(--pri)', color: '#fff' })}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`sq pti p-${k.key}`} style={sq(12, { width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' })}><Ikon size={22} weight="fill" /></span>
                      {pill}
                    </span>
                    <span style={{ fontSize: 60, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>{k.persen}%</span>
                    <span>
                      <span style={{ display: 'block', fontSize: 16, fontWeight: 700 }}>{nama}</span>
                      <span className="ell" style={{ display: 'block', fontSize: 12, fontWeight: 500 }}>{rupiah(k.total)}{k.contoh.length ? ` · ${k.contoh.join(', ')}` : ''}</span>
                    </span>
                  </Link>
                )
              }
              if (i <= 2) {
                return (
                  <Link key={k.key} to="/riwayat" className={`sq p-${k.key}`} style={sq(20, { height: 132, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--p)', color: 'var(--ink)' })}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--pi)' }}><Ikon size={22} weight="fill" />{pill}</span>
                    <span>
                      <span style={{ display: 'block', fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1.05 }}>{k.persen}%</span>
                      <span className="ell" style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>{nama} · {rb(k.total)}</span>
                    </span>
                  </Link>
                )
              }
              if (i <= 4) {
                return (
                  <Link key={k.key} to="/riwayat" className={`sq p-${k.key}`} style={sq(20, { height: 72, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--p)', color: 'var(--ink)' })}>
                    <span style={{ display: 'flex', color: 'var(--pi)' }}><Ikon size={24} weight="fill" /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 22, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.05 }}>{k.persen}%</span>
                      <span className="ell" style={{ display: 'block', fontSize: 12, fontWeight: 700 }}>{nama}</span>
                    </span>
                    {pill}
                  </Link>
                )
              }
              return (
                <Link key={k.key} to="/riwayat" className={`sq p-${k.key}`} style={sq(16, { gridColumn: '1 / 3', height: 56, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--p)', color: 'var(--ink)' })}>
                  <span style={{ display: 'flex', color: 'var(--pi)' }}><Ikon size={22} weight="fill" /></span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{nama}</span>
                  <span aria-hidden="true" style={{ flex: 1, height: 8, borderRadius: 999, background: '#fff', overflow: 'hidden' }}>
                    <i style={{ display: 'block', width: `${Math.max(4, (k.persen / kat[0].persen) * 100)}%`, height: '100%', borderRadius: 999, background: 'var(--pi)' }} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>{k.persen}% · {rb(k.total)}</span>
                  {pill}
                </Link>
              )
            })}
          </div>

          {s.hariBoros && (
            <div className="sq ins" style={{ marginTop: 12 }}>
              <span className="sq ins-ic"><Lightbulb size={22} weight="fill" /></span>
              <div>
                <p className="t1">{s.hariBoros.nama} hari paling boros</p>
                <p className="t2" style={{ color: 'var(--ink)' }}>Rata-rata {rb(s.hariBoros.rata)} tiap {s.hariBoros.nama}</p>
              </div>
            </div>
          )}
        </>
      )}

      <HeaderRingkas ambang={150} latar="var(--bg)">
        <span style={{ flex: 1, fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>Statistik <span style={{ color: 'var(--ink2)', fontWeight: 600 }}>· {judul.toLowerCase()}</span></span>
        <span className="amt">{rb(s.total)}</span>
      </HeaderRingkas>
      <Dock aktif="/statistik" />
    </main>
  )
}
