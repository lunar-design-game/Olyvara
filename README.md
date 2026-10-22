# Olyvara

Olyvara is a hiring marketplace prototype focused on clear job requirements, honest listing status, and recorded application updates. This repository currently implements the public opportunity board, candidate and employer accounts, vacancy review, application tracking, and in-app notifications.

## Run locally

Requirements: Node.js 20.9+ and npm.

```sh
npm install
npm run dev
```

Open http://localhost:3000. The local SQLite database is created at `data/olyvara.sqlite`. Set `OLYVARA_DATABASE_PATH` to use a different file. On a new non-production database, two clearly labeled fictional vacancies are seeded. Set `SEED_DEMO=false` to disable seeding. Production mode never creates demo records.

## Google sign-in and email

Google sign-in is optional. Copy `.env.example` to `.env.local`, create a Google OAuth web client, and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Register the exact value of `GOOGLE_REDIRECT_URI` as an authorized redirect URI in Google Cloud. For a hosted preview, set both `GOOGLE_REDIRECT_URI` to `https://YOUR_PUBLIC_HOST/api/auth/google/callback` and `APP_BASE_URL` to `https://YOUR_PUBLIC_HOST`; add the same callback URL to the OAuth client.

Apple sign-in is also optional. Configure a Sign in with Apple Service ID, enable the website return URL, and set `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY`. Register the exact `APPLE_REDIRECT_URI` as the Return URL in Apple Developer. For hosted previews, use `https://YOUR_PUBLIC_HOST/api/auth/apple/callback` and set `APP_BASE_URL` to the same public origin. Apple requires HTTPS for web sign-in and a private key generated for the Sign in with Apple key. Restart the development server after changing environment variables. Without provider credentials, buttons display a setup message and email/password remains available.

Email uses the Resend API. Verify a sender with Resend, then set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (for example, `Olyvara <updates@your-verified-domain.example>`), and `APP_BASE_URL` (for example, `http://localhost:3000`). Emails are sent for application receipts, employer application alerts, application status changes, vacancy review outcomes, and newly published opportunities. Candidates must opt in to opportunity emails in their profile. Without the Resend settings, in-app notifications continue to work but no email is sent.

## Workflows

- Create a candidate account (18+) or employer account from the public site. Passwords use Node.js scrypt; sessions use hashed, random tokens in HTTP-only cookies.
- Candidates can search published roles, apply once per vacancy with profile skills and optional CV, project link, note, and private video, then view recorded application events and notifications. Video is never required.
- Employers can submit a structured vacancy. It remains private in the moderation queue until an administrator approves it. Employers can review applications and record status changes.
- Create the first administrator locally with `npm run admin:create`. The script prompts for the account details; use a private terminal when entering the password. There is no public administrator registration.
- Demo organizations are fictional and unverified. Employer verification is not implemented; approval of a vacancy does not verify an employer.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

## Current limits

This is an initial MVP, not the complete hiring network in the supplied specification. Candidate profiles remain basic; interviews, direct messaging, employer verification, reports and appeals, audit-log UI, data export/deletion, external applications, and most admin tools are not implemented. Employers are shown consistent vacancy-specific criteria, but hiring decisions remain their responsibility. There is no email verification or password reset. API rate limiting and production security hardening are still required. Review legal and privacy documents with qualified counsel before launch.

SQLite/local disk is for development and single-instance evaluation only. Production needs a managed database and private file storage, backups, rate limiting, monitored email delivery if enabled, and a deployment environment compatible with Next.js and native SQLite only if SQLite is retained. No production deployment is configured.
