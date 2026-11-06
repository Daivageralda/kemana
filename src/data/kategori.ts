import {
  Coffee, ForkKnife, Heartbeat, Lightning, Motorcycle, Popcorn, ShoppingBag, SquaresFour,
  type Icon,
} from '@phosphor-icons/react'

// kunci = akhiran kelas pastel di kemana.css (.p-makan, .p-jajan, ...)
export const KATEGORI = [
  { key: 'makan', nama: 'Makan', ikon: ForkKnife },
  { key: 'jajan', nama: 'Jajan', ikon: Coffee },
  { key: 'transport', nama: 'Transport', ikon: Motorcycle },
  { key: 'belanja', nama: 'Belanja', ikon: ShoppingBag },
  { key: 'tagihan', nama: 'Tagihan', ikon: Lightning },
  { key: 'hiburan', nama: 'Hiburan', ikon: Popcorn },
  { key: 'sehat', nama: 'Kesehatan', ikon: Heartbeat },
  { key: 'lain', nama: 'Lainnya', ikon: SquaresFour },
] as const satisfies readonly { key: string; nama: string; ikon: Icon }[]

export type KategoriKey = (typeof KATEGORI)[number]['key']

export const BAYAR = [
  { key: 'tunai', nama: 'Tunai' },
  { key: 'debit', nama: 'Debit' },
  { key: 'ewallet', nama: 'E-wallet' },
  { key: 'qris', nama: 'QRIS' },
] as const

export type BayarKey = (typeof BAYAR)[number]['key']
