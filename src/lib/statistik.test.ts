import { test } from 'node:test'
import assert from 'node:assert/strict'
import { statistik, wawasanDetail } from './statistik.ts'

const at = (b: number, t: number, j = 12) => new Date(2026, b, t, j).toISOString()
const c = (id: string, jumlah: number, kategori: string, waktu: string, keterangan = '') => ({ id, jumlah, kategori, waktu, keterangan })
const kini = new Date(2026, 10, 18, 21) // Rabu 18 Nov 2026

const data = [
  c('a', 850000, 'tagihan', at(10, 2), 'Listrik'),
  c('b', 100000, 'jajan', at(10, 14), 'Kopi'), // Sabtu
  c('c', 50000, 'jajan', at(10, 18, 8), 'kopi'), // Rabu, minggu ini
  c('d', 50000, 'jajan', at(9, 10), 'Kopi'), // Okt, pembanding
  c('e', 999000, 'jajan', at(9, 25)), // Okt setelah tgl 18, tidak dihitung
  c('f', 200000, 'makan', at(0, 5)), // Jan, hanya masuk tahun
]

test('statistik bulan', () => {
  const s = statistik(data, 'bulan', kini)
  assert.equal(s.total, 1000000)
  assert.deepEqual(s.kategori.map((k) => [k.key, k.persen]), [['tagihan', 85], ['jajan', 15]])
  assert.equal(s.kategori[1].naik, 200) // 150rb vs 50rb
  assert.equal(s.kategori[0].naik, null)
  assert.deepEqual(s.kategori[1].contoh, ['kopi'])
  assert.equal(s.hariBoros?.nama, 'Senin') // 2 Nov Senin, 850rb dibagi 3 Senin
})

test('statistik minggu dan tahun', () => {
  const m = statistik(data, 'minggu', kini) // Sen 16 – Rab 18 Nov
  assert.equal(m.total, 50000)
  assert.equal(m.hariBoros, null)
  assert.equal(statistik(data, 'tahun', kini).total, 2249000)
})

test('hari boros butuh minimal 14 hari', () => {
  assert.equal(statistik(data, 'bulan', new Date(2026, 10, 4, 21)).hariBoros, null)
})

test('wawasan detail', () => {
  const w = wawasanDetail(data, data[2])
  assert.deepEqual(w, { ke: 2, total: 150000, persen: 100, serupa: true })
  const t = wawasanDetail(data, data[0])
  assert.deepEqual(t, { ke: 1, total: 850000, persen: 100, serupa: false })
})
