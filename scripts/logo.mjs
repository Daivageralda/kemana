// Sumber tunggal logo Kemana (k Jalur "Pita"). Jalankan: pnpm logo
// Menulis PNG sumber ke assets/ (dibaca @capacitor/assets) dan public/favicon.svg.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

import { ATAS, CELAH, K, KUNYIT, TEBAL, TITIK } from '../src/lib/logo.ts'

const garis = (d, warna, tebal, ujung = 'round') =>
  `<path d="${d}" fill="none" stroke="${warna}" stroke-width="${tebal}" stroke-linecap="${ujung}" stroke-linejoin="round"/>`

// tanda k Pita di kotak 100×100; id unik supaya bisa ditanam lebih dari sekali
const tanda = (id) => `
  <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
    <rect width="100" height="100" fill="#fff"/>${garis(CELAH, '#000', 17, 'butt')}
  </mask>
  <g mask="url(#${id})">${garis(K, '#fff', TEBAL)}</g>${garis(ATAS, '#fff', TEBAL, 'butt')}
  <circle cx="${TITIK.cx}" cy="${TITIK.cy}" r="${TITIK.r}" fill="${KUNYIT}"/>`

// wordmark "kemana." sebagai path (Urbanist ExtraBold), garis dasar y=1500 di satuan font
const wm = readFileSync('assets/logo/wordmark.svg', 'utf8')
const [teksWm, titikWm] = [...wm.matchAll(/ d="([^"]+)"/g)].map((m) => m[1])
const lebarWm = Number(wm.match(/viewBox="0 0 (\d+)/)[1])
// lebar & garis dasar dalam satuan kotak 100
const wordmark = (lebar, dasar) => {
  const s = lebar / lebarWm
  return `<g transform="translate(${50 - lebar / 2} ${dasar - 1500 * s}) scale(${s})"><path d="${teksWm}" fill="#fff"/><path d="${titikWm}" fill="${KUNYIT}"/></g>`
}

const latar = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#11807A"/><stop offset="1" stop-color="#084743"/></linearGradient>
    <radialGradient id="kilau" cx=".25" cy=".15" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#bg)"/><rect width="100" height="100" fill="url(#kilau)"/>`

const svg = (isi, sudut = 0) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${sudut ? `<clipPath id="r"><rect width="100" height="100" rx="${sudut}"/></clipPath><g clip-path="url(#r)">${isi}</g>` : isi}</svg>`
// skala tanda di sekitar titik tengah kotak (untuk zona aman ikon adaptif & splash)
const kecil = (isi, s) => `<g transform="translate(50 50) scale(${s}) translate(-50 -50)">${isi}</g>`

// rata = tanpa kanal alpha (App Store menolak ikon iOS yang transparan)
const png = (isi, ukuran, file, rata = true) => {
  const g = sharp(Buffer.from(isi), { density: Math.ceil((72 * ukuran) / 100) }).resize(ukuran, ukuran)
  return (rata ? g.flatten({ background: '#0D6B67' }) : g).png().toFile(file)
}

mkdirSync('assets', { recursive: true })
await Promise.all([
  // iOS & Android lama: ikon penuh tanpa sudut (sistem yang membulatkan)
  png(svg(latar + kecil(tanda('m1'), 0.74)), 1024, 'assets/icon-only.png'),
  // Android adaptif: latar & tanda terpisah; tanda diperkecil ke zona aman 66%
  png(svg(latar), 1024, 'assets/icon-background.png'),
  png(svg(kecil(tanda('m2'), 0.5)), 1024, 'assets/icon-foreground.png', false),
  // splash: latar gradasi, tanda kecil di tengah
  // splash: latar gradasi, tanda di tengah, wordmark kecil di bawah (layar HP memotong sisi kiri-kanan, jadi tetap di tengah)
  png(svg(latar + kecil(tanda('m3'), 0.28) + wordmark(9.8, 91)), 2732, 'assets/splash.png'),
  png(svg(latar + kecil(tanda('m4'), 0.28) + wordmark(9.8, 91)), 2732, 'assets/splash-dark.png'),
])
writeFileSync('public/favicon.svg', svg(latar + tanda('m5'), 23))
console.log('logo: assets/*.png & public/favicon.svg diperbarui')
