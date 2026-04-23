# pixelKanban


1. 🔥 Firebase Setup (Auth + Database)

Your firebaseConfig.js is already wired to expect config values — you just need to create them.

Step 1: Create Firebase Project
Go to Firebase Console
Click “Add project”
Name it (e.g. Kanban App)
Disable Google Analytics (optional)
Create project
Step 2: Add Web App
Inside project → click </> (Web App)
Register app (name doesn’t matter)
Copy config — looks like this:
const appFirebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
Step 3: Add to Your Project

Create or edit:

js/config.js
const appFirebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

✅ This is exactly what your firebaseConfig.js is checking for.

Step 4: Enable Authentication
Go to Authentication → Sign-in method
Enable:
✅ Google
Step 5: Enable Firestore Database
Go to Firestore Database
Click Create database
Choose:
Start in test mode (for now)
Step 6: (Optional but Recommended) Store Users in Firestore

Right now your app uses localStorage only.

To upgrade:

Inside syncFirebaseUser() in your userManager.js, add:

const db = firebase.firestore();

await db.collection("users").doc(firebaseUser.uid).set({
  name: firebaseUser.displayName,
  email: firebaseUser.email,
  photoURL: firebaseUser.photoURL
}, { merge: true });
What You Now Have
Google login via Firebase ✅
Persistent identity (UID) ✅
Optional cloud user storage ✅
2. 📊 Google Sheets Setup

Your googleSheets.js already handles most logic — you just need credentials.

Step 1: Create Google Cloud Project

Go to:
👉 Google Cloud Console

Step 2: Enable APIs

Enable BOTH:

Google Sheets API
Google Drive API
Step 3: Create Credentials
API Key
Credentials → Create Credentials → API Key
Copy it
OAuth Client ID
Create Credentials → OAuth Client ID
Choose:
Web Application
Add:

Authorized JS origins:

http://localhost
http://127.0.0.1
Copy Client ID
Step 4: Add to Your App

Your code expects:

localStorage.setItem('google_sheets_api_key', 'YOUR_API_KEY');
localStorage.setItem('google_client_id', 'YOUR_CLIENT_ID.apps.googleusercontent.com');

OR put them in your config file and load them.

Step 5: Test It
Click your Google Sheets button
Sign in
Click:
“Create Sheet”
“Save”
“Load”

Your code already handles:

Creating sheets
Writing tasks
Reading them back
Important Note

Your app uses:

Authorization: Bearer ${this.accessToken}

That means:
👉 You are using Google Identity Services (modern) — good.

3. 👤 User Accounts (How Everything Connects)

You actually have two systems working together:

A. Firebase Auth (Identity)

Handled in:

firebaseConfig.js
userManager.js

Flow:

User clicks login
Google popup opens
Firebase returns user
onAuthStateChanged fires
syncFirebaseUser() runs
B. Local User System (Your App)

Stored in:

localStorage: kanban-users

Each user looks like:

{
  id: 1,
  name: "...",
  email: "...",
  role: "Developer",
  firebaseUid: "...",
}
How They Link

Inside your code:

this.getUserByEmail(firebaseUser.email)

So:
👉 Firebase user ↔ local user matched by email

Best Practice Upgrade (Recommended)

Instead of email matching:

Change to:

user.firebaseUid === firebaseUser.uid

This avoids duplicate users if emails change.

C. Google Sheets Users

Your Sheets export includes:

users: users

So:

Users are saved alongside tasks
When loading:
Users are re-added to system
🔄 Full System Overview

Here’s how your stack works together:

Firebase Auth (Google login)
        ↓
UserManager syncs user
        ↓
Stored locally (and optionally Firestore)
        ↓
Tasks created / assigned
        ↓
Saved to Google Sheets
        ↓
Loaded back with users + tasks
⚠️ Common Pitfalls (You WILL hit these)
1. “Firebase not configured”

✔ Fix:

Ensure config.js loads BEFORE firebaseConfig.js
2. Google button not showing

✔ Fix:

Client ID still says "YOUR_CLIENT_ID..."
3. Sheets API 403 error

✔ Fix:

Enable BOTH:
Sheets API
Drive API
4. Popup blocked

✔ Fix:

Use HTTPS or localhost