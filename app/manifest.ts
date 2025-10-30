import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Marijasa',
    short_name: 'Marijasa',
    description: 'Penyedia Jasa Rumah Tangga',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon512_rounded.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon512_rounded.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icon512_rounded.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
