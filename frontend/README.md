# Artivio

Modern Next.js App Router app with Firebase Auth, Firestore, Storage, and AI proxy endpoints.

## Setup

1. Copy `.env.local.example` to `.env.local` and fill values.
2. Install deps:

```
npm install
```

3. Run dev server:

```
npm run dev
```

## Firebase

- Update `firestore.rules` and `storage.rules` in Firebase Console.
- Enable Email/Password and Google sign-in providers.

## AI Backend

Set `FLASK_API_BASE` to your Cloud Run/Flask endpoint.
