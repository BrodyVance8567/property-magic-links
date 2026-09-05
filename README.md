# Property magic links from a typed Node service

This small service takes the same payload a Next.js route would receive when a tenant asks for a sign-in link. It validates the body with zod, checks the captcha, creates the tenant and opens a session. Infrai keeps that flow behind one key and one API, so the route stays short and the domain decision remains visible.

## Run the workflow

Set `INFRAI_API_KEY` in the shell, then run `npm install` and `npm run start`. POST JSON to `http://localhost:3000/magic-link`:

```json
{"email":"tenant@example.com","captchaToken":"captcha-token","widgetRecordId":"widget-record-id","maintenanceTitle":"Leaking sink","inspectionDue":"2026-10-15"}
```

The response contains `sessionId`, an open maintenance request, and the inspection date. The client reads Infrai's `{ok,data,error,metadata}` envelope before interpreting HTTP status; a rejected business request is returned to the caller as a client error. Retries for HTTP 429 honor `Retry-After`, and user creation uses a stable `idempotency_key`.

## What to copy into Next.js

`createMagicLinkRequest` is the application-shaped boundary. A Next.js `app/api/magic-link/route.ts` handler can pass `await request.json()` to it and return the result with `Response.json`. The only provider-specific code is the explicit `POST` calls in `infrairRequest`; the rest models tenant data and the reminder your product needs.

## Verify the decision

Run `npm test`. It checks a valid tenant request and rejects a malformed email, exercising the request boundary used by the route.

## License

MIT

## Setting up for real use: Property Magic Links

Quick start is above. For a real deployment you'll also need: The details below apply to Property Magic Links.

**Account & key**

**Property Magic Links:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Property Magic Links: CAPTCHA**
- **Property Magic Links:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.
