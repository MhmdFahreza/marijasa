'use server'

import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:muhammadfahreza0838@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

type PushDevice = {
  endpoint: string
  expirationTime: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

// Simpan device yang mendaftarkan notifikasi
let registeredDevice: PushDevice | null = null

// Daftarkan perangkat untuk menerima notifikasi
export async function registerNotificationDevice(device: PushDevice) {
  registeredDevice = device
  return { success: true }
}

// Kirim notifikasi ke perangkat yang terdaftar
export async function sendNotification(message: string) {
  if (!registeredDevice)
    return { success: false, error: 'No device registered for notifications' }

  try {
    await webpush.sendNotification(
      registeredDevice,
      JSON.stringify({
        title: 'Marijasa',
        body: message,
        icon: '/icon512_rounded.png',
      })
    )

    return { success: true }
  } catch (error) {
    console.error('Push Notification Error:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}
