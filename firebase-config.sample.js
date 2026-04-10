/**
 * Math Battler — Firebase web config
 *
 * SETUP (once):
 * 1. https://console.firebase.google.com → Create project (or pick existing)
 * 2. Build → Firestore Database → Create database (start in test mode for dev, then tighten rules)
 * 3. Build → Authentication → Sign-in method → enable "Anonymous"
 * 4. Project settings (gear) → Your apps → Web (</>) → Register app → copy the `firebaseConfig` object
 * 5. Copy this file to `firebase-config.js` and paste your config inside JSON.stringify({ ... })
 * 6. Firestore → Rules — use the rules from the comment at the bottom of this file
 *
 * This file is safe to commit. Do NOT commit firebase-config.js if it contains real keys (use .gitignore).
 */
window.__firebase_config = JSON.stringify({
    apiKey: "PASTE_FROM_FIREBASE_CONSOLE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "PASTE",
    appId: "PASTE_WEB_APP_ID"
});

/*
 * --- Firestore rules (Production: tighten for your school / users) ---
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /artifacts/{appId}/public/data/{document=**} {
 *       allow read, write: if request.auth != null;
 *     }
 *   }
 * }
 *
 * The app uses: artifacts/{appId}/public/data/playerProfiles/... and .../healthcheck/status
 * Default appId in code: math-adventure-global (see __app_id in index.html)
 */
