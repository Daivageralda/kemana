import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { bacaCadangan, cadanganLama, isiCadangan, namaCadangan, perluCadang, urutCadangan } from '../lib/cadangan'
import { semuaCatatan, type Catatan } from './catatan'
import { BAYAR, KATEGORI } from './kategori'

// Documents ikut cadangan iCloud/iTunes perangkat dan terlihat di app Files (lihat Info.plist)
const FOLDER = 'Kemana'
const DIR = Directory.Documents
const KUNCI_AKTIF = 'kemana.cadangan'
const KUNCI_TERAKHIR = 'kemana.cadanganTerakhir'

const baca = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const tulis = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch { /* pengaturan tidak tersimpan, cadangan tetap jalan */ }
}

export const cadanganAktif = () => baca(KUNCI_AKTIF) === '1'
export const aturCadangan = (nyala: boolean) => tulis(KUNCI_AKTIF, nyala ? '1' : null)
export function cadanganTerakhir(): number | null {
  const v = Number(baca(KUNCI_TERAKHIR))
  return v > 0 ? v : null
}

async function namaFile(): Promise<string[]> {
  try {
    return (await Filesystem.readdir({ path: FOLDER, directory: DIR })).files.map((f) => f.name)
  } catch {
    return [] // folder belum ada
  }
}

// tulis salinan semua catatan; null kalau database kosong (cadangan berisi data tidak ditimpa dengan kosong)
export async function cadangkan(): Promise<number | null> {
  const semua = await semuaCatatan()
  if (!semua.length) return null
  const kini = new Date()
  await Filesystem.writeFile({ path: `${FOLDER}/${namaCadangan(kini)}`, data: isiCadangan(semua, kini), directory: DIR, encoding: Encoding.UTF8, recursive: true })
  for (const n of cadanganLama(await namaFile())) await Filesystem.deleteFile({ path: `${FOLDER}/${n}`, directory: DIR })
  tulis(KUNCI_TERAKHIR, String(kini.getTime()))
  return kini.getTime()
}

let berjalan: Promise<unknown> | undefined
// dipanggil saat aplikasi dibuka (paksa) dan sesudah catatan berubah (paling sering sekali sejam); tidak pernah melempar
export function cadangkanOtomatis(paksa = false): Promise<unknown> {
  if (!cadanganAktif() || berjalan || (!paksa && !perluCadang(cadanganTerakhir()))) return berjalan ?? Promise.resolve()
  berjalan = cadangkan().catch((e) => console.error('cadangan gagal', e)).finally(() => { berjalan = undefined })
  return berjalan
}

export type FileCadangan = { nama: string; catatan: Catatan[] | null; galat?: string }

export async function daftarCadangan(): Promise<FileCadangan[]> {
  return Promise.all(urutCadangan(await namaFile()).map(async (nama) => {
    try {
      const { data } = await Filesystem.readFile({ path: `${FOLDER}/${nama}`, directory: DIR, encoding: Encoding.UTF8 })
      return { nama, catatan: bacaCadangan<Catatan>(String(data), KATEGORI.map((k) => k.key), BAYAR.map((b) => b.key)) }
    } catch (e) {
      return { nama, catatan: null, galat: e instanceof Error ? e.message : 'File tidak bisa dibaca.' }
    }
  }))
}
