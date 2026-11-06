// penanda Sambutan sudah dilewati; kalau penyimpanan dihapus, Sambutan cuma muncul lagi
const KUNCI = 'kemana.sambutan'

export function sudahDisambut() {
  try { return localStorage.getItem(KUNCI) === '1' } catch { return false }
}

export function tandaiDisambut() {
  try { localStorage.setItem(KUNCI, '1') } catch { /* tetap lanjut */ }
}
