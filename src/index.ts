import { Router, getErrorPageHTML } from '8track'

const router = new Router()

router.get`/`.handle(ctx => ctx.html('Hello, world!'))
router.get`/headers`.handle(ctx => { 
  return ctx.json(extractHeaders(ctx.event.request)) 
})
router.get`/ip`.handle(ctx => ctx.json({ origin: extractOrigin(ctx.event.request)}))
router.get`/user-agent`.handle(ctx => ctx.json({user_agent: ctx.event.request.headers.get('User-Agent')}))

router.get`/get`.handle(ctx => {
  const r = ctx.event.request
  const url = new URL(r.url)

  let args: {[key: string]: string} = {}
  for(let entry of url.searchParams.entries()) { // each 'entry' is a [key, value] tupple
    const [key, value] = entry;
    args[key] = value;
  }

  const ret = {
    args: args,
    headers: extractHeaders(r),
    origin: extractOrigin(r),
    url: url.toString()
  }
  return ctx.json(ret)
})

router.post`/post`.handle(async ctx => {
  const r = ctx.event.request
  const url = new URL(r.url)

  let args: {[key: string]: string} = {}
  for (let entry of url.searchParams.entries()) { // each 'entry' is a [key, value] tupple
    const [key, value] = entry;
    args[key] = value;
  }

  // TODO: Check if there's a body and a Content-Type header first
  let data: {[key: string]: string} = {}
  for (let entry of await r.formData()) {
    const [key, value] = entry
    data[key] = value.toString();
  }

  const ret = {
    args: args,
    formdata: data,
    headers: extractHeaders(r),
    origin: extractOrigin(r),
    url: url.toString()
  }
  return ctx.json(ret)  
})

router.all`(.*)`.handle(ctx => ctx.end('Not found', { status: 404 }))

addEventListener('fetch', e => {
  const res = router.getResponseForEvent(e).catch(
    error =>
      new Response(getErrorPageHTML(e.request, error), {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        },
      }),
  )

  e.respondWith(res as any)
})

function extractHeaders(request: Request): {[key: string]: string} {
  let headers: {[key: string]: string} = {}
  for (let h of request.headers) {
    headers[h[0]] = h[1]
  }
  return headers
}

function extractOrigin(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || ''
}