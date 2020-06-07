import {} from '@cloudflare/workers-types'

addEventListener('fetch', event => {
  event.respondWith(fetch(event.request))
})
