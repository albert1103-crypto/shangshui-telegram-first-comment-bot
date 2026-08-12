# Telegram Automation Studio

Cloudflare Workers dashboard for automating comments from Telegram user accounts through MTProto. It supports multiple accounts, per-channel rules, Gemini AI comments, rotating templates, Durable Object scheduling, and multilingual output.

## Features

- Telegram user login with OTP and optional 2FA
- Channel discovery and per-channel enable/disable rules
- Thai, English, Simplified Chinese, Traditional Chinese, and Vietnamese output
- Gemini AI comments or user-defined rotating templates
- New-post scan every 45 minutes
- Per-account queue spacing of five minutes
- Durable Object alarms for scheduling and persistent state
- Dashboard authentication, queue state, and operational logs
- FLOOD_WAIT retry scheduling and automatic pause for revoked sessions

## Local checks

```bash
npm install
npm test
npx wrangler deploy --dry-run
```

## Deploy

The GitHub Actions workflow at `.github/workflows/automation-studio-ci.yml` runs tests, verifies the Worker bundle, deploys, and checks `/health`. For a permanent deployment, add these repository secrets in GitHub:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

The token should be limited to the target Cloudflare account with permission to edit Workers. If either secret is absent, the workflow uses Wrangler's temporary deployment mode for verification only; that preview is not production.

## First-run setup

1. Open the deployed Worker URL and create the dashboard password.
2. In Settings, enter the Telegram API ID and API hash from `my.telegram.org`.
3. Add a Gemini API key, or configure `GEMINI_API_KEY` as a Cloudflare secret.
4. Add one or more Telegram phone numbers and complete OTP/2FA in the dashboard.
5. Discover channels, choose rules, language, and AI or Template mode.
6. Verify `/health` and the Queue & Logs tab before enabling unattended operation.

No Telegram session, API credential, Gemini key, OTP, or password belongs in Git or GitHub source files. Sessions and dashboard settings are stored in the Durable Object state for the deployed Worker.
