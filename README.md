# RoomSync

**Android roommate management app** for shared living — profiles, group chat, fair chore assignment, roommate ratings, and AI-assisted moderation.

Built as a full-stack mobile product for UBC CPEN 321 (Software Engineering).

---

## Why RoomSync?

Shared housing breaks down over communication, uneven chores, and no accountability. RoomSync gives roommates one place to:

- Coordinate day-to-day living in a shared group space
- Distribute household tasks fairly with an assignment algorithm
- Build a track record through post-stay ratings and testimonials
- Flag harmful behavior with LLM-backed content moderation

---

## Features

| Area                | What it does                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| **Auth & profiles** | Google OAuth sign-in; mandatory + optional living-preference profiles                             |
| **Groups**          | Create/join with invite codes; ownership transfer, member removal, leave/delete                   |
| **Real-time chat**  | Socket.IO messaging with in-chat polls (1-week expiry)                                            |
| **Tasks**           | Recurring chores, difficulty weighting, calendar/weekly/my-tasks views, auto or manual assignment |
| **Ratings**         | Unlock after 30 days living together; scores + optional testimonials                              |
| **Moderation**      | Report users → OpenAI analyzes recent messages → offensive accounts flagged                       |

---

## Tech Stack

| Layer           | Technologies                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------- |
| **Frontend**    | Kotlin, Jetpack Compose, Retrofit, Navigation Compose, Coil, Socket.IO client, Google Sign-In |
| **Backend**     | Node.js, Express, TypeScript, Mongoose, Socket.IO, JWT, google-auth-library                   |
| **Data / APIs** | MongoDB, Google OAuth 2.0, OpenAI (via OpenRouter)                                            |
| **Deploy**      | Google App Engine (backend), Android APK                                                      |
| **Quality**     | Jest + Supertest (mocked & integration), Compose UI / E2E tests, GitHub Actions CI            |

```
┌─────────────────┐     REST + WebSocket      ┌──────────────────┐
│  Android App    │ ◄───────────────────────► │  Express API     │
│  (Compose)      │                           │  + Socket.IO     │
└─────────────────┘                           └────────┬─────────┘
                                                       │
                              ┌────────────────────────┼────────────────────────┐
                              ▼                        ▼                        ▼
                         MongoDB                  Google OAuth              OpenAI API
```

---

## Project Structure

```
├── frontend/          # Android app (Kotlin / Jetpack Compose)
├── backend/           # Node.js / TypeScript API + Socket.IO
├── documentation/     # Requirements, design, and testing docs
├── DEPLOYMENT.md      # GCP App Engine deployment guide
├── deploy.sh / .bat   # Deployment scripts
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Android Studio (API 26+)
- Google Cloud OAuth client ID (Android + web as needed)

### Backend

```bash
cd backend
cp .env.example .env   # fill MONGODB_URI, GOOGLE_CLIENT_ID, JWT_SECRET, etc.
npm install
npm run dev            # http://localhost:3000
```

```bash
npm test               # Jest suite
npm run test:coverage
```

### Frontend

1. Open `frontend/` in Android Studio.
2. Point the API base URL at your backend (see `RetrofitInstance.kt`).
3. Configure Google Sign-In / `google-services.json`.
4. Run on an emulator or device (minSdk 26).

### Deploy backend

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for App Engine setup (`deploy.bat` / `deploy.sh`).

---

## Documentation

Course and design docs stay in `documentation/` — use them when you want depth, not as the landing page:

| Doc                                                                 | Contents                                      |
| ------------------------------------------------------------------- | --------------------------------------------- |
| [Requirements & Design](./documentation/Requirements_and_Design.md) | Features, use cases, architecture, APIs, NFRs |
| [Testing & Code Review](./documentation/Testing_And_Code_Review.md) | Backend/frontend test map, CI, review notes   |
| [Deployment](./DEPLOYMENT.md)                                       | GCP App Engine deploy steps                   |
| [Backend tests](./backend/src/__tests__/README.md)                  | How the Jest suite is organized               |
---

## Team

- Andy Lu
- Lily Lim
- Lucas Song
- Nick Liu
