# PREVENTA WhatsApp Webhook

Decision legitimization engine for CHWs — full SAVA+E syndemic (HIV, mental health, stigma, substance misuse, violence/GBV, economic instability).

## Quick deploy
1. Install Vercel CLI: npm install -g vercel
2. Log in: vercel login
3. Deploy: vercel deploy
4. Add env vars in Vercel dashboard (Settings → Environment Variables)
5. Redeploy after adding env vars: vercel deploy --prod

## Environment variables required
- WA_TOKEN — WhatsApp permanent system user token
- WA_PHONE_NUMBER_ID — 1086023194590299
- ANTHROPIC_API_KEY — from console.anthropic.com
- VERIFY_TOKEN — preventa_verify_2026

## Districts covered
Kampala · Wakiso · Jinja · Masaka · Mbarara · Busia

## Evidence base
- Logie, Okumu et al. 2022 — SAVA syndemic, Kampala (DOI: 10.1136/bmjgh-2021-006583)
- Bhardwaj et al. 2023 — SAVA + viral load, South Africa (DOI: 10.1186/s12905-023-02392-2)
- Sheira et al. 2023 — food insecurity + transactional sex (DOI: 10.1007/s10461-023-04173-2)

## Ethics gate
Internal team testing: no ethics approval needed.
CHW field deployment: requires Makerere IRB + UIUC IRB + UNCST clearance.
