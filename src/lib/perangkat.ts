import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const ID_PENGINGAT = 2100
const NATIVE = Capacitor.isNativePlatform()
const KUNCI_JAM = 'kemana.jamPengingat'

// jam pengingat "HH:MM"; disimpan lokal, kalau hilang kembali ke 21:00
export function jamPengingat(): string {
  try { return localStorage.getItem(KUNCI_JAM) ?? '21:00' } catch { return '21:00' }
}

// status pengingat dibaca langsung dari jadwal notifikasi, tidak disimpan terpisah
export async function pengingatAktif(): Promise<boolean> {
  if (!NATIVE) return false
  const { notifications } = await LocalNotifications.getPending()
  return notifications.some((n) => n.id === ID_PENGINGAT)
}

// true kalau berhasil; false kalau izin notifikasi ditolak. Menjadwalkan ulang = batalkan lalu jadwalkan.
export async function aturPengingat(nyala: boolean, jam = jamPengingat()): Promise<boolean> {
  try { localStorage.setItem(KUNCI_JAM, jam) } catch { /* jam tetap dipakai untuk jadwal ini */ }
  if (!NATIVE) return false
  if (!nyala) {
    await LocalNotifications.cancel({ notifications: [{ id: ID_PENGINGAT }] })
    return true
  }
  const izin = await LocalNotifications.requestPermissions()
  if (izin.display !== 'granted') return false
  const [hour, minute] = jam.split(':').map(Number)
  await LocalNotifications.cancel({ notifications: [{ id: ID_PENGINGAT }] })
  await LocalNotifications.schedule({
    notifications: [{
      id: ID_PENGINGAT,
      title: 'Kemana',
      body: 'Hari ini uangmu ke mana aja? Catat semenit, dompet adem.',
      schedule: { on: { hour, minute }, allowWhileIdle: true },
    }],
  })
  return true
}

export async function bagikanCsv(isi: string, nama: string) {
  if (!NATIVE) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([isi], { type: 'text/csv' }))
    a.download = nama
    a.click()
    URL.revokeObjectURL(a.href)
    return
  }
  const { uri } = await Filesystem.writeFile({ path: nama, data: isi, directory: Directory.Cache, encoding: Encoding.UTF8 })
  await Share.share({ title: nama, url: uri })
}
