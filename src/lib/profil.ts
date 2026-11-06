// angka paspor & stempel Profil, plus isi file ekspor CSV

type Item = { jumlah: number; waktu: string; kategori: string; bayar: string; keterangan: string }

const kunciHari = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

// hari beruntun mencatat; boleh belum mencatat hari ini, asal kemarin masih tersambung
export function beruntun(semua: Item[], kini = new Date()) {
  const ada = new Set(semua.map((c) => kunciHari(new Date(c.waktu))))
  const d = new Date(kini.getFullYear(), kini.getMonth(), kini.getDate())
  if (!ada.has(kunciHari(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (ada.has(kunciHari(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}

// keterangan yang paling sering dicatat, minimal 3 kali biar pantas jadi stempel
export function favorit(semua: Item[]) {
  const hitung = new Map<string, number>()
  for (const c of semua) {
    const k = c.keterangan.trim().toLowerCase().split(/\s+/)[0]
    if (k) hitung.set(k, (hitung.get(k) ?? 0) + 1)
  }
  const [kata, n] = [...hitung.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
  return n >= 3 ? kata : null
}

const sel = (v: string | number) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function keCsv(semua: Item[]) {
  const baris = [...semua]
    .sort((a, b) => a.waktu.localeCompare(b.waktu))
    .map((c) => {
      const w = new Date(c.waktu)
      const tgl = `${w.getFullYear()}-${String(w.getMonth() + 1).padStart(2, '0')}-${String(w.getDate()).padStart(2, '0')}`
      const jam = `${String(w.getHours()).padStart(2, '0')}:${String(w.getMinutes()).padStart(2, '0')}`
      return [tgl, jam, c.jumlah, c.kategori, c.bayar, c.keterangan].map(sel).join(',')
    })
  return ['tanggal,jam,jumlah,kategori,bayar,keterangan', ...baris].join('\n') + '\n'
}
