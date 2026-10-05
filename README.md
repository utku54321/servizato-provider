# Servizato Partner (Service Provider) App

Mobile-first web app for service providers on the Servizato marketplace: dashboard with jobs and revenue, incoming requests, technician assignment, team list, services and pricing, finance and customer reviews.

> **Prototype:** sample jobs and reviews live in `samples.js`. Changes are saved in the browser (localStorage). There is no backend yet.

**Live:** https://utku54321.github.io/servizato-provider/

## Connected demo

This app works with the other two Servizato apps on the same device:

- [Customer app](https://utku54321.github.io/servizato-customer/) → a booking appears here under **Requests** (marked **Customer app**)
- **Partner app** → **Accept and assign** a technician, or decline (the customer is told)
- [Technician app](https://utku54321.github.io/servizato-technician/) → the technician accepts and does the job; progress, parts, photos, payment and the review flow back here

If a booking was made for a different provider, a banner offers to switch (**More → Signed in as**).

## Screens

1. **Home** - revenue today and this week, jobs today, new requests, rating, active jobs
2. **Requests** - accept and assign, or decline; jobs waiting for a technician to accept
3. **Assign** - pick a technician (availability, skill match, rating)
4. **Team** - technicians, on/off duty, current job, weekly earnings
5. **Services and pricing** - set prices and turn services on or off per category
6. **Finance** - 7-day revenue chart, technician payouts (60%), platform fee (15%), net earnings, next settlement, transactions
7. **Reviews** - rating breakdown, customer reviews, reply

## Run it locally

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Every push to `main` builds and publishes to GitHub Pages (`.github/workflows/deploy.yml`). It is installable on phones (manifest and offline service worker in `public/`).

## Project structure

```
App.jsx      navigation, app state, provider actions
screens.jsx  Dashboard, Requests, Assign, Job, Team, Services, Finance, Reviews, More
samples.js   sample jobs, payment history and reviews per provider
shared.js    link to the customer and technician apps (same file in all three repos)
data.js      services, providers and bill calculation (same as the customer app)
icons.jsx    inline SVG icons
styles.css   design tokens and styles
public/      app icons, manifest.webmanifest, sw.js
```

## Cloud sync across phones (Firebase)

The three apps can sync live across different phones through Firebase Firestore (free Spark plan is enough). Without it they still work, but only on one device.

1. Go to https://console.firebase.google.com → **Add project** (e.g. `servizato`). Google Analytics is optional.
2. **Build → Firestore Database → Create database** → pick a location (e.g. `asia-south1` Mumbai) → start in **production mode**.
3. Firestore → **Rules** tab → paste the contents of `firestore.rules` → **Publish**.
4. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable**.
5. **Project settings (gear) → Your apps → Web (`</>`)** → register an app → copy the `firebaseConfig` values.
6. Paste them into `firebase-config.js` in **all three repos** (customer, provider, technician) and push. GitHub Pages redeploys automatically.

Then open **Account / More** in any app: it should say **Live sync on**. A booking made on one phone appears in the Partner app on another phone, and the technician's progress, parts, photos and the payment flow back live.

How it works: `backend.js` keeps two Firestore collections, `bookings` (written by the customer app) and `jobs` (provider + technician progress). `shared.js` reads and writes through it and falls back to browser storage when no config is set.

> The demo rules let any app user read and write. Before real customers, add phone-OTP login and role-based rules (customers see only their bookings, providers only their jobs).

## Connecting a real backend later

Replace the helpers in `shared.js` (`readJobs`, `patchJob`, `subscribe`) and the sample data in `samples.js` with API calls.
