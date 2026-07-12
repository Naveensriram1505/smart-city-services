# Firebase Setup

## 1. Project & web app

1. [Firebase console](https://console.firebase.google.com) → create/select a project → **Add app → Web**.
2. Copy the config object into `frontend/www/js/firebase-config.js`.

## 2. Authentication

Authentication → Sign-in method → enable:
- **Email/Password** (Login, Registration, Forgot Password screens)
- **Google** (needed for the Google Sign-In button — see note below)

**Google Sign-In note:** the Firebase JS SDK's popup/redirect flow does not
work reliably inside a Capacitor WebView. The app calls
`@capacitor-firebase/authentication`'s native Google sign-in instead, which
needs, once you're in Android Studio:
1. Download `google-services.json` from Project settings → your Android
   app (add one if you haven't: package name `com.smartcity.services`) →
   place it in `android/app/`.
2. Add your debug **and** release SHA-1 fingerprints under that Android
   app's settings (`./gradlew signingReport` in the android/ folder gets you
   the debug one).
3. Run `npx cap sync android` after installing the npm package.

Until that's done, the button shows a friendly "works once built in Android
Studio" message rather than failing silently.

## 3. Firestore

Firestore Database → Create database → production mode. Collections:

| Collection     | Written by            | Read by         |
|----------------|------------------------|------------------|
| `users`        | app, on registration    | owner            |
| `complaints`   | app (citizen reports)   | owner + admin    |
| `sosAlerts`    | app (SOS button)        | admin only       |
| `bills`        | back office / admin     | owner            |
| `notices`      | back office / admin     | everyone (public)|

Rules:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isOwner(uid) { return isSignedIn() && request.auth.uid == uid; }
    // Simplest possible admin check — a curated allowlist doc. Swap for
    // Firebase custom claims before this app has real admins.
    function isAdmin() {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /users/{uid} {
      allow read, write: if isOwner(uid);
    }

    match /complaints/{id} {
      allow create: if isSignedIn() && request.resource.data.uid == request.auth.uid;
      allow read: if isOwner(resource.data.uid) || isAdmin();
      allow update: if isAdmin(); // status transitions come from the admin dashboard
      allow delete: if false;
    }

    match /sosAlerts/{id} {
      allow create: if isSignedIn() && request.resource.data.uid == request.auth.uid;
      allow read: if isAdmin();
    }

    match /bills/{id} {
      allow read: if isOwner(resource.data.uid);
      allow write: if isAdmin();
    }

    match /notices/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /admins/{uid} {
      allow read: if isSignedIn();
      allow write: if false; // set these by hand in the console for now
    }
  }
}
```

To make yourself an admin (so the Admin Dashboard screen loads data),
manually create a document at `admins/{your-uid}` with any field — e.g.
`{ "since": "<today>" }` — via the Firestore console.

## 4. Cloud Storage

Storage → Get started → production mode. Used for complaint photos
(`complaints/{uid}/{timestamp}.jpg`). Rules:

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /complaints/{uid}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid
                   && request.resource.size < 8 * 1024 * 1024;
    }
  }
}
```

## 5. Push notifications (optional, for real device alerts)

Cloud Messaging is set up automatically with the project. To actually send
pushes for complaint status changes or announcements you'll need a small
Cloud Function (or your Python backend, using `firebase-admin`) that calls
FCM's `send()` when a `complaints` doc's `status` changes or a new
`notices` doc is created — that's server-side work beyond this starter.

## 6. Sample data to seed by hand

**`bills/{id}`**
```json
{ "uid": "citizen-uid", "label": "Water bill — June 2026", "icon": "droplets", "amount": 420, "status": "due", "dueDate": "Firestore Timestamp" }
```

**`notices/{id}`**
```json
{ "title": "Water maintenance — Ward 7", "body": "Supply interrupted 10pm-6am on the 14th.", "department": "Water Board", "urgent": false, "publishedAt": "Firestore Timestamp" }
```

## 7. Sync into the native project

```bash
npx cap sync android
```
