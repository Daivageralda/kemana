import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ringkas, singkat, tingkatPanas } from './ringkasan.ts'

const lokal = (b: number, t: number, j = 12) => new Date(2026, b, t, j).toISOString()

test('ringkasan bulan berjalan', () => {
  const kini = new Date(2026, 10, 18, 9) // Rabu 18 Nov 2026
  const r = ringkas([
    { jumlah: 24500, waktu: lokal(10, 18, 8) },
    { jumlah: 28000, waktu: lokal(10, 18, 7) },
    { jumlah: 287000, waktu: lokal(10, 17) },
    { jumlah: 100000, waktu: lokal(10, 1) },
    { jumlah: 400000, waktu: lokal(9, 10) }, // Okt, masuk pembanding
    { jumlah: 999000, waktu: lokal(9, 25) }, // Okt setelah tgl 18, tidak dihitung
  ], kini)
  assert.equal(r.total, 439500)
  assert.equal(r.jumlahCatatan, 4)
  assert.equal(r.harian.length, 18)
  assert.equal(r.harian[0], 100000)
  assert.equal(r.harian[17], 52500)
  assert.equal(r.persen, 10)
  assert.deepEqual(r.hariIni.map((c) => c.jumlah), [28000, 24500])
  assert.equal(r.kemarin.total, 287000)
})

test('tanpa bulan lalu, persen kosong', () => {
  assert.equal(ringkas([], new Date(2026, 0, 1)).persen, null)
})

test('angka singkat', () => {
  assert.deepEqual(singkat(3142500), { angka: '3,14', satuan: 'jt' })
  assert.deepEqual(singkat(24500), { angka: '24,5', satuan: 'rb' })
  assert.deepEqual(singkat(28000), { angka: '28', satuan: 'rb' })
  assert.deepEqual(singkat(500), { angka: '500', satuan: '' })
})

test('tingkat kalender panas', () => {
  assert.equal(tingkatPanas(0, 175000), 0)
  assert.equal(tingkatPanas(52500, 175000), 1)
  assert.equal(tingkatPanas(175000, 175000), 2)
  assert.equal(tingkatPanas(230000, 175000), 3)
  assert.equal(tingkatPanas(342000, 175000), 4)
  assert.equal(tingkatPanas(5000, 0), 4) // bulan baru tanpa rata-rata tetap terlihat
})
