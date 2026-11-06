import { useEffect, useState, type ReactNode } from 'react'

// Penutup status bar (selalu ada) + header ringkas yang muncul setelah halaman digulir melewati `ambang` px.
// Header ikut menutupi area status bar sebagai satu permukaan, supaya tidak ada sambungan yang terlihat seperti garis.
export default function HeaderRingkas({ ambang, latar, children }: { ambang: number; latar: string; children: ReactNode }) {
  const [tampil, setTampil] = useState(false)
  useEffect(() => {
    const cek = () => setTampil(window.scrollY > ambang)
    cek()
    window.addEventListener('scroll', cek, { passive: true })
    return () => window.removeEventListener('scroll', cek)
  }, [ambang])

  return (
    <>
      <div aria-hidden="true" style={{ position: 'fixed', left: 0, right: 0, top: 0, height: 'env(safe-area-inset-top)', background: latar, zIndex: 30 }} />
      <div aria-hidden={!tampil} inert={!tampil} style={{
        position: 'fixed', left: 0, right: 0, top: 0, zIndex: 31, height: 'calc(env(safe-area-inset-top) + 56px)', padding: 'env(safe-area-inset-top) 20px 0',
        display: 'flex', alignItems: 'center', gap: 10, background: latar, boxShadow: '0 10px 18px -10px rgba(0,0,0,.3)',
        opacity: tampil ? 1 : 0, pointerEvents: tampil ? 'auto' : 'none', transition: 'opacity .25s ease',
      }}>
        {children}
      </div>
    </>
  )
}
