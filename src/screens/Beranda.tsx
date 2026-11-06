import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CalendarBlank, CaretRight, Plus, TrendDown, TrendUp, UserCircle } from '@phosphor-icons/react'
import Dock from '../components/Dock'
import HeaderRingkas from '../components/HeaderRingkas'
import { semuaCatatan, type Catatan } from '../data/catatan'
import { KATEGORI } from '../data/kategori'
import { ringkas, rupiah, singkat } from '../lib/ringkasan'
import { useStatusBarPutih } from '../lib/statusBar'
import { jejak, periode, type Periode } from '../lib/jejak'

const sq = (r: number, s?: CSSProperties) => ({ '--r': `${r}px`, ...s }) as CSSProperties
const KARTU = 240 // lebar kartu jejak
const jam = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

// latar "Jejak hari ini" per bagian waktu: satu keluarga toska, pagi paling terang, malam paling gelap
const WARNA_WAKTU: Record<Periode, string> = { pagi: '#2A9C8C', siang: '#127A73', sore: '#0B5754', malam: '#073634' }
const PUDAR = 60 // panjang gradasi dari toska ke bagian pertama dan dari bagian terakhir kembali ke toska

// gradasi vertikal: satu titik warna tepat di tengah tiap kartu sesuai jamnya, di antaranya berbaur halus
function latarWaktu(atas: number[], waktu: Periode[]) {
  const stop = ['var(--pri) 0px']
  atas.forEach((y, i) => stop.push(`${WARNA_WAKTU[waktu[i]]} ${y + 32 + PUDAR}px`))
  if (atas.length) stop.push(`var(--pri) ${atas[atas.length - 1] + 64 + PUDAR * 2}px`)
  return `linear-gradient(180deg, ${stop.join(', ')})`
}

const sapaan = (h: number) => `Selamat ${periode(h)}`

export default function Beranda() {
  useStatusBarPutih()
  const [daftar, setDaftar] = useState<Catatan[] | null>(null)
  const [galat, setGalat] = useState(false)
  const isi = useRef<HTMLDivElement>(null)
  const [lebar, setLebar] = useState(350)

  useEffect(() => {
    semuaCatatan().then(setDaftar, (e) => { console.error(e); setGalat(true) })
  }, [])
  useLayoutEffect(() => { if (isi.current) setLebar(isi.current.clientWidth) }, [])

  const [kini] = useState(() => new Date()) // dikunci per kunjungan layar
  const r = ringkas(daftar ?? [], kini)
  const hero = r.total > 0 ? singkat(r.total) : { angka: '0', satuan: '' }
  const bulanLalu = new Date(kini.getFullYear(), kini.getMonth() - 1).toLocaleDateString('id-ID', { month: 'long' })

  // sparkline harian tanggal 1 sampai hari ini
  const maks = Math.max(...r.harian, 1)
  const titik = r.harian.map((v, i) => [4 + (i * (lebar - 8)) / Math.max(r.harian.length - 1, 1), 30 - (v / maks) * 27] as const)
  const garis = titik.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const puncak = r.harian.indexOf(Math.max(...r.harian))
  const akhir = titik[titik.length - 1]

  // jejak hari ini: "Mampir ke mana lagi?" paling atas, lalu semua catatan hari ini dari terbaru ke terlama;
  // kartu & garis berkelok acak tapi tetap sama per catatan
  const stops = r.hariIni
  const tampil = [...stops].reverse()
  const waktuCatatan = tampil.map((c) => periode(new Date(c.waktu).getHours()))
  // tombol "Mampir" ikut waktu catatan teratas, supaya tidak ada loncatan warna di atas jejak
  const waktu = [waktuCatatan[0] ?? periode(kini.getHours()), ...waktuCatatan]
  const tata = jejak([`awal-${stops.length}`, ...tampil.map((c) => c.id)], lebar, KARTU, waktu)
  const posisi = (i: number): CSSProperties => ({ position: 'absolute', top: tata.atas[i], left: tata.kiri[i] })
  const tinggiJejak = tata.tinggi

  return (
    <main className="k pal-toska screen" style={{ background: 'var(--pri)', color: '#fff', paddingBottom: 'calc(env(safe-area-inset-bottom) + 110px)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600 }}>{sapaan(kini.getHours())}</p>
          <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>{kini.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
        </div>
        {/* shortcut: notifikasi belum ada, tombol hanya tampilan sampai pengingat dibuat */}
        <button type="button" className="ibtn sq" style={{ background: 'var(--bg)', color: 'var(--pri)' }} aria-label="Notifikasi"><Bell size={22} weight="fill" /></button>
        <Link to="/profil" className="ibtn sq" style={{ background: 'var(--bg)', color: 'var(--pri)' }} aria-label="Profil"><UserCircle size={24} weight="fill" /></Link>
      </header>

      <div ref={isi}>
        <p style={{ marginTop: 22, fontSize: 14, fontWeight: 600 }}>Keluar bulan ini</p>
        <p style={{ display: 'flex', alignItems: 'baseline', gap: 4, lineHeight: 0.95 }}>
          <span style={{ fontSize: 22, fontWeight: 700 }}>Rp</span>
          <span style={{ fontSize: 96, fontWeight: 800, letterSpacing: -4 }}>{hero.angka}</span>
          {hero.satuan && <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--acc)' }}>{hero.satuan}</span>}
        </p>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {r.persen !== null && (
            <span className="pill" style={{ background: r.persen > 0 ? 'var(--acc)' : '#D7F0E6', color: 'var(--ink)' }}>
              {r.persen > 0 ? <TrendUp size={16} weight="bold" /> : <TrendDown size={16} weight="bold" />}
              {Math.abs(r.persen)}% dari {bulanLalu}
            </span>
          )}
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {galat ? 'Data gagal dibuka' : `${r.jumlahCatatan} catatan · Rp ${singkat(r.perHari).angka}${singkat(r.perHari).satuan}/hari`}
          </span>
        </div>

        {r.harian.length > 1 && (
          <svg viewBox={`0 0 ${lebar} 36`} width={lebar} height={36} fill="none" role="img" style={{ display: 'block', marginTop: 14 }}
            aria-label={`Grafik pengeluaran harian tanggal 1 sampai ${kini.getDate()}, puncaknya tanggal ${puncak + 1} ${rupiah(r.harian[puncak])}`}>
            <polygon points={`${garis} ${lebar - 4},36 4,36`} fill="#fff" fillOpacity={0.1} />
            <polyline points={garis} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={akhir[0]} cy={akhir[1]} r={4.5} strokeWidth={2} style={{ fill: 'var(--acc)', stroke: 'var(--pri)' }} />
          </svg>
        )}

        <div style={{ position: 'relative', zIndex: 1, marginTop: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>Jejak hari ini</h2>
          <span className="pill" style={{ background: '#D7F0E6', color: 'var(--ink)' }}>
            {stops.length ? `${stops.length} titik · ${rupiah(r.totalHariIni)}` : 'Belum ada'}
          </span>
        </div>

        <div style={{ position: 'relative', height: tinggiJejak, marginTop: 14, marginBottom: PUDAR }}>
          {/* latar selebar layar: keluar dari padding halaman 20px kiri-kanan */}
          <div aria-hidden="true" style={{ position: 'absolute', left: -20, right: -20, top: -PUDAR, height: tinggiJejak + PUDAR * 2, background: latarWaktu(tata.atas, waktu) }} />
          <svg viewBox={`0 0 ${lebar} ${tinggiJejak}`} width={lebar} height={tinggiJejak} fill="none" aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0 }}>
            <path d={tata.garis} stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeDasharray="0.5 9" />
          </svg>
          <Link to="/catat" className="lift" style={posisi(0)}>
            <span className="sq" style={sq(18, { minWidth: KARTU, height: 64, whiteSpace: 'nowrap', padding: '0 14px 0 12px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', color: 'var(--ink)' })}>
              <span className="sq" style={sq(11, { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--pri-soft)', color: 'var(--pri)' })}>
                <Plus size={18} weight="bold" />
              </span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{stops.length ? 'Mampir ke mana lagi?' : 'Hari ini ke mana aja?'}</span>
            </span>
          </Link>
          {tampil.map((c, i) => {
            const k = KATEGORI.find((x) => x.key === c.kategori) ?? KATEGORI[7]
            const s = singkat(c.jumlah)
            return (
              <Link key={c.id} to={`/catatan/${c.id}`} className={`lift p-${k.key}`} style={posisi(i + 1)}>
                <span className="sq" style={sq(18, { width: KARTU, height: 64, padding: '0 14px 0 12px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--p)', color: 'var(--ink)' })}>
                  <span className="sq" style={sq(12, { width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#fff', color: 'var(--pi)' })}>
                    <k.ikon size={22} weight="fill" />
                  </span>
                  <span className="grow">
                    <span className="ell" style={{ fontSize: 15, fontWeight: 700 }}>{c.keterangan || k.nama}</span>
                    <span className="ell" style={{ fontSize: 12, fontWeight: 600, color: '#4F4F57' }}>{jam(c.waktu)}{c.keterangan ? ` · ${k.nama}` : ''}</span>
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap' }}>{s.angka}{s.satuan}</span>
                </span>
              </Link>
            )
          })}
        </div>

        <Link to="/riwayat" className="sq" style={sq(16, { marginTop: 14, height: 52, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', color: 'var(--ink)' })}>
          <span style={{ display: 'flex', color: 'var(--pri)' }}><CalendarBlank size={20} weight="fill" /></span>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>
            Kemarin · {r.kemarin.tanggal.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <span className="amt">{rupiah(r.kemarin.total)}</span>
          <span style={{ display: 'flex', color: 'var(--ink2)' }}><CaretRight size={14} weight="bold" /></span>
        </Link>
      </div>

      {/* header ringkas muncul begitu angka besar "Keluar bulan ini" tergulir lewat atas */}
      <HeaderRingkas ambang={210} latar="var(--pri)">
        <span style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>Rp {hero.angka}<span style={{ color: 'var(--acc)' }}>{hero.satuan}</span></span>
          <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.8 }}>keluar bulan ini</span>
        </span>
        <Link to="/profil" className="ibtn sq" style={sq(11, { width: 36, height: 36, background: 'var(--bg)', color: 'var(--pri)' })} aria-label="Profil"><UserCircle size={20} weight="fill" /></Link>
      </HeaderRingkas>
      <Dock aktif="/" />
    </main>
  )
}
