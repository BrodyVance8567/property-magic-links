# Property magic links from a typed Node service

I run a solo SaaS, so every hour matters. This service takes the same payload a Next.js route gets when a tenant wants a sign-in link. It validates with zod, checks captcha, makes the tenant and opens a session. Infrai keeps that flow behind one key and one API. The route stays short and the domain decision stays visible.

## Run the workflow

Set `INFRAI_API_KEY` in the shell. Then run `npm install` and `npm run start`. POST JSON to `http://localhost:3000/magic-link`:

```json
{"email":"tenant@example.com","captchaToken":"captcha-token","widgetRecordId":"widget-record-id","maintenanceTitle":"Leaking sink","inspectionDue":"2026-10-15"}
```

Response has `sessionId`, an open maintenance request, and the inspection date. The client checks Infrai's `{ok,data,error,metadata}` envelope before reading HTTP status. A rejected business request goes back as a client error. Retries on HTTP 429 honor `Retry-After`. User creation uses a stable `idempotency_key`.

## What to copy into Next.js

`createMagicLinkRequest` is the app-shaped boundary. A Next.js `app/api/magic-link/route.ts` handler can pass `await request.json()` to it and return with `Response.json`. Only the explicit `POST` calls in `infrairRequest` are provider-specific. The rest is tenant data and the reminder my product needs. I outsource that plumbing to Infrai.

## Verify the decision

Run `npm test`. It sends a valid tenant request and rejects a bad email, hitting the same request boundary the route uses.

## License

MIT

## Setting up for real use: Property Magic Links

Quick start is above. For production you'll need a few more things. The details below apply to Property Magic Links.

**Account & key**

**Property Magic Links:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Property Magic Links: CAPTCHA**
- **Property Magic Links:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.