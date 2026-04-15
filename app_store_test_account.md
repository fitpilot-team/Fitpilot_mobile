# App Review Account

This document is the canonical runbook for the iOS App Review account used by Apple reviewers.

## Credentials

- Email: `appreview@fitpilot.fit`
- Password: `AppleReviewFit2026!`
- App Store Connect app: `Fitpilot`
- Current release target: iOS `1.0.0`

## Expected Reviewer State

Before every iOS submission, the reviewer account must expose real-looking data in both domains.

Nutrition must have:

- `1` active professional assignment for the current date
- `1` reusable weekly menu assigned for `21` consecutive days
- `1` active daily target block
- `3` body measurement records with recent dates
- `2` glucose records with recent dates
- at least one recipe-backed meal with image support

Training must have:

- `1` active trainer assignment for the current date
- `1` active macrocycle spanning previous, current, and next week
- `3` seeded microcycles
- `5` active training days per week plus recovery days
- completed workout logs in previous and current week
- at least one future or pending session still visible to the reviewer

## Seed Commands

Run these commands from the workspace root before the candidate build when the reviewer data needs to be refreshed.

```bash
pnpm --dir fitpilot-nutrition-backend exec ts-node scripts/seed-apple-reviewer-diet.ts
python fitpilot-training-backend/scripts/seed_apple_reviewer.py
```

Both scripts are date-relative. Re-running them keeps the reviewer timeline current instead of leaving stale dates in the past.

## Production Verification

The validation target for App Review is production:

- Nutrition API: `https://nutrition-api.fitpilot.fit/v1`
- Training API: `https://training-api.fitpilot.fit/api`

Run the verifier after seeding and before resubmitting to Apple:

```bash
python scripts/verify_app_review_account.py
```

Optional overrides:

```bash
python scripts/verify_app_review_account.py \
  --nutrition-api-url https://nutrition-api.fitpilot.fit/v1 \
  --training-api-url https://training-api.fitpilot.fit/api
```

If production login is protected by Turnstile, pass a token captured from the mobile bridge flow:

```bash
python scripts/verify_app_review_account.py --captcha-token <turnstile-token>
```

The verifier checks:

- nutrition login and refresh token flow
- `/auth/me`
- `/menus/client-professional-summary`
- `/menus/daily/batch`
- `/measurements/me`
- `/client-health-metrics/me`
- `/client-app/training-professional-summary`
- `/client-app/dashboard-bootstrap`

The command exits with non-zero status if the reviewer account is missing required data.

## App Store Connect Notes

Paste these values into `App Review Information` when Apple requests a sign-in:

- Sign-in required: `Yes`
- Username: `appreview@fitpilot.fit`
- Password: `AppleReviewFit2026!`
- Review note:
  Use the provided reviewer account. The account includes an active nutrition plan, assigned professional, body measurements, glucose logs, and an active training program with completed history plus upcoming sessions.

## Release Gate

Do not send a build to App Review unless all of the following are true on production APIs:

- nutrition professional summary returns `assigned`
- training professional summary returns `assigned`
- daily batch returns `7` populated days
- measurements history returns at least `3` records
- glucose history returns at least `2` records
- dashboard bootstrap returns a non-null `program`

If any of those fail, fix the data first and then rerun the verifier.
