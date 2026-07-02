# Simple Chat App

A minimal real-time chat application.

- **Backend:** Node.js + Express + Socket.io (real-time messaging, REST history endpoint, in-memory storage)
- **Frontend:** React (via Vite) + socket.io-client

Built to satisfy: send/receive messages in real time, message timestamps, clean client/server separation.

## Project structure

```
chat-app/
├── server/          # Node.js + Socket.io backend
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── client/          # React frontend
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

## How it works

1. On load, the client fetches existing message history via `GET /api/messages`.
2. The client opens a Socket.io connection and emits `join` with the chosen username.
3. Sending a message emits a `chat message` event; the server timestamps it, stores it in memory, and broadcasts it to every connected client (including the sender), so all clients stay in sync instantly.
4. A `POST /api/messages` REST fallback also exists in case a client isn't using sockets.

## Running locally

### 1. Backend

```bash
cd server
npm install
npm start
```

Server runs on `https://chat-application-x4z1.onrender.com` by default (override with `PORT` in a `.env` file — see `.env.example`).

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Opens at `http://localhost:5173`. It talks to the backend at `https://chat-application-x4z1.onrender.com` by default — override with `VITE_SERVER_URL` in a `.env` file (see `.env.example`) if your backend runs elsewhere.

### 3. Try it

Open the frontend URL in two browser tabs (or two devices on the same network, using your machine's local IP instead of `localhost`), pick two different usernames, and chat — messages appear in both tabs instantly with timestamps.

## Deploying

- **Backend:** Render, Railway, or Fly.io all work well for a small Express + Socket.io app. Set `PORT` as an env var if the platform requires it.
- **Frontend:** `npm run build` produces a static `dist/` folder — deploy it to Vercel, Netlify, or Render Static Sites. Set `VITE_SERVER_URL` to your deployed backend's URL as a build-time env var.

## Pushing to GitHub

```bash
cd chat-app
git init
git add .
git commit -m "Initial commit: simple real-time chat app"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

## Turning this into an installable Android APK

The React app in `client/` is a fully installable PWA: `vite-plugin-pwa` auto-generates a real service worker (`sw.js`) and web manifest at build time, alongside the app icons already included. Running `npm run build` produces `dist/sw.js`, `dist/workbox-*.js`, and `dist/manifest.webmanifest` — everything PWABuilder checks for. Two real options to get an actual `.apk`, in order of effort:

### Option A — PWABuilder (no Android Studio needed, ~10 minutes)
1. Deploy `client/` to a live HTTPS URL — e.g. Vercel: `cd client && npx vercel --prod` (or Netlify Drop with the built `dist/` folder). Point `VITE_SERVER_URL` at your deployed backend first.
2. Go to **https://www.pwabuilder.com**, paste your live URL, and click "Start".
3. It will detect the manifest, icons, and service worker already built into this project (PWABuilder should show all three checks passing). Go to the **Android** package tab and click "Generate Package". It builds a signed APK/AAB for you server-side — no local Android SDK required.
4. Download the APK and install it on a device (`adb install app.apk`) or upload the AAB to the Play Store.

This wraps your live site in a Trusted Web Activity — a real Android app that opens fullscreen with no browser chrome, installable and shareable as a normal `.apk`.

### Option B — Capacitor (full native wrapper, needs Android Studio)
```bash
cd client
npm install @capacitor/core @capacitor/android
npx cap init "Simple Chat" com.yourname.chatapp
npm run build
npx cap add android
npx cap sync
npx cap open android
```
This opens the project in Android Studio, where you build → APK the normal way (Build menu → Build APK(s)). Requires Android Studio + Android SDK installed locally, which I can't run in my sandbox.

### Option C — True React Native (most work, most "native")
Rebuild `client/` using Expo (`npx create-expo-app`), reusing the same `socket.io-client` logic and hitting the same `server/` backend unchanged. Only worth it if you need native device APIs beyond what a PWA wrapper gives you.

For a course assignment deliverable, **Option A is almost certainly what's expected** — it's fast, produces a real installable `.apk`, and needs no native toolchain on your machine.

## Notes on scope

This uses in-memory storage (messages reset when the server restarts) since the brief asked to keep things simple. Swapping in MongoDB/PostgreSQL for persistence would be a small, contained change to `server.js`.
