# Analytics

Kelime Tostu uses PostHog for product analytics, web analytics, and session replay.

## Setup

Create `.env.local` for local testing:

```bash
VITE_POSTHOG_PROJECT_TOKEN=phc_your_project_token
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_POSTHOG_CAPTURE_LOCAL=false
VITE_POSTHOG_DEBUG=false
```

`VITE_POSTHOG_CAPTURE_LOCAL=false` keeps local development data out of PostHog by default. Set it to `true` only when intentionally testing analytics locally.

For GitHub Pages, add repository variables:

- `VITE_POSTHOG_PROJECT_TOKEN`
- `VITE_POSTHOG_HOST`

The deploy workflow passes those variables to the Vite build.

## Captured Events

Autocapture, pageleave, web performance, and session replay are enabled through the PostHog browser SDK when a project token is present.

Custom events:

- `app_loaded`
- `screen_viewed`
- `mode_selected`
- `game_started`
- `invalid_guess`
- `guess_submitted`
- `game_completed`
- `help_opened`
- `stats_opened`
- `share_result`

`game_started`, `invalid_guess`, `guess_submitted`, `game_completed`, `stats_opened`, and `share_result` include the answer as event properties. `guess_submitted` also includes the guessed word.

## Session Replay

Session replay is enabled client-side with input masking:

- All inputs are masked.
- Elements with `.ph-no-capture` or `data-ph-block` are blocked.
- Elements with `.ph-mask` or `data-ph-mask` are text-masked.

Replay availability can still be controlled from PostHog project settings, including sampling and replay triggers.
