import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jejak, periode } from './jejak.ts'

test('jejak stabil, di dalam layar, dan tidak lurus', () => {
  const ids = ['a1', 'b2', 'c3', 'd4', 'akhir']
  const j = jejak(ids, 350, 240)
  assert.deepEqual(j, jejak(ids, 350, 240)) // sama tiap render
  assert.equal(j.kiri.length, 5)
  for (const x of j.kiri) assert.ok(x >= 0 && x <= 110)
  for (let i = 1; i < j.kiri.length; i++) assert.ok(Math.abs(j.kiri[i] - j.kiri[i - 1]) >= 110 * 0.35 - 1)
  assert.equal(j.garis.split('M').length - 1, 4)
  assert.deepEqual(j.atas, [0, 106, 212, 318, 424])
  assert.notDeepEqual(jejak(['x9', 'y8', 'akhir'], 350, 240).kiri, jejak(['a1', 'b2', 'akhir'], 350, 240).kiri)
})

test('pembagian waktu', () => {
  assert.deepEqual([4, 10, 11, 14, 15, 17, 18, 23, 0, 3].map(periode),
    ['pagi', 'pagi', 'siang', 'siang', 'sore', 'sore', 'malam', 'malam', 'malam', 'malam'])
})

test('bagian waktu: baris berurutan digabung, tiap bagian diberi ruang label', () => {
  const j = jejak(['m', 'a', 'b', 'c'], 350, 240, ['sore', 'sore', 'siang', 'pagi'])
  assert.deepEqual(j.bagian.map((b) => b.periode), ['sore', 'siang', 'pagi'])
  assert.deepEqual(j.atas, [34, 140, 280, 420])
  assert.equal(j.bagian[0].atas, 0)
  assert.equal(j.bagian[0].bawah, 140 + 64 + 12)
  assert.ok(j.bagian[1].atas > j.bagian[0].bawah) // ada celah antarbagian
  assert.equal(j.tinggi, 420 + 64 + 12)
})
