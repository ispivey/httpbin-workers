import { Router, getErrorPageHTML } from '8track'
import { getAssetFromKV, mapRequestToAsset, serveSinglePageApp, NotFoundError } from '@cloudflare/kv-asset-handler'

const router = new Router()

/**
 * @api {get} /headers /headers
 * @apiDescription Return the incoming request's HTTP headers.
 * @apiGroup Request Inspection
 *
 * @apiSuccess {Object} headers The incoming request's HTTP headers.
 */
router.get`/headers`.handle(ctx => {
  return ctx.json(extractHeaders(ctx.event.request))
})
/**
 * @api {get} /ip /ip
 * @apiDescription Returns the requester's IP address.
 * @apiGroup Request Inspection
 *
 * @apiSuccess {String} origin The requester's IP address.
 */
router.get`/ip`.handle(ctx => ctx.json({ origin: extractOrigin(ctx.event.request)}))
/**
 * @api {get} /user-agent /user-agent
 * @apiDescription Returns the request's user-agent.
 * @apiGroup Request Inspection
 *
 * @apiSuccess {String} user_agent The request's user-agent.
 */
router.get`/user-agent`.handle(ctx => ctx.json({user_agent: ctx.event.request.headers.get('User-Agent')}))

/**
 * @api {get} /get /get
 * @apiDescription Returns the GET request's query parameters.
 * @apiGroup HTTP Methods
 *
 * @apiSuccess {object} args args
 * @apiSuccess {object} headers headers
 * @apiSuccess {String} origin ip address
 * @apiSuccess {object} url url
 */
router.get`/get`.handle(async ctx => ctx.json(await handleGet(ctx.event.request)))

/**
 * @api {patch} /patch /patch
 * @apiDescription Returns the PATCH request's parameters.
 * @apiGroup HTTP Methods
 *
 * @apiSuccess {object} args args
 * @apiSuccess {object} formdata formdata
 * @apiSuccess {object} headers headers
 * @apiSuccess {String} origin ip address
 * @apiSuccess {object} url url
 */
router.patch`/patch`.handle(async ctx => ctx.json(await handleDeletePatchPostPut(ctx.event.request)))

/**
 * @api {post} /post /post
 * @apiDescription Returns the POST request's parameters.
 * @apiGroup HTTP Methods
 *
 * @apiSuccess {object} args args
 * @apiSuccess {object} formdata formdata
 * @apiSuccess {object} headers headers
 * @apiSuccess {String} origin ip address
 * @apiSuccess {object} url url
 */
router.post`/post`.handle(async ctx => ctx.json(await handleDeletePatchPostPut(ctx.event.request)))

/**
 * @api {put} /put /put
 * @apiDescription Returns the PUT request's parameters.
 * @apiGroup HTTP Methods
 *
 * @apiSuccess {object} args args
 * @apiSuccess {object} formdata formdata
 * @apiSuccess {object} headers headers
 * @apiSuccess {String} origin ip address
 * @apiSuccess {object} url url
 */
router.put`/put`.handle(async ctx => ctx.json(await handleDeletePatchPostPut(ctx.event.request)))

/**
 * @api {delete} /delete /delete
 * @apiDescription Returns the DELETE request's query parameters.
 * @apiGroup HTTP Methods
 *
 * @apiSuccess {object} args args
 * @apiSuccess {object} headers headers
 * @apiSuccess {String} origin ip address
 * @apiSuccess {object} url url
 */
router.delete`/delete`.handle(async ctx => ctx.json(await handleDeletePatchPostPut(ctx.event.request)))

/**
 * @api {get} /cache /cache
 * @apiDescription Returns a 304 if an If-Modified-Since header or If-None-Match is present.
 *  Returns the same as a GET otherwise.
 * @apiGroup Response Inspection
 * @apiHeader {String} If-None-Match ETag value, or list of ETag values, or *
 * @apiHeader {Date} If-Modified-Since Date
 *
 * @apiSuccess (200) Code 200 Success
 * @apiSuccess (304) Code 304 Not Modified
 */
router.get`/cache`.handle(async ctx => {
    const r = ctx.event.request

    if (r.headers.has('If-None-Match') || r.headers.has('If-Modified-Since')) {
        return ctx.end(new Response(null, {status: 304}))
    }
    // TODO: This needs to be the spec-compliant date format https://tools.ietf.org/html/rfc7231#section-7.1.1.1
    ctx.response.headers.append('Last-Modified', Date.now().toString())
    ctx.response.headers.append('ETag', uuid())
    return ctx.json(await handleGet(r))
  })

/**
 * Serve static assets for the documentation site.
 */
router.get`(.*)`.handle(async ctx => {
  return ctx.end(await getAssetFromKV(ctx.event))
})

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

async function handleGet(request: Request) {
    const r = request
    const url = new URL(r.url)

    return {
      args: extractArgs(r),
      headers: extractHeaders(r),
      origin: extractOrigin(r),
      url: url.toString()
    }
}

async function handleDeletePatchPostPut(request: Request) {
    const r = request
    const url = new URL(r.url)

    // TODO: Check if there's a body and a Content-Type header first
    let data: {[key: string]: string} = {}
    for (let entry of await r.formData()) {
        const [key, value] = entry
        data[key] = value.toString();
    }
    return {
      args: extractArgs(r),
      formdata: data,
      headers: extractHeaders(r),
      origin: extractOrigin(r),
      url: url.toString()
    }
}

function extractArgs(request: Request): {[key: string]: string} {
    const url = new URL(request.url)
    let args: {[key: string]: string} = {}
    for(let entry of url.searchParams.entries()) {
      const [key, value] = entry;
      args[key] = value;
    }
    return args
}

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

// uuid returns an RFC 4122 compliant universally unique
// identifier using the crypto API
function uuid() {

    // get sixteen unsigned 8 bit random values
    var u = crypto
      .getRandomValues(new Uint8Array(16));

    // set the version bit to v4
    u[6] = (u[6] & 0x0f) | 0x40

    // set the variant bit to "don't care" (yes, the RFC
    // calls it that)
    u[8] = (u[8] & 0xbf) | 0x80

    // hex encode them and add the dashes
    var uid = "";
    uid += u[0].toString(16);
    uid += u[1].toString(16);
    uid += u[2].toString(16);
    uid += u[3].toString(16);
    uid += "-";

    uid += u[4].toString(16);
    uid += u[5].toString(16);
    uid += "-";

    uid += u[6].toString(16);
    uid += u[7].toString(16);
    uid += "-";

    uid += u[8].toString(16);
    uid += u[9].toString(16);
    uid += "-";

    uid += u[10].toString(16);
    uid += u[11].toString(16);
    uid += u[12].toString(16);
    uid += u[13].toString(16);
    uid += u[14].toString(16);
    uid += u[15].toString(16);

    return uid;
  }
