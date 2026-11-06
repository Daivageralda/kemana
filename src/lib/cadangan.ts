// format file cadangan JSON, validasinya, dan file mana yang dibuang

type Item = { id: string; jumlah: number; keterangan: string; kategori: string; bayar: string; waktu: string }

export const SIMPAN = 7
const POLA = /^cadangan-\d{4}-\d{2}-\d{2}\.json$/
const dua = (n: number) => String(n).padStart(2, '0')

// satu file per hari (tanggal lokal); cadangan di hari yang sama menimpa file hari itu
export const namaCadangan = (d: Date) => `cadangan-${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}.json`

export function isiCadangan(catatan: Item[], kini = new Date()) {
  return JSON.stringify({ app: 'kemana', versi: 1, dibuat: kini.toISOString(), catatan })
}

// lempar Error berpesan ramah kalau bentuknya salah; jangan pernah menimpa database dengan isi yang meragukan
export function bacaCadangan<T extends Item>(teks: string, kategori: readonly string[], bayar: readonly string[]): T[] {
  let data: unknown
  try { data = JSON.parse(teks) } catch { throw new Error('File cadangan rusak (bukan JSON).') }
  const d = data as { app?: unknown; versi?: unknown; catatan?: unknown }
  if (!d || d.app !== 'kemana' || d.versi !== 1 || !Array.isArray(d.catatan)) throw new Error('Ini bukan file cadangan Kemana.')
  if (!d.catatan.length) throw new Error('File cadangan kosong.')
  const id = new Set<string>()
  d.catatan.forEach((c: Partial<Item>, i: number) => {
    const ok = c && typeof c.id === 'string' && c.id && !id.has(c.id)
      && Number.isInteger(c.jumlah) && c.jumlah! > 0
      && typeof c.keterangan === 'string'
      && kategori.includes(c.kategori!) && bayar.includes(c.bayar!)
      && typeof c.waktu === 'string' && !Number.isNaN(Date.parse(c.waktu))
    if (!ok) throw new Error(`Catatan ke-${i + 1} di file cadangan tidak valid.`)
    id.add(c.id!)
  })
  return (d.catatan as T[]).map(({ id, jumlah, keterangan, kategori, bayar, waktu }) => ({ id, jumlah, keterangan, kategori, bayar, waktu }) as T)
}

// file cadangan terurut terbaru dulu; selain SIMPAN teratas dihapus. File lain di folder tidak disentuh.
export const urutCadangan = (nama: string[]) => nama.filter((n) => POLA.test(n)).sort().reverse()
export const cadanganLama = (nama: string[]) => urutCadangan(nama).slice(SIMPAN)

export const JEDA = 60 * 60 * 1000
export const perluCadang = (terakhir: number | null, kini = Date.now()) => terakhir === null || kini - terakhir >= JEDA

export function teksTerakhir(terakhir: number | null, kini = new Date()) {
  if (terakhir === null) return 'Belum pernah'
  const w = new Date(terakhir)
  const jam = `${dua(w.getHours())}.${dua(w.getMinutes())}`
  const hari = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const selisih = Math.round((hari(kini) - hari(w)) / 864e5)
  if (selisih === 0) return `Terakhir hari ini ${jam}`
  if (selisih === 1) return `Terakhir kemarin ${jam}`
  return `Terakhir ${w.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][w.getMonth()]} ${jam}`
}
