import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import {
  ArrowRight, ChartPieSlice, Coffee, Fire, ForkKnife, Heartbeat, Lightning, MapPin, Motorcycle,
  Popcorn, ShoppingBag, type Icon,
} from '@phosphor-icons/react'
import LogoPita from '../components/LogoPita'
import { tandaiDisambut } from '../lib/sambutan'
import '../styles/sambutan.css'

const v = (o: Record<string, string | number>) => o as CSSProperties
const sq = (r: number, s?: CSSProperties) => ({ '--r': `${r}px`, ...s }) as CSSProperties

// tema tiap halaman: latar, teks, warna bar indikator
const TEMA = [
  { bg: 'var(--pri)', fg: '#fff', isi: 'var(--acc)', rel: 'rgba(255,255,255,.28)', panah: { background: 'var(--acc)', color: 'var(--ink)' } },
  { bg: 'var(--bg)', fg: 'var(--ink)', isi: 'var(--pri)', rel: 'var(--card2)', panah: { background: 'var(--pri)', color: '#fff' } },
  { bg: 'var(--acc)', fg: 'var(--ink)', isi: 'var(--ink)', rel: 'rgba(14,14,16,.18)', panah: {} },
]

// indeks yang maju sendiri tiap `ms`; dipakai untuk konten yang bergiliran
function useGilir(ms: number) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => x + 1), ms)
    return () => clearInterval(t)
  }, [ms])
  return i
}

// angka yang berhitung naik/turun ke target baru
function useHitung(target: number, ms = 800) {
  const [nilai, setNilai] = useState(target)
  const dari = useRef(target)
  useEffect(() => {
    const awal = dari.current
    const t0 = performance.now()
    const raf = { id: 0 }
    const langkah = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      const x = awal + (target - awal) * (1 - (1 - k) ** 3)
      dari.current = x
      setNilai(x)
      if (k < 1) raf.id = requestAnimationFrame(langkah)
    }
    raf.id = requestAnimationFrame(langkah)
    return () => cancelAnimationFrame(raf.id)
  }, [target, ms])
  return nilai
}

const Naik = ({ i, children, style }: { i: number; children: ReactNode; style?: CSSProperties }) => (
  <div className="sbt-naik" style={{ ...style, ...v({ '--i': i }) }}>{children}</div>
)

/* ---------- halaman 1: radar ---------- */

// garis kontur ala peta topografi: cincin bergelombang di dua pusat, digambar sekali saat modul dimuat
function kontur(cx: number, cy: number, n: number, jarak: number, benih: number) {
  return Array.from({ length: n }, (_, k) => {
    const r = 40 + (k + 1) * jarak
    const titik = Array.from({ length: 73 }, (_, j) => {
      const a = (j / 72) * Math.PI * 2
      const w = 1 + 0.13 * Math.sin(3 * a + k * 0.6 + benih) + 0.07 * Math.cos(5 * a - k * 0.9 + benih)
      return `${(cx + Math.cos(a) * r * w).toFixed(1)},${(cy + Math.sin(a) * r * w * 0.82).toFixed(1)}`
    })
    return `M${titik.join('L')}Z`
  }).join('')
}
const KONTUR = kontur(360, 700, 10, 52, 0) + kontur(-10, 110, 5, 46, 2.1)

function LatarKontur() {
  return (
    <svg aria-hidden="true" className="sbt-kontur" viewBox="0 0 402 874" preserveAspectRatio="xMidYMid slice" fill="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }}>
      <path d={KONTUR} stroke="#fff" strokeOpacity="0.07" strokeWidth="1.2" />
    </svg>
  )
}

const IKON_RADAR: Icon[] = [Coffee, Motorcycle, ShoppingBag, ForkKnife, Popcorn, Heartbeat, Lightning]
const NOMINAL = ['28rb', '24,5rb', '89rb', '12rb', '150rb', '7rb', '35rb', '52,5rb', '18rb', '240rb', '9,5rb', '65rb', '4rb', '120rb']
// titik orbit dalam derajat (0 = kanan, searah jarum jam); satelit melompat ke titik yang masih kosong
const SUDUT = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
const PUSAT = { x: 195, y: 175 }

type Satelit = { ikon: number; sudut: number; jarak: number }
const AWAL: Satelit[] = [
  { ikon: 0, sudut: 300, jarak: 1 }, // 3 satelit besar + 1 ubin kaca kecil (indeks 3)
  { ikon: 1, sudut: 150, jarak: 0.85 },
  { ikon: 2, sudut: 30, jarak: 1 },
  { ikon: 6, sudut: 210, jarak: 1.15 },
]
const jauh = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))

function pindah(lama: Satelit[], slot: number): Satelit[] {
  let ikon = lama[slot].ikon
  do ikon = (ikon + 1) % IKON_RADAR.length; while (lama.some((s) => s.ikon === ikon))
  const kosong = SUDUT.filter((d) => lama.every((s, i) => i === slot || jauh(s.sudut, d) >= 75) && d !== lama[slot].sudut)
  const sudut = kosong[Math.floor(Math.random() * kosong.length)] ?? lama[slot].sudut
  const jarak = slot === 3 ? 1.15 : [0.8, 0.92, 1][Math.floor(Math.random() * 3)]
  return lama.map((s, i) => (i === slot ? { ikon, sudut, jarak } : s))
}

// label nominal ganti isi tiap kali animasinya selesai satu putaran (saat sedang tak terlihat)
function Nominal({ awal, d, atas }: { awal: number; d: string; atas: boolean }) {
  const [i, setI] = useState(awal)
  return (
    // pembungkus memusatkan label; animasi muncul-hilang ada di dalamnya supaya transform tidak bentrok
    <span style={{ position: 'absolute', left: '50%', top: atas ? -34 : 58, transform: 'translateX(-50%)' }}>
      <span className="pill sbt-letup" onAnimationIteration={() => setI((n) => n + 3)} style={{ height: 28, background: 'rgba(255,255,255,.16)', ...v({ '--d': d }) }}>
        {NOMINAL[i % NOMINAL.length]}
      </span>
    </span>
  )
}

function Halaman1() {
  // tiap 1,6 detik satu ubin (bergiliran) ganti ikon sekaligus pindah ke titik orbit lain
  const [sat, setSat] = useState(AWAL)
  useEffect(() => {
    let slot = 0
    const t = setInterval(() => {
      const s = slot
      setSat((lama) => pindah(lama, s))
      slot = (slot + 1) % 4
    }, 1600)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <div aria-hidden="true" style={{ position: 'relative', height: 360, margin: '6px -24px 0', flexShrink: 0 }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, width: 390, height: 360, marginLeft: -195 }}>
          <svg viewBox="0 0 390 360" width="390" height="360" fill="none" style={{ position: 'absolute', left: 0, top: 0 }}>
            <circle className="sbt-putar" cx={PUSAT.x} cy={PUSAT.y} r="130" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 9" />
            <circle className="sbt-putar balik" cx={PUSAT.x} cy={PUSAT.y} r="180" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 9" />
          </svg>
          <span className="sbt-riak" style={{ left: PUSAT.x - 80, top: PUSAT.y - 80, width: 160, height: 160 }} />
          <span className="sbt-riak" style={{ left: PUSAT.x - 80, top: PUSAT.y - 80, width: 160, height: 160, ...v({ '--d': '1.2s' }) }} />
          <div className="sq sbt-denyut" style={sq(30, { position: 'absolute', left: PUSAT.x - 48, top: PUSAT.y - 48, width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)' })}>
            <LogoPita size={74} />
          </div>
          {sat.map((s, slot) => {
            const Ikon = IKON_RADAR[s.ikon]
            const kecil = slot === 3
            const uk = kecil ? 44 : 52
            const rad = (s.sudut * Math.PI) / 180
            // elips: lebih lebar dari tinggi supaya satelit dan labelnya tetap di dalam area
            const x = PUSAT.x + Math.cos(rad) * 140 * s.jarak - uk / 2
            const y = PUSAT.y + Math.sin(rad) * 112 * s.jarak - uk / 2
            return (
              <div key={slot} className="sbt-orbit" style={{ position: 'absolute', left: x, top: y, width: uk, height: uk }}>
                <div className={`sq sbt-apung ${kecil ? '' : 'tile'}`} style={sq(kecil ? 13 : 16, {
                  width: uk, height: uk, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  ...(kecil ? { background: 'rgba(255,255,255,.16)', color: '#fff' } : { color: 'var(--pri)' }),
                  ...v({ '--t': `${4.6 + slot * 0.5}s`, '--d': `${slot * 0.7}s` }),
                })}>
                  <span key={s.ikon} className="sbt-pop"><Ikon size={kecil ? 22 : 26} weight="fill" /></span>
                </div>
                {/* label selalu di sisi luar orbit supaya tidak menabrak pin tengah */}
                {!kecil && <Nominal awal={slot * 5} d={`${slot * 1.4}s`} atas={Math.sin(rad) < -0.2} />}
              </div>
            )
          })}
        </div>
      </div>
      <Naik i={0}><h1 style={{ marginTop: 10, fontSize: 50, fontWeight: 800, letterSpacing: -2, lineHeight: 0.98 }}>Uangmu<br />ke mana<br /><span style={{ color: 'var(--acc)' }}>aja, sih?</span></h1></Naik>
      <Naik i={1}><p style={{ marginTop: 12, fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>Tiap rupiah punya jejak. Kemana bantu kamu melacaknya, tanpa ribet.</p></Naik>
    </>
  )
}

/* ---------- halaman 2: kalender & mozaik yang berganti bulan ---------- */

type Bulan = { nama: string; geser: number; hari: number; total: number; mozaik: [Icon, number][]; boros: string; kini?: number }
const BULAN: Bulan[] = [
  { nama: 'Agustus', geser: 4, hari: 31, total: 2870000, mozaik: [[ForkKnife, 31], [Coffee, 22], [Motorcycle, 14]], boros: 'Jumat Rp 298rb' },
  { nama: 'September', geser: 0, hari: 30, total: 3410000, mozaik: [[Lightning, 29], [ShoppingBag, 24], [ForkKnife, 18]], boros: 'Minggu Rp 410rb' },
  { nama: 'Oktober', geser: 2, hari: 31, total: 2655000, mozaik: [[Coffee, 33], [ForkKnife, 25], [Popcorn, 12]], boros: 'Sabtu Rp 276rb' },
  { nama: 'November', geser: 6, hari: 30, total: 3142500, mozaik: [[Lightning, 27], [ForkKnife, 26], [Coffee, 15]], boros: 'Sabtu Rp 342rb', kini: 18 },
]

// pola panas semu tapi tetap sama untuk bulan yang sama
const panas = (b: number, d: number) => {
  const x = Math.sin(b * 97.1 + d * 12.9898) * 43758.5453
  return 1 + Math.floor((x - Math.floor(x)) * 4) // 1..4
}

const rp = (n: number) => `Rp ${(n / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} jt`

function Halaman2() {
  const b = useGilir(3600) % BULAN.length
  const bulan = BULAN[b]
  const total = useHitung(bulan.total)
  const p0 = useHitung(bulan.mozaik[0][1])
  const p1 = useHitung(bulan.mozaik[1][1])
  const p2 = useHitung(bulan.mozaik[2][1])
  const sel = Array.from({ length: 35 }, (_, i) => {
    const d = i - bulan.geser + 1
    if (d < 1 || d > bulan.hari) return null
    if (bulan.kini && d === bulan.kini) return 5
    if (bulan.kini && d > bulan.kini) return 0
    return panas(b, d)
  })
  const [I0, I1, I2] = bulan.mozaik.map(([Ikon]) => Ikon)

  return (
    <>
      <Naik i={0}><h1 style={{ marginTop: 28, fontSize: 50, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>Hari boros<br />langsung<br /><span className="sbt-stabilo">ketahuan.</span></h1></Naik>
      <Naik i={1}><p style={{ marginTop: 16, fontSize: 16, fontWeight: 500, lineHeight: 1.5, color: 'var(--ink2)' }}>Kalender panas dan mozaik kategori menunjukkan kapan dan ke mana uangmu paling deras keluar.</p></Naik>
      <div aria-hidden="true" style={{ position: 'relative', flex: 1, minHeight: 320 }}>
        <div className="lift sbt-apung" style={{ position: 'absolute', left: 16, top: 18, ...v({ '--rot': '-6deg', '--t': '6s' }) }}>
          <div className="sq" style={sq(30, { width: 300, padding: 20, background: 'var(--bg)' })}>
            <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
              <span key={bulan.nama} className="sbt-geser">{bulan.nama}</span>
              <span style={{ color: 'var(--ink2)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{rp(total)}</span>
            </p>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 7 }}>
              {sel.map((t, i) => t === null ? <span key={i} style={{ height: 30 }} /> : t === 5
                ? <span key={i} className="heat-1 sbt-sel" style={{ height: 30, borderRadius: 9, boxShadow: '0 0 0 2px var(--bg), 0 0 0 4px var(--acc)' }} />
                : <span key={i} className={`sq sbt-sel ${t ? `heat-${t} sbt-gel` : 'card'}`} style={sq(9, { height: 30, ...v({ '--d': `${i * 70}ms` }) })} />)}
            </div>
          </div>
        </div>
        <div className="lift sbt-apung" style={{ position: 'absolute', right: -4, top: 178, ...v({ '--rot': '7deg', '--t': '5.2s', '--d': '.6s' }) }}>
          <div className="sq" style={sq(28, { width: 176, height: 150, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: 6, background: 'var(--bg)' })}>
            <span className="sq" style={sq(16, { gridRow: '1 / 3', padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--pri)', color: '#fff' })}>
              <span key={b} className="sbt-pop"><I0 size={22} weight="fill" /></span><span style={{ fontSize: 18, fontWeight: 800 }}>{Math.round(p0)}%</span>
            </span>
            <span className="sq" style={sq(14, { padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--pri-soft)' })}>
              <span key={b} className="sbt-pop" style={{ color: 'var(--pri)' }}><I1 size={18} weight="fill" /></span><span style={{ fontSize: 14, fontWeight: 800 }}>{Math.round(p1)}%</span>
            </span>
            <span className="sq" style={sq(14, { padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--acc)' })}>
              <span key={b} className="sbt-pop"><I2 size={18} weight="fill" /></span><span style={{ fontSize: 14, fontWeight: 800 }}>{Math.round(p2)}%</span>
            </span>
          </div>
        </div>
        <span className="pill lift sbt-apung" style={{ position: 'absolute', left: -2, top: 250, height: 36, padding: '0 14px 0 10px', background: 'var(--ink)', color: '#fff', ...v({ '--rot': '-4deg', '--t': '4.4s', '--d': '1.2s' }) }}>
          <span className="sbt-nyala" style={{ color: 'var(--acc)' }}><Fire size={18} weight="fill" /></span>
          <span key={bulan.boros} className="sbt-geser">{bulan.boros}</span>
        </span>
      </div>
    </>
  )
}

/* ---------- halaman 3: notifikasi bergiliran ---------- */

// piringan jam raksasa di belakang "21.00": jarum jam & menit menunjuk 21.00, jarum detik berputar
const TANDA = Array.from({ length: 60 }, (_, i) => {
  const a = (i / 60) * Math.PI * 2
  const besar = i % 5 === 0
  const r1 = 200
  const r2 = besar ? 178 : 190
  return { x1: 210 + Math.sin(a) * r1, y1: 210 - Math.cos(a) * r1, x2: 210 + Math.sin(a) * r2, y2: 210 - Math.cos(a) * r2, besar }
})

function LatarJam() {
  return (
    <svg aria-hidden="true" className="sbt-jam" viewBox="0 0 420 420" width="420" height="420" fill="none"
      style={{ position: 'absolute', left: 92, top: 0, zIndex: -1, pointerEvents: 'none' }}>
      <g stroke="var(--ink)" strokeOpacity="0.1" strokeLinecap="round">
        {TANDA.map((t, i) => <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.besar ? 3 : 1.5} />)}
        <line x1="210" y1="210" x2="110" y2="210" strokeWidth="7" />
        <line x1="210" y1="210" x2="210" y2="60" strokeWidth="4" />
      </g>
      <g className="sbt-detik">
        <line x1="210" y1="240" x2="210" y2="36" stroke="var(--ink)" strokeOpacity="0.16" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <circle cx="210" cy="210" r="6" fill="var(--ink)" fillOpacity="0.14" />
    </svg>
  )
}

const NOTIF: [Icon, string][] = [
  [MapPin, 'Udah catat jajan hari ini?'],
  [Coffee, 'Kopi tadi pagi belum dicatat, lho.'],
  [Motorcycle, 'Ojol pulang tadi berapa, ya?'],
  [Fire, '5 hari beruntun! Jangan putus malam ini.'],
  [ChartPieSlice, 'Jajan minggu ini naik 12%. Intip, yuk.'],
  [ForkKnife, 'Semenit aja, catat makan siangmu.'],
]

// posisi tiap lapisan tumpukan: 0 = paling depan, 3 = sedang keluar di belakang
const LAPIS = [
  { y: 24, s: 1, o: 1 },
  { y: 12, s: 0.94, o: 0.82 },
  { y: 0, s: 0.88, o: 0.5 },
  { y: -10, s: 0.82, o: 0 },
]

function Halaman3() {
  // tiap 3 detik notifikasi baru jatuh ke depan; kartu lama mundur, mengecil, lalu hilang
  const [n, setN] = useState(3)
  useEffect(() => {
    const t = setInterval(() => setN((x) => x + 1), 3000)
    return () => clearInterval(t)
  }, [])
  const tumpukan = [n, n - 1, n - 2, n - 3]
  return (
    <>
      <Naik i={0}><p style={{ marginTop: 24, fontSize: 108, fontWeight: 800, letterSpacing: -6, lineHeight: 0.9 }}>21.00</p></Naik>
      <Naik i={1}>
        <p style={{ marginTop: 6, fontSize: 15, fontWeight: 600, lineHeight: 1.45, color: '#3A2E10' }}>
          jam nyatet kamu, tiap malam.<br />Mau jam lain? <span style={{ fontWeight: 800, color: 'var(--ink)', textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 3 }}>Atur sendiri di Profil.</span>
        </p>
      </Naik>
      <div aria-hidden="true" style={{ position: 'relative', height: 100, marginTop: 20, flexShrink: 0 }}>
        {tumpukan.map((id, kedalaman) => {
          const [Ikon, teks] = NOTIF[id % NOTIF.length]
          const l = LAPIS[kedalaman]
          return (
            <div key={id} className={`sq sbt-tumpuk${kedalaman === 0 ? ' depan' : ''}`} style={sq(22, {
              position: 'absolute', left: 0, right: 0, top: 0, height: 76, padding: '0 14px 0 12px',
              display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', zIndex: 4 - kedalaman,
              transform: `translateY(${l.y}px) scale(${l.s})`, opacity: l.o,
            })}>
              <span className="sq" style={sq(12, { width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--ink)', color: 'var(--acc)' })}><Ikon size={20} weight="fill" /></span>
              <span className="grow"><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>Kemana · {kedalaman === 0 ? 'sekarang' : `${kedalaman * 3} dtk lalu`}</span><span className="ell" style={{ fontSize: 15, fontWeight: 700 }}>{teks}</span></span>
            </div>
          )
        })}
      </div>
      <div aria-hidden="true" style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, flexShrink: 0 }}>
        <div className="sq" style={sq(24, { height: 84, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ink)', color: '#fff' })}>
          <span className="sq" style={sq(12, { width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(255,255,255,.12)', color: 'var(--acc)' })}><span className="sbt-nyala"><Fire size={22} weight="fill" /></span></span>
          <span className="grow"><span style={{ fontSize: 18, fontWeight: 800 }}>5 hari</span><span style={{ fontSize: 12, fontWeight: 500 }}>beruntun</span></span>
        </div>
        <div className="sq" style={sq(24, { height: 84, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)' })}>
          <span className="sq" style={sq(12, { width: 40, height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, padding: '0 0 9px', flexShrink: 0, background: 'var(--pri-soft)' })}>
            {[14, 20, 11, 7].map((h, i) => (
              <span key={i} className="sbt-batang" style={{ width: 5, height: h, borderRadius: 3, background: i === 3 ? 'var(--acc)' : 'var(--pri)', ...v({ '--d': `${i * 0.18}s` }) }} />
            ))}
          </span>
          <span className="grow"><span style={{ fontSize: 18, fontWeight: 800 }}>−12%</span><span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>jajan minggu ini</span></span>
        </div>
      </div>
      <Naik i={2}><h1 style={{ marginTop: 24, fontSize: 44, fontWeight: 800, letterSpacing: -1.8, lineHeight: 1 }}>Rutin semenit,<br />dompet adem.</h1></Naik>
      <Naik i={3}><p style={{ marginTop: 10, fontSize: 16, fontWeight: 500, lineHeight: 1.5, color: '#3A2E10' }}>Pengingat jam 9 malam dan data yang tersimpan di HP-mu bikin nyatet jadi kebiasaan, bukan beban.</p></Naik>
    </>
  )
}

export default function Sambutan() {
  const nav = useNavigate()
  const [hal, setHal] = useState(0)
  const sentuh = useRef(0)
  const tema = TEMA[hal]

  // teks status bar putih di halaman toska, gelap di halaman putih & kunyit
  useEffect(() => {
    if (Capacitor.isNativePlatform()) StatusBar.setStyle({ style: hal === 0 ? Style.Dark : Style.Light })
  }, [hal])

  const selesai = () => {
    tandaiDisambut()
    nav('/', { replace: true })
  }
  const lanjut = () => (hal < 2 ? setHal(hal + 1) : selesai())

  return (
    <main className="k pal-toska sbt" style={{ background: tema.bg, color: tema.fg }}
      onTouchStart={(e) => { sentuh.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - sentuh.current
        if (dx < -50 && hal < 2) setHal(hal + 1)
        if (dx > 50 && hal > 0) setHal(hal - 1)
      }}>
      {hal === 0 && <LatarKontur />}
      {hal === 1 && <div aria-hidden="true" className="sbt-titik" />}
      {hal === 2 && <LatarJam />}
      <div aria-hidden="true" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`sbt-bar ${i < hal ? 'lewat' : i === hal ? 'kini' : ''}`} style={v({ '--isi': tema.isi, '--rel': tema.rel })}><i /></span>
        ))}
      </div>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 40, marginTop: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>kemana<span style={{ color: hal === 2 ? 'var(--pri)' : 'var(--acc)' }}>.</span></span>
        {hal < 2 && <button type="button" onClick={selesai} style={{ padding: '10px 0 10px 12px', fontSize: 15, fontWeight: 600, color: hal === 1 ? 'var(--ink2)' : undefined }}>Lewati</button>}
      </header>

      <div key={hal} className="sbt-ganti" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {hal === 0 ? <Halaman1 /> : hal === 1 ? <Halaman2 /> : <Halaman3 />}
      </div>

      {hal < 2 ? (
        <div style={{ position: 'relative', zIndex: 2, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>0{hal + 1} <span style={{ opacity: 0.55 }}>/ 03</span></span>
          <button type="button" className="sq" aria-label="Lanjut" onClick={lanjut} style={sq(20, { width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', ...tema.panah })}>
            <ArrowRight size={26} weight="bold" />
          </button>
        </div>
      ) : (
        <button type="button" className="btn sq sbt-kilau" onClick={selesai} style={{ marginTop: 16, flexShrink: 0, background: 'var(--ink)', color: '#fff' }}>Mulai catat</button>
      )}
    </main>
  )
}
