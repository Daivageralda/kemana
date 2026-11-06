import { useId } from 'react'
import { ATAS, CELAH, K, KUNYIT, TEBAL, TITIK } from '../lib/logo'

// logo k Pita; warna garis ikut `color` (default putih), titik default kunyit
export default function LogoPita({ size = 48, color = '#fff', dot = KUNYIT }: { size?: number; color?: string; dot?: string }) {
  const mask = `pita${useId().replace(/[^\w-]/g, '')}` // id React berisi « » yang tidak aman untuk url(#…)
  const garis = { fill: 'none', stroke: color, strokeWidth: TEBAL, strokeLinejoin: 'round' } as const
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
        <rect width="100" height="100" fill="#fff" />
        <path d={CELAH} fill="none" stroke="#000" strokeWidth={17} />
      </mask>
      <path d={K} {...garis} strokeLinecap="round" mask={`url(#${mask})`} />
      <path d={ATAS} {...garis} />
      <circle {...TITIK} fill={dot} />
    </svg>
  )
}
