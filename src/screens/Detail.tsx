import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CaretLeft, Copy, CreditCard, DeviceMobile, Lightbulb, Money, PencilSimple, QrCode, Trash } from '@phosphor-icons/react'
import { ambilCatatan, hapusCatatan, semuaCatatan, simpanCatatan, type Catatan } from '../data/catatan'
import { BAYAR, KATEGORI } from '../data/kategori'
import { rupiah } from '../lib/ringkasan'
import { wawasanDetail } from '../lib/statistik'
import { useStatusBarPutih } from '../lib/statusBar'

const sq = (r: number, s?: CSSProperties) => ({ '--r': `${r}px`, ...s }) as CSSProperties
const IKON_BAYAR = { tunai: Money, debit: CreditCard, ewallet: DeviceMobile, qris: QrCode }

function Baris({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
      <span className="t2">{label}</span>{children}
    </div>
  )
}

// barcode hiasan yang tetap sama untuk catatan yang sama
const batang = (id: string) => [...id.replace(/-/g, '').slice(0, 32)].map((h) => (parseInt(h, 16) % 4) + 1)

export default function Detail() {
  useStatusBarPutih()
  const { id = '' } = useParams()
  const nav = useNavigate()
  const [c, setC] = useState<Catatan | null | undefined>(undefined)
  const [semua, setSemua] = useState<Catatan[]>([])
  const [sibuk, setSibuk] = useState(false)

  useEffect(() => {
    Promise.all([ambilCatatan(id), semuaCatatan()]).then(([x, s]) => { setC(x ?? null); setSemua(s) }, (e) => { console.error(e); setC(null) })
  }, [id])

  if (c === undefined) return <main className="k pal-toska screen" style={{ background: 'var(--pri)' }} />
  if (c === null) {
    return (
      <main className="k pal-toska screen" style={{ background: 'var(--pri)', color: '#fff' }}>
        <button type="button" className="ibtn sq" style={{ background: 'var(--bg)', color: 'var(--pri)' }} aria-label="Kembali" onClick={() => nav(-1)}><CaretLeft size={18} weight="bold" /></button>
        <p style={{ marginTop: 24, fontSize: 18, fontWeight: 700 }}>Catatan ini tidak ditemukan atau sudah dihapus.</p>
      </main>
    )
  }

  const k = KATEGORI.find((x) => x.key === c.kategori) ?? KATEGORI[7]
  const b = BAYAR.find((x) => x.key === c.bayar)
  const IkonBayar = IKON_BAYAR[c.bayar] ?? Money
  const w = new Date(c.waktu)
  const ws = wawasanDetail(semua, c)

  const hapus = async () => {
    if (!confirm(`Hapus catatan ${rupiah(c.jumlah)} ini? Tidak bisa dibatalkan.`)) return
    setSibuk(true)
    try {
      await hapusCatatan(c.id)
      nav(-1)
    } catch (e) {
      console.error(e)
      alert('Catatan gagal dihapus. Coba lagi, ya.')
      setSibuk(false)
    }
  }
  const duplikat = async () => {
    setSibuk(true)
    try {
      const baru = await simpanCatatan({ jumlah: c.jumlah, keterangan: c.keterangan, kategori: c.kategori, bayar: c.bayar })
      nav(`/catatan/${baru.id}`, { replace: true })
    } catch (e) {
      console.error(e)
      alert('Gagal menduplikat catatan. Coba lagi, ya.')
    }
    setSibuk(false)
  }

  return (
    <main className="k pal-toska screen" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--pri)', color: '#fff' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, flexShrink: 0 }}>
        <button type="button" className="ibtn sq" style={{ background: 'var(--bg)', color: 'var(--pri)' }} aria-label="Kembali" onClick={() => nav(-1)}><CaretLeft size={18} weight="bold" /></button>
        <h1 style={{ fontSize: 16, fontWeight: 700 }}>Struk digital</h1>
        <button type="button" className="ibtn sq" style={{ background: 'var(--bg)', color: 'var(--pri)' }} aria-label="Ubah catatan" onClick={() => nav(`/catatan/${c.id}/ubah`)}><PencilSimple size={22} weight="fill" /></button>
      </header>

      <div className="lift" style={{ position: 'relative', marginTop: 16, flexShrink: 0 }}>
        <section className="sq" style={sq(28, { padding: '22px 22px 30px', background: 'var(--bg)', color: 'var(--ink)' })} aria-label="Struk catatan">
          <div className={`p-${k.key}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="sq tile" style={sq(15, { width: 48, height: 48, background: 'var(--p)', color: 'var(--pi)' })}><k.ikon size={26} weight="fill" /></span>
            <div style={{ minWidth: 0 }}>
              <p className="ell" style={{ fontSize: 17, fontWeight: 800 }}>{c.keterangan || k.nama}</p>
              <p className="t2">{c.keterangan ? k.nama : 'Tanpa keterangan'}</p>
            </div>
          </div>
          <div aria-hidden="true" style={{ margin: '16px 0', borderTop: '2px dashed #D5D5DC' }} />
          <Baris label="Tanggal"><span style={{ fontSize: 15, fontWeight: 600 }}>{w.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span></Baris>
          <Baris label="Waktu"><span style={{ fontSize: 15, fontWeight: 600 }}>{w.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></Baris>
          <Baris label="Kategori">
            <span className={`pill p-${k.key}`} style={{ height: 28, padding: '0 10px 0 8px', background: 'var(--p)' }}>
              <span style={{ display: 'flex', color: 'var(--pi)' }}><k.ikon size={16} weight="fill" /></span>{k.nama}
            </span>
          </Baris>
          <Baris label="Bayar pakai"><span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600 }}><IkonBayar size={16} weight="fill" />{b?.nama ?? c.bayar}</span></Baris>
          <div aria-hidden="true" style={{ margin: '16px 0 12px', borderTop: '2px dashed #D5D5DC' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>{rupiah(c.jumlah)}</span>
          </div>
          <div aria-hidden="true" style={{ marginTop: 16, height: 40, display: 'flex', justifyContent: 'center', gap: 2 }}>
            {batang(c.id).map((l, i) => <span key={i} style={{ width: l, background: 'var(--ink)' }} />)}
          </div>
          <p className="t2" style={{ marginTop: 6, textAlign: 'center', fontSize: 12, fontWeight: 600, letterSpacing: 2 }}>#KMN-{c.id.slice(0, 8).toUpperCase()}</p>
        </section>
        <div aria-hidden="true" style={{ position: 'absolute', left: 14, right: 14, bottom: -9, height: 18, display: 'flex', justifyContent: 'space-between' }}>
          {Array.from({ length: 11 }, (_, i) => <span key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--pri)' }} />)}
        </div>
      </div>

      <div className={`sq p-${k.key}`} style={sq(20, { marginTop: 24, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--p)', color: 'var(--ink)' })}>
        <span className="sq" style={sq(12, { width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--acc)', color: 'var(--ink)' })}><Lightbulb size={22} weight="fill" /></span>
        <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
          {ws.serupa
            ? `${c.keterangan} ke-${ws.ke} bulan ini. Totalnya ${rupiah(ws.total)}, ${ws.persen}% dari pengeluaran ${k.nama}.`
            : `Pengeluaran ${k.nama} ke-${ws.ke} bulan ini. Totalnya sejauh ini ${rupiah(ws.total)}.`}
        </p>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, flexShrink: 0 }}>
        <button type="button" className="btn sq" disabled={sibuk} onClick={duplikat} style={sq(16, { height: 52, background: 'var(--bg)', color: 'var(--ink)' })}><Copy size={20} weight="fill" />Duplikat</button>
        <button type="button" className="btn sq" disabled={sibuk} onClick={hapus} style={sq(16, { height: 52, background: 'var(--crit-soft)', color: 'var(--crit)' })}><Trash size={20} weight="fill" />Hapus</button>
      </div>
    </main>
  )
}
