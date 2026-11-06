// Tata letak "Jejak hari ini": posisi kartu & garis penghubung yang tampak acak,
// tapi tetap sama untuk catatan yang sama (diturunkan dari id), jadi tidak meloncat tiap render.

const JARAK = 106 // jarak vertikal antar-kartu (kartu 64, sisanya ruang garis berkelok)
const TINGGI = 64 // tinggi kartu
const LABEL = 34 // ruang tambahan di atas baris pertama tiap bagian waktu, untuk labelnya

export type Periode = 'pagi' | 'siang' | 'sore' | 'malam'

// pembagian waktu sehari-hari: pagi 04–10, siang 11–14, sore 15–17, malam 18–03
export function periode(jam: number): Periode {
  if (jam >= 4 && jam < 11) return 'pagi'
  if (jam >= 11 && jam < 15) return 'siang'
  if (jam >= 15 && jam < 18) return 'sore'
  return 'malam'
}

// angka semu 0..1 dari string + urutan
function acak(kunci: string, n: number) {
  let h = 2166136261 ^ n
  for (let i = 0; i < kunci.length; i++) h = Math.imul(h ^ kunci.charCodeAt(i), 16777619)
  h = Math.imul(h ^ (h >>> 15), 2246822507)
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296
}

// kunci[i] = id baris; waktu[i] = periode baris itu (baris berurutan dengan periode sama jadi satu bagian)
export function jejak(kunci: string[], lebar: number, kartu: number, waktu: Periode[] = []) {
  const ruang = Math.max(lebar - kartu, 0)
  const kiri: number[] = []
  for (let i = 0; i < kunci.length; i++) {
    let x = Math.round(acak(kunci[i], 1) * ruang)
    // kartu berurutan jangan bertumpuk lurus, supaya garisnya punya ruang berbelok
    const sebelum = kiri[i - 1]
    if (sebelum !== undefined && Math.abs(x - sebelum) < ruang * 0.35) x = sebelum < ruang / 2 ? ruang - Math.round(acak(kunci[i], 2) * ruang * 0.3) : Math.round(acak(kunci[i], 2) * ruang * 0.3)
    kiri.push(x)
  }

  // posisi vertikal; tiap awal bagian waktu diberi ruang label
  const atas: number[] = []
  const bagian: { periode: Periode; atas: number; bawah: number }[] = []
  let y = 0
  for (let i = 0; i < kunci.length; i++) {
    const baru = waktu.length > 0 && waktu[i] !== waktu[i - 1]
    if (i > 0) y += JARAK
    if (baru) {
      y += LABEL
      bagian.push({ periode: waktu[i], atas: y - LABEL, bawah: y + TINGGI + 12 })
    }
    atas.push(y)
    if (bagian.length) bagian[bagian.length - 1].bawah = y + TINGGI + 12
  }

  const garis = kiri.slice(0, -1).map((x0, i) => {
    const x1 = kiri[i + 1]
    const k = kunci[i]
    // titik keluar & masuk di sepanjang tepi bawah/atas kartu, bukan selalu di tengah
    const a = x0 + kartu * (0.25 + acak(k, 3) * 0.5)
    const b = x1 + kartu * (0.25 + acak(k, 4) * 0.5)
    const y0 = atas[i] + TINGGI
    const y1 = atas[i + 1]
    // lengkung meliuk ke samping secara acak (bisa melewati sisi kartu), tetap di dalam layar
    const ayun = (acak(k, 5) - 0.5) * 140
    const c1 = Math.min(Math.max(a + ayun, 6), lebar - 6)
    const c2 = Math.min(Math.max(b - ayun * (0.4 + acak(k, 6)), 6), lebar - 6)
    const t = (y1 - y0) / 3
    return `M${a.toFixed(1)} ${y0 + 2}C${c1.toFixed(1)} ${(y0 + t).toFixed(1)} ${c2.toFixed(1)} ${(y1 - t).toFixed(1)} ${b.toFixed(1)} ${y1 - 2}`
  })

  return { kiri, atas, bagian, garis: garis.join(''), tinggi: atas[atas.length - 1] + TINGGI + 12 }
}
