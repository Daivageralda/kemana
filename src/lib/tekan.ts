// keypad jumlah: maksimal 10 digit, "0" awal diganti angka pertama
export function tekan(cur: string, k: string): string {
  if (k === 'del') return cur.length > 1 ? cur.slice(0, -1) : '0'
  if (cur === '0') return k === '000' ? '0' : k
  return cur.length + k.length > 10 ? cur : cur + k
}
