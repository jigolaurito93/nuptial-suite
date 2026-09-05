# Pending installs (failed 5 Sep 2026 — slow work network)

Run these at home. Nothing below is in `package.json` yet.

## 1. npm packages (registry timeout)

```bash
pnpm add qrcode
pnpm add -D @types/qrcode
```

Failed with `ETIMEDOUT` / `ERR_PNPM_META_FETCH_FAIL` against `https://registry.npmjs.org/qrcode` and `@types/qrcode`.

After they install, swap [`src/components/invitation/BankQr.tsx`](src/components/invitation/BankQr.tsx) from the `api.qrserver.com` image URL to local `QRCode.toDataURL(...)` so the gift QR does not depend on a third-party API.

## 2. Google Fonts (build-time fetch failed)

`next/font/google` could not download:

- Cormorant Garamond (`wght@400;500;600;700`)
- Outfit (`wght@100..900`)

Workaround in place: stylesheet `<link>` in [`src/app/layout.tsx`](src/app/layout.tsx) (runtime load, build does not need Google Fonts).

Optional at home: restore `next/font/google` in layout so fonts are self-hosted at build time, then run `pnpm build` while online.
