import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderRingkas from '../components/HeaderRingkas'
import LogoPita from '../components/LogoPita'
import {
  Bell, CalendarBlank, CaretLeft, CaretRight, Clock, CloudArrowUp, Coffee, CreditCard, Export, EyeSlash, Fire,
  LockKey, NotePencil, Palette, Receipt, SquaresFour, Trash, UserCircle, type Icon,
} from '@phosphor-icons/react'
import { hapusSemuaCatatan, semuaCatatan, type Catatan } from '../data/catatan'
import { beruntun, favorit, keCsv } from '../lib/profil'
import { aturPengingat, bagikanCsv, jamPengingat, pengingatAktif } from '../lib/perangkat'

const sq = (r: number, s?: CSSProperties) => ({ '--r': `${r}px`, ...s }) as CSSProperties

type Baris =
  | { ikon: Icon; nama: string; sub: string; jenis: 'sakelar'; on: boolean; ubah: () => void; jam?: string; ubahJam?: (v: string) => void }
  | { ikon: Icon; nama: string; sub: string; jenis: 'aksi'; bahaya?: boolean; jalan: () => void }
  | { ikon: Icon; nama: string; sub: string; jenis: 'segera' }

function Stempel({ ikon: Ikon, teks, warna, bulat, miring, dapat }: { ikon: Icon; teks: [string, string]; warna: string; bulat: boolean; miring: number; dapat: boolean }) {
  return (
    <div style={{ width: 92, height: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: bulat ? '50%' : 28, border: `2.5px dashed ${warna}`, color: warna, textAlign: 'center', transform: `rotate(${miring}deg)`, opacity: dapat ? 1 : 0.35 }}>
      <Ikon size={20} weight="fill" />
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, lineHeight: 1.2 }}>{teks[0]}<br />{teks[1]}</span>
    </div>
  )
}

export default function Profil() {
  const nav = useNavigate()
  const [kini] = useState(() => new Date())
  const [daftar, setDaftar] = useState<Catatan[]>([])
  const [tab, setTab] = useState<'umum' | 'privasi' | 'data'>('umum')
  const [ingat, setIngat] = useState(false)
  const [jam, setJam] = useState(jamPengingat)
  const [sibuk, setSibuk] = useState(false)

  const muat = () => semuaCatatan().then(setDaftar, (e) => console.error(e))
  useEffect(() => {
    muat()
    pengingatAktif().then(setIngat, (e) => console.error(e))
  }, [])

  const n = daftar.length
  const runtun = beruntun(daftar, kini)
  const fav = favorit(daftar)
  const awal = n ? new Date(daftar[n - 1].waktu) : kini
  const sejak = awal.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
  const nomor = `KMN-${awal.getFullYear()}-${String(n).padStart(4, '0')}`
  const dapat = [runtun >= 3, n >= 10, fav !== null]

  const ubahPengingat = async () => {
    const mau = !ingat
    try {
      const ok = await aturPengingat(mau, jam)
      if (ok) setIngat(mau)
      else alert('Izin notifikasi belum diberikan. Nyalakan lewat Pengaturan HP, ya.')
    } catch (e) {
      console.error(e)
      alert('Pengingat gagal diatur. Coba lagi, ya.')
    }
  }
  // ganti jam: simpan, dan kalau pengingat sedang menyala langsung dijadwalkan ulang
  const ubahJam = async (v: string) => {
    if (!v) return
    setJam(v)
    try {
      await aturPengingat(ingat, v)
    } catch (e) {
      console.error(e)
      alert('Jam pengingat gagal diubah. Coba lagi, ya.')
    }
  }
  const ekspor = async () => {
    setSibuk(true)
    try {
      await bagikanCsv(keCsv(daftar), `kemana-${kini.toISOString().slice(0, 10)}.csv`)
    } catch (e) {
      // menutup lembar bagikan juga dianggap error oleh plugin; cukup dicatat
      console.error(e)
    }
    setSibuk(false)
  }
  const hapusSemua = async () => {
    if (!n || !confirm(`Hapus semua ${n} catatan? Ini tidak bisa dibatalkan.`)) return
    setSibuk(true)
    try {
      await hapusSemuaCatatan()
      await muat()
    } catch (e) {
      console.error(e)
      alert('Data gagal dihapus. Coba lagi, ya.')
    }
    setSibuk(false)
  }

  const kelompok: Record<typeof tab, { nama: string; cls: string; baris: Baris[] }> = {
    umum: { nama: 'Umum', cls: 'p-transport', baris: [
      { ikon: Bell, nama: 'Pengingat harian', sub: 'Ketuk jamnya untuk mengubah', jenis: 'sakelar', on: ingat, ubah: ubahPengingat, jam, ubahJam },
      { ikon: Palette, nama: 'Tema warna', sub: 'Toska & Kunyit', jenis: 'segera' },
      { ikon: SquaresFour, nama: 'Kategori', sub: '8 kategori bawaan', jenis: 'segera' },
      { ikon: CalendarBlank, nama: 'Awal periode', sub: 'Hitungan bulan mulai tgl 1', jenis: 'segera' },
    ] },
    privasi: { nama: 'Privasi', cls: 'p-belanja', baris: [
      { ikon: LockKey, nama: 'Kunci aplikasi', sub: 'Sidik jari atau PIN', jenis: 'segera' },
      { ikon: EyeSlash, nama: 'Sembunyikan nominal', sub: 'Tampil Rp •••••• di Beranda', jenis: 'segera' },
      { ikon: Clock, nama: 'Kunci otomatis', sub: 'Saat aplikasi ditinggal', jenis: 'segera' },
      { ikon: NotePencil, nama: 'Ganti PIN', sub: 'Butuh kunci aplikasi', jenis: 'segera' },
    ] },
    data: { nama: 'Data', cls: 'p-tagihan', baris: [
      { ikon: CreditCard, nama: 'Sumber dana', sub: 'Tunai, debit, e-wallet, QRIS', jenis: 'segera' },
      { ikon: CloudArrowUp, nama: 'Cadangkan otomatis', sub: 'Ke iCloud atau Google Drive', jenis: 'segera' },
      { ikon: Export, nama: 'Ekspor CSV', sub: `${n} catatan, buka di Excel`, jenis: 'aksi', jalan: ekspor },
      { ikon: Trash, nama: 'Hapus semua data', sub: 'Tidak bisa dibatalkan', jenis: 'aksi', bahaya: true, jalan: hapusSemua },
    ] },
  }
  const aktif = kelompok[tab]

  return (
    <main className="k pal-toska p-makan screen" style={{ background: 'var(--p)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, height: 44 }}>
        <button type="button" className="ibtn sq" style={{ background: 'var(--bg)' }} aria-label="Kembali" onClick={() => nav(-1)}><CaretLeft size={18} weight="bold" /></button>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>Profil</h1>
      </header>

      <section className="sq lift" style={sq(28, { position: 'relative', overflow: 'hidden', marginTop: 14, height: 210, padding: 20, background: 'var(--pri)', color: '#fff' })} aria-label={`Paspor Kemana, sejak ${sejak}, ${n} catatan`}>
        {/* tanda air logo besar, seperti lambang di halaman paspor */}
        <span aria-hidden="true" style={{ position: 'absolute', right: -46, top: -18, opacity: 0.1 }}><LogoPita size={250} /></span>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--acc)' }} />PASPOR KEMANA
          </span>
          <LogoPita size={40} />
        </div>
        <div style={{ position: 'relative', marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="sq" style={sq(19, { width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--bg)', color: 'var(--pri)' })}><UserCircle size={36} weight="fill" /></span>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>Dompet Pribadi</p>
            <p style={{ fontSize: 12, fontWeight: 600 }}>No. {nomor}</p>
            <p style={{ fontSize: 12, fontWeight: 600 }}>Sejak {sejak} · {n} catatan</p>
          </div>
        </div>
        <p aria-hidden="true" style={{ position: 'relative', marginTop: 16, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, lineHeight: 1.4, letterSpacing: 1.5, color: 'rgba(255,255,255,.7)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          P&lt;KMN&lt;DOMPET&lt;&lt;PRIBADI&lt;&lt;&lt;&lt;&lt;&lt;<br />
          {nomor.replace(/-/g, '<')}&lt;&lt;{runtun}HARI&lt;&lt;{n}&lt;&lt;&lt;&lt;
        </p>
      </section>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Stempel perjalanan</h2>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#4F4F57' }}>{dapat.filter(Boolean).length} dari 3</span>
      </div>
      <div style={{ marginTop: 8, padding: '0 4px', display: 'flex', justifyContent: 'space-between' }}>
        <Stempel ikon={Fire} teks={[`${runtun} HARI`, 'BERUNTUN']} warna="#8A5A00" bulat miring={-8} dapat={dapat[0]} />
        <Stempel ikon={Receipt} teks={[String(n), 'CATATAN']} warna="var(--pri)" bulat={false} miring={6} dapat={dapat[1]} />
        <Stempel ikon={Coffee} teks={fav ? ['PENIKMAT', fav.toUpperCase().slice(0, 9)] : ['BELUM ADA', 'FAVORIT']} warna="#A8336A" bulat miring={-4} dapat={dapat[2]} />
      </div>

      <h2 style={{ marginTop: 16, fontSize: 18, fontWeight: 800 }}>Pengaturan</h2>
      <div className="lift" style={{ marginTop: 10 }}>
        {/* tab mulai 44px dari kiri: sudut cekung tab aktif harus jatuh di sisi datar map (lihat .ftab) */}
        <div role="tablist" aria-label="Kelompok pengaturan" style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 40, paddingLeft: 44 }}>
          {(Object.keys(kelompok) as (typeof tab)[]).map((id) => (
            <button key={id} type="button" role="tab" aria-selected={id === tab} className={`ftab ${kelompok[id].cls}${id === tab ? ' on' : ''}`} onClick={() => setTab(id)}>
              {kelompok[id].nama}
            </button>
          ))}
        </div>
        <div role="tabpanel" aria-label={aktif.nama} className={`sq ${aktif.cls}`} style={sq(20, { display: 'flex', flexDirection: 'column', gap: 6, padding: 8, background: 'var(--p)' })}>
          {aktif.baris.map((b) => {
            const isi = (
              <>
                <span className={`sq ${b.jenis === 'aksi' && b.bahaya ? 'dz' : 'pti'}`} style={sq(11, { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 })}><b.ikon size={20} weight="fill" /></span>
                <span className="grow">
                  <span className="ell" style={{ fontSize: 15, fontWeight: 700 }}>{b.nama}</span>
                  <span className="ell" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>{b.sub}</span>
                </span>
              </>
            )
            const gaya = sq(17, { display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: 56, padding: '0 12px 0 10px', background: 'var(--bg)' })
            if (b.jenis === 'sakelar' && b.jam && b.ubahJam) {
              // jam dan sakelar dipisah jadi dua kontrol; input jam bawaan HP transparan di atas label jam
              return (
                <div key={b.nama} className="sq" style={gaya}>
                  {isi}
                  <label className="pill" style={{ position: 'relative', height: 32, background: 'var(--p)', color: 'var(--pi)', fontSize: 14, fontWeight: 800 }}>
                    {b.jam.replace(':', '.')}
                    <input type="time" aria-label="Jam pengingat" value={b.jam} onChange={(e) => b.ubahJam!(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0 }} />
                  </label>
                  <button type="button" role="switch" aria-checked={b.on} aria-label={b.nama} onClick={b.ubah} style={{ display: 'flex', alignItems: 'center', height: 44 }}>
                    <span className={b.on ? 'sw on' : 'sw'} aria-hidden="true" />
                  </button>
                </div>
              )
            }
            if (b.jenis === 'sakelar') {
              return <button key={b.nama} type="button" role="switch" aria-checked={b.on} className="sq" style={gaya} onClick={b.ubah}>{isi}<span className={b.on ? 'sw on' : 'sw'} aria-hidden="true" /></button>
            }
            if (b.jenis === 'aksi') {
              return <button key={b.nama} type="button" className="sq" style={gaya} disabled={sibuk} onClick={b.jalan}>{isi}<span style={{ display: 'flex', color: 'var(--ink2)' }}><CaretRight size={14} weight="bold" /></span></button>
            }
            return <div key={b.nama} className="sq" style={{ ...gaya, opacity: 0.6 }} aria-disabled="true">{isi}<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink2)' }}>Segera</span></div>
          })}
        </div>
      </div>
      <HeaderRingkas ambang={60} latar="var(--p)">
        <button type="button" className="ibtn sq" style={sq(11, { width: 36, height: 36, background: 'var(--bg)' })} aria-label="Kembali" onClick={() => nav(-1)}><CaretLeft size={16} weight="bold" /></button>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>Profil</span>
      </HeaderRingkas>
    </main>
  )
}
