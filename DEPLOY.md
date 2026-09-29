# Website digitalsage.ro — build and deploy

Status: **v1 final built 29.09.2026**, awaiting Iulia's upload to Cloudflare Pages.

## Layout
- `site/` = exactly what goes live (index.html, css/, fonts/, favicon.svg, robots.txt, sitemap.xml, `_headers`).
- `serve.js` = local preview of `site/` on http://localhost:8765 (launch.json entry `marketing-site`).
- `make-zip.js` = builds `digitalsage-site-YYYY-MM-DD.zip` with `/` paths (PowerShell's
  Compress-Archive writes `\` paths and Cloudflare Pages then uploads them as flat files; learned on clasificat.ro).

## Content decisions (29.09.2026, Iulia)
- Palette petrol + sage, leaf mark, Manrope: **approved**.
- CANTIS section **removed** (product parked since 15.09.2026). EU-visibility slot removed (no grant).
- EN only. No language switch shown.
- Footer: Digital SAGE IT Consulting SRL · CUI 46944791 · J2022019576402 · Bucharest, Romania.
  Street address deliberately not shown; update to Nerva Traian only if she wants it after ONRC registers the move.
- Contact: hello@digitalsage.ro only (alias exists in Google Workspace since 29.09.2026).
- No personal data, no client names (standing rules in ../STATE.md).

## Deploy (Cloudflare Pages, direct upload) — Iulia clicks, ~5 minutes
1. Cloudflare dashboard (same account as clasificat.ro) → Workers & Pages → Create → Pages → **Upload assets**.
2. Project name: `digitalsage`. Upload `digitalsage-site-YYYY-MM-DD.zip` from this folder. Deploy.
3. Project → Custom domains → Add `digitalsage.ro`, then add `www.digitalsage.ro`. DNS is already on
   Cloudflare, so it creates the CNAME records itself. HTTPS is automatic.
4. Check https://digitalsage.ro in a private window. Fonts must load from /fonts/ (no Google request).
5. Search Console: add property `digitalsage.ro` (domain, DNS TXT) and submit `https://digitalsage.ro/sitemap.xml`.

## Updating later
Edit `site/index.html`, bump `?v=` on the CSS link if `site.css` changed, `node make-zip.js`, upload the
new zip to the same project (Create deployment → upload). Update `lastmod` in `sitemap.xml`.

## Checks done before hand-over (29.09.2026, in-app browser)
- Zero external requests, Manrope 400–800 loaded from /fonts, no console errors.
- Mobile (574 px) and desktop layouts render; CANTIS gone, nav = Services / About / Contact.

## Update 29.09.2026 — Git route (replaces the zip upload)
Repo: https://github.com/iuliagarbacea/digitalsage-site (private). Cloudflare Pages should be connected to it:
Framework preset **None**, build command **empty**, build output directory **`site`**, production branch `main`.
After that every `git push` deploys. `make-zip.js` and the zip are kept only as fallback.
