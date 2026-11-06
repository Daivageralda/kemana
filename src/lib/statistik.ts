// angka layar Statistik dan wawasan Detail; semua tanggal pakai waktu lokal perangkat

type Item = { jumlah: number; waktu: string; kategori: string; keterangan: string }
export type Rentang = 'minggu' | 'bulan' | 'tahun'

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function awalRentang(r: Rentang, kini: Date) {
  if (r === 'minggu') return new Date(kini.getFullYear(), kini.getMonth(), kini.getDate() - ((kini.getDay() + 6) % 7))
  if (r === 'bulan') return new Date(kini.getFullYear(), kini.getMonth(), 1)
  return new Date(kini.getFullYear(), 0, 1)
}

// geser satu periode ke belakang; tanggal yang tidak ada (31 → Feb) dijepit ke akhir bulan
function mundur(r: Rentang, d: Date) {
  if (r === 'minggu') return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7, d.getHours(), d.getMinutes())
  const th = r === 'tahun' ? d.getFullYear() - 1 : d.getFullYear()
  const bl = r === 'bulan' ? d.getMonth() - 1 : d.getMonth()
  const akhir = new Date(th, bl + 1, 0).getDate()
  return new Date(th, bl, Math.min(d.getDate(), akhir), d.getHours(), d.getMinutes())
}

function jumlahkan<T extends Item>(semua: T[], dari: Date, sampai: Date) {
  const per = new Map<string, number>()
  const isi: T[] = []
  for (const c of semua) {
    const w = new Date(c.waktu)
    if (w < dari || w > sampai) continue
    per.set(c.kategori, (per.get(c.kategori) ?? 0) + c.jumlah)
    isi.push(c)
  }
  return { per, isi }
}

export function statistik<T extends Item>(semua: T[], rentang: Rentang, kini = new Date()) {
  const dari = awalRentang(rentang, kini)
  const { per, isi } = jumlahkan(semua, dari, kini)
  const lalu = jumlahkan(semua, mundur(rentang, dari), mundur(rentang, kini)).per
  const total = [...per.values()].reduce((s, v) => s + v, 0)

  const kategori = [...per.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, v]) => {
      const sebelum = lalu.get(key) ?? 0
      // contoh keterangan paling sering di kategori ini, buat subjudul ubin terbesar
      const hitung = new Map<string, number>()
      for (const c of isi) if (c.kategori === key && c.keterangan) {
        const k = c.keterangan.toLowerCase()
        hitung.set(k, (hitung.get(k) ?? 0) + 1)
      }
      return {
        key,
        total: v,
        persen: Math.round((v / total) * 100),
        naik: sebelum > 0 ? Math.round(((v - sebelum) / sebelum) * 100) : null,
        contoh: [...hitung.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k),
      }
    })

  // hari paling boros: rata-rata per hari-dalam-pekan, baru bermakna setelah 2 minggu data
  let hariBoros: { nama: string; rata: number } | null = null
  const lamaHari = Math.floor((kini.getTime() - dari.getTime()) / 864e5) + 1
  if (rentang !== 'minggu' && total > 0 && lamaHari >= 14) {
    const jumlah = Array<number>(7).fill(0)
    const hari = Array<number>(7).fill(0)
    for (let d = new Date(dari); d <= kini; d.setDate(d.getDate() + 1)) hari[d.getDay()]++
    for (const c of isi) jumlah[new Date(c.waktu).getDay()] += c.jumlah
    const rata = jumlah.map((v, i) => (hari[i] ? v / hari[i] : 0))
    const i = rata.indexOf(Math.max(...rata))
    hariBoros = { nama: NAMA_HARI[i], rata: Math.round(rata[i]) }
  }

  return { total, kategori, hariBoros }
}

// wawasan di layar Detail: "Kopi susu ke-9 bulan ini. Totalnya Rp 252.000, 52% dari pengeluaran Jajan."
export function wawasanDetail<T extends Item & { id: string }>(semua: T[], c: T) {
  const w = new Date(c.waktu)
  const sebulan = semua.filter((x) => {
    const d = new Date(x.waktu)
    return d.getFullYear() === w.getFullYear() && d.getMonth() === w.getMonth() && x.waktu <= c.waktu
  })
  const sekategori = sebulan.filter((x) => x.kategori === c.kategori)
  const totalKategori = sekategori.reduce((s, x) => s + x.jumlah, 0)
  const ket = c.keterangan.trim().toLowerCase()
  const serupa = ket ? sekategori.filter((x) => x.keterangan.trim().toLowerCase() === ket) : []
  if (serupa.length > 1) {
    const t = serupa.reduce((s, x) => s + x.jumlah, 0)
    return { ke: serupa.length, total: t, persen: Math.round((t / totalKategori) * 100), serupa: true }
  }
  return { ke: sekategori.length, total: totalKategori, persen: 100, serupa: false }
}
