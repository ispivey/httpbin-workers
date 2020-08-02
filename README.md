# httpbin-workers

It's `httpbin` running on Cloudflare's edge compute platform, Workers. You can check it out at [httpbin.workers.works](https://httpbin.workers.works).

If you're unfamiliar, [httpbin.org](https://httpbin.org) is a service that responds to HTTP requests in predictable and useful ways. Software developers use it as a cheap mock for requests and responses in ad-hoc testing. I've used `httpbin` for years, but it's a Python/Flask service that runs in a Docker container. I love those technologies, but wanted to try deploying it in on Workers, and here we are.

To try it out:

* Want to validate the headers a piece of middleware is adding to your requests? Just send a request to https://httpbin.workers.works/headers.
* Want to validate that your application is setting `If-Not-Modified` headers appropriately? Just make a request to https://httpbin.workers.works/cache.

If you want to play around with `httpbin-workers` from your terminal, try `curl https://httpbin.workers.works/get | jq .` to pretty-print or manipulate the output with `jq`.

## Deployment

To deploy, first update `wrangler.toml` to include the appropriate account and zone ID for your deployment, and then run:

```bash
npm run docs && wrangler publish
```

## Contributing

There's a lot of useful functionality that's missing! Feel free to file issues and make PRs.
