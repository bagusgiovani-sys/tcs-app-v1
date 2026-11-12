import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { NetworkOnly, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  // Only immutable build assets and public icons may be served offline.
  precacheEntries: (self.__SW_MANIFEST ?? []).filter((entry) => {
    const url = new URL(typeof entry === 'string' ? entry : entry.url, self.location.origin)
    return url.origin === self.location.origin &&
      (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/'))
  }),
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [{ matcher: () => true, handler: new NetworkOnly() }],
})

// Remove caches left by the previous broad defaultCache configuration.
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(
    names.filter((name) => ['apis', 'others', 'cross-origin', 'pages', 'pages-rsc', 'pages-rsc-prefetch', 'next-data', 'static-data-assets'].includes(name))
      .map((name) => caches.delete(name))
  )))
})

serwist.addEventListeners()
