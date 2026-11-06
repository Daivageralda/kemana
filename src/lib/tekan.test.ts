import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tekan } from './tekan.ts'

test('keypad jumlah', () => {
  assert.equal(tekan('0', '5'), '5')
  assert.equal(tekan('0', '000'), '0')
  assert.equal(tekan('28', '000'), '28000')
  assert.equal(tekan('7', 'del'), '0')
  assert.equal(tekan('280', 'del'), '28')
  assert.equal(tekan('999999999', '000'), '999999999')
  assert.equal(tekan('999999999', '1'), '9999999991')
})
