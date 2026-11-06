import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Backspace, Camera, Check, Lightbulb, NotePencil, X } from '@phosphor-icons/react'
import { BAYAR, KATEGORI, type BayarKey, type KategoriKey } from '../data/kategori'
import { simpanCatatan } from '../data/catatan'
import { tekan } from '../lib/tekan'
import { useStatusBarPutih } from '../lib/statusBar'

const sq = (r: number, s?: CSSProperties) => ({ '--r': `${r}px`, ...s }) as CSSProperties
const TOMBOL = ['1', '2', '3', 'del', '4', '5', '6', '7', '8', '9', '000', '0'] as const

export default function Catat() {
  const nav = useNavigate()
  const [jumlah, setJumlah] = useState('0')
  const [ket, setKet] = useState('')
  const [kat, setKat] = useState<KategoriKey>('makan')
  const [bayar, setBayar] = useState<BayarKey>('qris')
  const katAktif = KATEGORI.find((k) => k.key === kat)!

  useStatusBarPutih()

  const [menyimpan, setMenyimpan] = useState(false)
  const kosong = jumlah === '0' || menyimpan

  const simpan = async () => {
    if (kosong) return
    setMenyimpan(true)
    try {
      await simpanCatatan({ jumlah: Number(jumlah), keterangan: ket.trim(), kategori: kat, bayar })
      nav('/')
    } catch (e) {
      // isian tetap di layar supaya tidak hilang dan bisa dicoba lagi
      console.error(e)
      alert('Catatan gagal disimpan. Coba lagi, ya.')
      setMenyimpan(false)
    }
  }

  return (
    <main className="k pal-toska screen" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ink)', color: '#fff' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, flexShrink: 0 }}>
        <button type="button" className="ibtn sq glass" aria-label="Tutup" onClick={() => nav(-1)}><X size={18} weight="bold" /></button>
        <h1 style={{ fontSize: 16, fontWeight: 700 }}>Catat pengeluaran</h1>
        {/* shortcut: foto struk belum jalan, butuh @capacitor/camera + OCR */}
        <button type="button" className="ibtn sq glass" aria-label="Foto struk"><Camera size={22} weight="fill" /></button>
      </header>

      <div style={{ marginTop: 20, textAlign: 'center', flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Jumlah</p>
        <p aria-live="polite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 64, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.15 }}>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: 0, color: 'var(--acc)' }}>Rp</span>
          {Number(jumlah).toLocaleString('id-ID')}
          <span aria-hidden="true" style={{ width: 3, height: 52, borderRadius: 2, background: 'var(--acc)' }} />
        </p>
      </div>

      <label className="sq glass" style={sq(16, { marginTop: 16, height: 52, padding: '0 8px 0 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 })}>
        <span style={{ display: 'flex', color: 'rgba(255,255,255,.6)' }}><NotePencil size={20} weight="fill" /></span>
        <span className="vh">Catatan</span>
        <input type="text" value={ket} onChange={(e) => setKet(e.target.value)} placeholder="Beli apa tadi?" autoCorrect="off" spellCheck={false} style={{ fontSize: 16, fontWeight: 600 }} />
        <span className={`pill p-${kat}`} style={{ height: 34, background: 'var(--p)', color: 'var(--ink)', fontSize: 12, flexShrink: 0 }}>
          <span style={{ display: 'flex', color: 'var(--pi)' }}><Lightbulb size={14} weight="fill" /></span>{katAktif.nama}
        </span>
      </label>

      <div className="geser" style={{ marginTop: 18, marginRight: -20, paddingRight: 20, display: 'flex', gap: 10, overflowX: 'auto', flexShrink: 0 }}>
        {KATEGORI.map(({ key, nama, ikon: Ikon }) => {
          const on = key === kat
          return (
            <button key={key} type="button" className={`p-${key}`} aria-pressed={on} onClick={() => setKat(key)}
              style={{ width: 66, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span className="sq" style={sq(18, { width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--p)' : 'rgba(255,255,255,.08)', color: on ? 'var(--pi)' : 'var(--p)' })}>
                <Ikon size={26} weight="fill" />
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: on ? '#fff' : 'rgba(255,255,255,.6)' }}>{nama}</span>
            </button>
          )
        })}
      </div>

      <div className="sq glass" role="group" aria-label="Bayar pakai" style={sq(14, { marginTop: 14, height: 44, padding: 4, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 4, flexShrink: 0 })}>
        {BAYAR.map(({ key, nama }) => {
          const on = key === bayar
          return (
            <button key={key} type="button" className="sq" aria-pressed={on} onClick={() => setBayar(key)}
              style={sq(11, { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: on ? '#fff' : 'transparent', color: on ? 'var(--ink)' : 'rgba(255,255,255,.75)' })}>
              {nama}
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gridAutoRows: 58, gap: 8, flexShrink: 0 }}>
        <button type="button" className="kd sq" onClick={simpan} disabled={kosong}
          style={{ gridColumn: 4, gridRow: '2 / 5', flexDirection: 'column', gap: 8, background: 'var(--acc)', color: 'var(--ink)', fontSize: 15, fontWeight: 800, opacity: kosong ? 0.5 : 1 }}>
          <Check size={26} weight="bold" />Simpan
        </button>
        {TOMBOL.map((k) => (
          <button key={k} type="button" className="kd sq" aria-label={k === 'del' ? 'Hapus angka terakhir' : k}
            onClick={() => setJumlah((cur) => tekan(cur, k))} style={{ gridColumn: k === '0' ? 'span 2' : 'auto' }}>
            {k === 'del' ? <Backspace size={26} weight="fill" /> : k}
          </button>
        ))}
      </div>
    </main>
  )
}
