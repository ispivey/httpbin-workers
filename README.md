# httpbin-workers

It's `httpbin` running on Cloudflare's edge compute platform, [Cloudflare Workers](https://workers.cloudflare.com). You can check it out at [httpbin.workers.works](https://httpbin.workers.works).

If you're unfamiliar, [httpbin.org](https://httpbin.org) is a service that responds to HTTP requests in predictable and useful ways. Software developers use it as a cheap mock for requests and responses in ad-hoc testing. I've used `httpbin` for years, but it's a Python/Flask service that runs in a Docker container. I love those technologies, but wanted to try deploying it in on Workers, and here we are.

To try it out:

* Want to validate the headers a piece of middleware is adding to your requests? Just send a request to https://httpbin.workers.works/headers.
* Want to validate that your application is setting `If-Not-Modified` headers appropriately? Just make a request to https://httpbin.workers.works/cache.

If you want to play around with `httpbin-workers` from your terminal, try `curl https://httpbin.workers.works/get | jq .` to pretty-print or manipulate the output with `jq`.

## Deployment

Changes to this repository are deployed directly to httpbin.workers.works.

To deploy to your own zone, clone or fork and update your `wrangler.toml` to include the appropriate account and zone ID for your deployment, and then run:

```bash
npm run docs && wrangler publish
```

## Implementation

The API lives in `src/index.ts`.

The documentation site is generated by [apiDoc](https://apidocjs.com) by running `npm run docs`, and is served using [Workers Sites](https://workers.cloudflare.com/sites). I chose apiDoc because it required very little tooling to automatically build a static API documentation site from JS/TS comments; I'm actively considering alternatives that are equally lightweight (i.e. no Java Swagger binaries) but give me more control over a better-designed responsive static site.

## Contributing

There's a lot of useful functionality that's missing! Feel free to file issues and make PRs.
