import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

// layar berlatar gelap/berwarna: teks status bar putih selama layar ini tampil
export function useStatusBarPutih() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    StatusBar.setStyle({ style: Style.Dark })
    return () => { StatusBar.setStyle({ style: Style.Light }) }
  }, [])
}
