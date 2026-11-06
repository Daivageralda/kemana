import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bacaCadangan, cadanganLama, isiCadangan, namaCadangan, perluCadang, teksTerakhir, urutCadangan } from './cadangan.ts'

const KAT = ['makan', 'jajan']
const BAY = ['qris', 'tunai']
const c = (id: string, extra = {}) => ({ id, jumlah: 28000, keterangan: 'Kopi', kategori: 'jajan', bayar: 'qris', waktu: '2026-11-05T02:00:00.000Z', ...extra })

test('nama file per hari', () => {
  assert.equal(namaCadangan(new Date(2026, 0, 5, 23)), 'cadangan-2026-01-05.json')
})

test('isi lalu baca kembali sama', () => {
  const data = [c('a'), c('b', { keterangan: '' })]
  assert.deepEqual(bacaCadangan(isiCadangan(data), KAT, BAY), data)
})

test('baca membuang kolom asing', () => {
  const teks = JSON.stringify({ app: 'kemana', versi: 1, catatan: [{ ...c('a'), lain: 1 }] })
  assert.deepEqual(bacaCadangan(teks, KAT, BAY), [c('a')])
})

test('file rusak ditolak', () => {
  const salah = (catatan: unknown) => JSON.stringify({ app: 'kemana', versi: 1, catatan })
  assert.throws(() => bacaCadangan('{"app":', KAT, BAY), /bukan JSON/)
  assert.throws(() => bacaCadangan('{"app":"lain","versi":1,"catatan":[]}', KAT, BAY), /bukan file cadangan/)
  assert.throws(() => bacaCadangan('null', KAT, BAY), /bukan file cadangan/)
  assert.throws(() => bacaCadangan(salah([]), KAT, BAY), /kosong/)
  assert.throws(() => bacaCadangan(salah([c('a'), c('a')]), KAT, BAY), /ke-2/)
  assert.throws(() => bacaCadangan(salah([c('a', { jumlah: 0 })]), KAT, BAY), /ke-1/)
  assert.throws(() => bacaCadangan(salah([c('a', { jumlah: 1.5 })]), KAT, BAY), /ke-1/)
  assert.throws(() => bacaCadangan(salah([c('a', { kategori: 'judi' })]), KAT, BAY), /ke-1/)
  assert.throws(() => bacaCadangan(salah([c('a', { waktu: 'kemarin' })]), KAT, BAY), /ke-1/)
  assert.throws(() => bacaCadangan(salah([null]), KAT, BAY), /ke-1/)
})

test('simpan 7 terbaru, file lain tidak disentuh', () => {
  const nama = Array.from({ length: 9 }, (_, i) => `cadangan-2026-11-0${i + 1}.json`)
  assert.deepEqual(cadanganLama([...nama, 'catatan-saya.txt']), ['cadangan-2026-11-02.json', 'cadangan-2026-11-01.json'])
  assert.equal(urutCadangan(nama)[0], 'cadangan-2026-11-09.json')
  assert.deepEqual(cadanganLama(nama.slice(0, 3)), [])
})

test('jeda sejam', () => {
  assert.equal(perluCadang(null, 0), true)
  assert.equal(perluCadang(0, 59 * 60e3), false)
  assert.equal(perluCadang(0, 60 * 60e3), true)
})

test('teks waktu terakhir', () => {
  const kini = new Date(2026, 10, 6, 15)
  assert.equal(teksTerakhir(null, kini), 'Belum pernah')
  assert.equal(teksTerakhir(new Date(2026, 10, 6, 10, 42).getTime(), kini), 'Terakhir hari ini 10.42')
  assert.equal(teksTerakhir(new Date(2026, 10, 5, 9, 5).getTime(), kini), 'Terakhir kemarin 09.05')
  assert.equal(teksTerakhir(new Date(2026, 10, 1, 21, 0).getTime(), kini), 'Terakhir 1 Nov 21.00')
})
