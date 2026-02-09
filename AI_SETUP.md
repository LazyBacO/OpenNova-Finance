# AI Advisor setup

This project’s AI Advisor uses the Vercel AI SDK. The server route is `app/api/chat/route.ts`.

## Recommended (server-side key)

1. Create a `.env.local` file (not committed) with:

```bash
OPENAI_API_KEY=your_openai_api_key

# Optional (defaults to gpt-5.3-codex)
OPENAI_MODEL=gpt-5.3-codex
# Optional UI label (defaults to GPT-5.3-Codex)
NEXT_PUBLIC_OPENAI_MODEL_LABEL=GPT-5.3-Codex
# Optional: secure /api/notification-cron with this secret
NOTIFICATION_CRON_SECRET=your_cron_secret
```

2. Restart the dev server:

```bash
pnpm dev
```

## Security note

`/api/chat` only uses `OPENAI_API_KEY` on the server. Client-supplied keys are ignored.
If `NOTIFICATION_CRON_SECRET` is set, `/api/notification-cron` requires
`x-cron-secret` or `Authorization: Bearer <secret>`.

