import type { BayarKey, KategoriKey } from './kategori'
import { db, tulisWeb } from './db'

export type Catatan = {
  id: string
  jumlah: number
  keterangan: string
  kategori: KategoriKey
  bayar: BayarKey
  waktu: string // ISO
}

export async function semuaCatatan(): Promise<Catatan[]> {
  const res = await (await db()).query('SELECT * FROM catatan ORDER BY waktu DESC')
  return (res.values ?? []) as Catatan[]
}

export async function simpanCatatan(c: Omit<Catatan, 'id' | 'waktu'>): Promise<Catatan> {
  const baru: Catatan = { ...c, id: crypto.randomUUID(), waktu: new Date().toISOString() }
  await (await db()).run(
    'INSERT INTO catatan (id, jumlah, keterangan, kategori, bayar, waktu) VALUES (?, ?, ?, ?, ?, ?)',
    [baru.id, baru.jumlah, baru.keterangan, baru.kategori, baru.bayar, baru.waktu],
  )
  await tulisWeb()
  return baru
}

export async function ambilCatatan(id: string): Promise<Catatan | undefined> {
  const res = await (await db()).query('SELECT * FROM catatan WHERE id = ?', [id])
  return res.values?.[0] as Catatan | undefined
}

export async function hapusCatatan(id: string): Promise<void> {
  await (await db()).run('DELETE FROM catatan WHERE id = ?', [id])
  await tulisWeb()
}

export async function hapusSemuaCatatan(): Promise<void> {
  await (await db()).run('DELETE FROM catatan')
  await tulisWeb()
}
