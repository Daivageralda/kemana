import { test } from 'node:test'
import assert from 'node:assert/strict'
import { beruntun, favorit, keCsv } from './profil.ts'

const c = (b: number, t: number, keterangan = '', j = 12, jumlah = 1000) =>
  ({ jumlah, waktu: new Date(2026, b, t, j).toISOString(), kategori: 'jajan', bayar: 'qris', keterangan })
const kini = new Date(2026, 10, 18, 21)

test('hari beruntun', () => {
  assert.equal(beruntun([c(10, 18), c(10, 17), c(10, 16), c(10, 14)], kini), 3)
  assert.equal(beruntun([c(10, 17), c(10, 16)], kini), 2) // hari ini belum, kemarin tersambung
  assert.equal(beruntun([c(10, 15)], kini), 0)
})

test('favorit', () => {
  assert.equal(favorit([c(10, 1, 'Kopi susu'), c(10, 2, 'kopi aren'), c(10, 3, 'KOPI'), c(10, 4, 'Ojol')]), 'kopi')
  assert.equal(favorit([c(10, 1, 'Kopi'), c(10, 2, 'kopi')]), null)
})

test('csv', () => {
  const isi = keCsv([c(10, 18, 'Nasi "padang", pedas', 8, 32000), c(10, 2, 'Kopi', 9, 28000)])
  assert.equal(isi, 'tanggal,jam,jumlah,kategori,bayar,keterangan\n2026-11-02,09:00,28000,jajan,qris,Kopi\n2026-11-18,08:00,32000,jajan,qris,"Nasi ""padang"", pedas"\n')
})
