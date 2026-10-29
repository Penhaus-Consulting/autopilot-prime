# Penhaus Edge: sales concierge

A Cloudflare Worker that runs the Penhaus sales chatbot on **Workers AI** (an open model hosted
by Cloudflare). There is no Anthropic or OpenAI key and no per-token vendor bill. Base44 stays the
system of record: leads land in the `Lead` entity through the `captureLead` function, and checkout
stays on the existing `/pricing` page (`create-checkout` is untouched).

## Routes

| Route | What it does |
| --- | --- |
| `GET /` | Full-page chat for link-in-bio traffic. Use `/?src=<persona>` to tag the source. |
| `GET /widget.js` | Chat bubble for any site: `<script src="https://<host>/widget.js" data-source="site" defer></script>` |
| `POST /chat` | Chat API used by the widget. Rate limited to 20 messages per minute per IP. |

## Cost

Workers AI includes 10,000 Neurons per day free. With `llama-3.3-70b-instruct-fp8-fast`, a typical
reply (about 1,500 tokens in, 250 out) costs about 90 Neurons, so roughly 100 replies a day are free.
Above that, the Workers Paid plan ($5/month) bills about $0.001 per reply. Change `MODEL` in
`wrangler.jsonc` to trade quality for cost.

## Deploy (one time)

```bash
cd edge
npm install
npx wrangler login
npx wrangler secret put EDGE_SHARED_SECRET
npx wrangler deploy
```

Then:

1. In Base44, set the `EDGE_SHARED_SECRET` secret to the same value.
2. Copy the public URL of the `captureLead` function into `LEAD_ENDPOINT` in `wrangler.jsonc`.
3. Set `APP_URL` and `ALLOWED_ORIGINS` to your live domain, then `npx wrangler deploy` again.
4. Create a public `#leads` channel in Slack for hot-lead alerts.

## Develop

```bash
npm run dev      # local Worker; the AI binding calls Cloudflare, so run `wrangler login` first
npm run verify   # Biome, TypeScript, and a dry-run deploy (what CI runs)
```
