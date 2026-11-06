// angka ringkasan Beranda dari daftar catatan; semua tanggal pakai waktu lokal perangkat

type Item = { jumlah: number; waktu: string }

const sama = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export function ringkas<T extends Item>(semua: T[], kini = new Date()) {
  const th = kini.getFullYear()
  const bl = kini.getMonth()
  const tgl = kini.getDate()
  const kemarin = new Date(th, bl, tgl - 1)
  const lalu = new Date(th, bl - 1, 1)

  let total = 0
  let jumlahCatatan = 0
  let bulanLalu = 0
  let totalKemarin = 0
  const harian = Array<number>(tgl).fill(0)
  const hariIni: T[] = []

  for (const c of semua) {
    const w = new Date(c.waktu)
    if (w.getFullYear() === th && w.getMonth() === bl && w.getDate() <= tgl) {
      total += c.jumlah
      jumlahCatatan++
      harian[w.getDate() - 1] += c.jumlah
      if (w.getDate() === tgl) hariIni.push(c)
    }
    // bulan lalu dibandingkan pada rentang tanggal yang sama supaya adil
    if (w.getFullYear() === lalu.getFullYear() && w.getMonth() === lalu.getMonth() && w.getDate() <= tgl) bulanLalu += c.jumlah
    if (sama(w, kemarin)) totalKemarin += c.jumlah
  }

  hariIni.sort((a, b) => a.waktu.localeCompare(b.waktu))
  return {
    total,
    jumlahCatatan,
    perHari: Math.round(total / tgl),
    persen: bulanLalu > 0 ? Math.round(((total - bulanLalu) / bulanLalu) * 100) : null,
    harian,
    hariIni,
    totalHariIni: hariIni.reduce((s, c) => s + c.jumlah, 0),
    kemarin: { tanggal: kemarin, total: totalKemarin },
  }
}

// 3142500 -> { angka: '3,14', satuan: 'jt' }, 24500 -> { angka: '24,5', satuan: 'rb' }
export function singkat(n: number) {
  if (n >= 1e6) return { angka: (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 2 }), satuan: 'jt' }
  if (n >= 1e3) return { angka: (n / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 1 }), satuan: 'rb' }
  return { angka: n.toLocaleString('id-ID'), satuan: '' }
}

export const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

// tingkat warna kalender panas (0 = tidak keluar uang, 4 = paling boros) relatif ke rata-rata harian bulan itu
export function tingkatPanas(v: number, rataRata: number): 0 | 1 | 2 | 3 | 4 {
  if (v <= 0) return 0
  const x = v / Math.max(rataRata, 1)
  return x < 0.6 ? 1 : x < 1.1 ? 2 : x < 1.6 ? 3 : 4
}
