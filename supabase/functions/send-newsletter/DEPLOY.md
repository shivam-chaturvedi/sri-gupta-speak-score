# Deploy `send-newsletter` Edge Function

## Secrets (Supabase Dashboard → Project Settings → Edge Functions → Secrets)

| Secret | Description |
|--------|-------------|
| `GMAIL_USER` | Gmail address used to send (e.g. `newsletter@yourdomain.com`) |
| `GMAIL_PASS` | Gmail App Password (not your normal login password) |

Create an App Password: Google Account → Security → 2-Step Verification → App passwords.

## Deploy (required — CORS errors usually mean this function is not deployed yet)

```bash
supabase login
supabase functions deploy send-newsletter --project-ref vybyyhmaaiurjrbusqch
```

After deploy, preflight `OPTIONS` should return **204**. If you still see CORS errors, open DevTools → Network and confirm the response is not **404 NOT_FOUND**.

## Deploy via Supabase Dashboard (no CLI)

1. Supabase Dashboard → **Edge Functions** → **Create function** (or edit if it exists).
2. Name: `send-newsletter`
3. Paste the contents of `supabase/functions/send-newsletter/index.ts` (uses `npm:nodemailer` — compatible with Supabase runtime).
4. Deploy, then add secrets `GMAIL_USER` and `GMAIL_PASS` under **Secrets**.

**Note:** The older `deno.land/x/smtp` library fails on Supabase with `Deno.writeAll is not a function`. Redeploy after pulling the nodemailer version.

## Test locally

```bash
supabase functions serve send-newsletter --env-file ./supabase/.env.local
```
