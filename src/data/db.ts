import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite'

const NAMA = 'kemana'
const WEB = Capacitor.getPlatform() === 'web'
const sqlite = new SQLiteConnection(CapacitorSQLite)

const SKEMA = `
CREATE TABLE IF NOT EXISTS catatan (
  id TEXT PRIMARY KEY NOT NULL,
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  keterangan TEXT NOT NULL DEFAULT '',
  kategori TEXT NOT NULL,
  bayar TEXT NOT NULL,
  waktu TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS catatan_waktu ON catatan (waktu);
`

let koneksi: Promise<SQLiteDBConnection> | undefined

// satu koneksi untuk seluruh aplikasi, dibuka saat pertama dipakai
export function db(): Promise<SQLiteDBConnection> {
  koneksi ??= buka().catch((e) => {
    koneksi = undefined // biar bisa dicoba lagi
    throw e
  })
  return koneksi
}

async function buka() {
  if (WEB) {
    // browser (pnpm dev): SQLite lewat sql.js wasm di public/assets, disimpan ke IndexedDB
    const { defineCustomElements } = await import('jeep-sqlite/loader')
    await defineCustomElements(window)
    document.body.appendChild(document.createElement('jeep-sqlite'))
    await customElements.whenDefined('jeep-sqlite')
    await sqlite.initWebStore()
  }
  const con = await sqlite.createConnection(NAMA, false, 'no-encryption', 1, false)
  await con.open()
  await con.execute(SKEMA)
  return con
}

// web hanya menulis ke IndexedDB saat diminta; native langsung ke file
export async function tulisWeb() {
  if (WEB) await sqlite.saveToStore(NAMA)
}
