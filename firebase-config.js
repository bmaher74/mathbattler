/**
 * Cloud saves — must set window.__firebase_config (JSON string). No HTML or import() here.
 * index.html loads this file with a plain <script src>, then initializes Firebase once.
 */
window.__firebase_config = JSON.stringify({
    apiKey: "PASTE_FROM_FIREBASE_CONSOLE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "PASTE",
    appId: "PASTE_WEB_APP_ID"
});

// If `/runtime-config.js` (served by `npm run serve`) already set a real config, keep it.
// This file provides safe placeholders only.
