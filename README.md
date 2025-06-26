# AuthApp

A React Native Expo application that implements persistent email/password authentication with Firebase and user profiles stored in Cloud Firestore. Provides a Login/Signup flow, password reset, and account settings screens.

## Prerequisites

* Node.js (v14 or newer)
* npm or Yarn
* Expo CLI (available via `npx expo`)
* A Firebase account

## Installation

1. **Clone the repository**

   ```bash
   git clone <YOUR_REPO_URL>
   cd AuthApp
   ```

2. **Install dependencies**

   ```bash
   npm install
   # Install Expo native modules
   npx expo install expo-constants @react-native-async-storage/async-storage
   ```

3. **Configure Firebase**

   1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
   2. Under **Authentication → Sign-in method**, enable **Email/Password**.
   3. Under **Firestore Database**, click **Create database**, choose a location, and start in **Test mode** or **Production mode**.
   4. In **Firestore → Rules**, use:

      ```js
      service cloud.firestore {
        match /databases/{database}/documents {
          match /users/{userId} {
            allow create: if request.auth != null && request.auth.uid == userId;
            allow read, update, delete: if request.auth != null && request.auth.uid == userId;
          }
        }
      }
      ```
   5. Under **Project Settings → Your apps**, register a **Web** app and copy the Firebase config.

4. **Create `.env` file**
   In the project root, create `.env` and add your Firebase config values:

   ```env
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

   > Ensure `.env` is in `.gitignore` to keep your keys private.

5. **Update `app.config.js`**
   Make sure `app.config.js` reads from `process.env` and exposes them via `expo-constants`:

   ```js
   import 'dotenv/config';
   export default {
     expo: {
       name: 'AuthApp',
       slug: 'AuthApp',
       extra: {
         firebaseApiKey: process.env.FIREBASE_API_KEY,
         firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
         firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
         firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
         firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
         firebaseAppId: process.env.FIREBASE_APP_ID,
       },
     },
   };
   ```

6. **Run the app**

   ```bash
   npx expo start
   ```

   * Press `a` for Android
   * Press `i` for iOS
   * Press `w` for Web

## Project Structure

```
AuthApp/
├── src/
│   ├── firebase/
│   │   └── config.ts             # Firebase initialization (Auth & Firestore)
│   └── screens/
│       ├── LandingScreen.tsx     # Welcome with Login/Create
│       ├── LoginScreen.tsx       # Email/Password login
│       ├── SignupScreen.tsx      # Email/Password signup
│       ├── ResetPasswordScreen.tsx # Password reset flow
│       ├── AccountSettingsScreen.tsx # Edit profile, change email/password
│       └── HomeScreen.tsx        # Authenticated home
├── App.tsx                       # Root entrypoint
├── app.config.js                 # Expo config loading .env
├── .env                          # Firebase keys (ignored)
├── package.json
└── README.md
```

## Environment Variables

Exposed via Expo Constants in code (`Constants.expoConfig.extra`):

* `firebaseApiKey`
* `firebaseAuthDomain`
* `firebaseProjectId`
* `firebaseStorageBucket`
* `firebaseMessagingSenderId`
* `firebaseAppId`


## GoCardless Backend Integration

## Overview
This backend is a Node.js/Express server that integrates with the GoCardless API to enable Direct Debit flows. It also links with Firebase Firestore to store mandate and customer data. The backend exposes REST API endpoints for use by a frontend (web or mobile) application.

---

## Features
- Start a GoCardless Direct Debit redirect flow
- Confirm the redirect flow after user completes the GoCardless form
- Create payments using a GoCardless mandate
- Store mandate and customer data in Firebase Firestore
- CORS enabled for easy frontend integration
- Extensive logging for debugging

---

## Architecture
- **Express.js**: HTTP server and routing
- **GoCardless SDK**: Handles all GoCardless API calls
- **Firebase Admin SDK**: Stores mandate/customer data in Firestore
- **CORS**: Allows requests from any frontend

---

## Environment Setup

### Prerequisites
- Node.js and npm installed
- A GoCardless sandbox account ([sign up here](https://manage-sandbox.gocardless.com/signup))
- A Firebase project (for Firestore)
- (Optional) Service account key for Firebase (for local dev)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd GoCardAuthTest/backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
GOCARDLESS_ACCESS_TOKEN=your_sandbox_access_token_here
GOCARDLESS_ENVIRONMENT=sandbox
BASE_URL=http://localhost:3000
```
- **Never commit your `.env` file to GitHub!**

### 4. Firebase Admin Setup
- For local development, download your Firebase service account key and place it in the backend directory as `serviceAccountKey.json`.
- Update the Firebase Admin initialization in `index.js` if needed:
  ```js
  admin.initializeApp({
    credential: admin.credential.cert(require('./serviceAccountKey.json')),
  });
  ```

---

## Running the Backend

```bash
node index.js
```
You should see logs indicating the server and GoCardless client are initialized.

---

## API Endpoints

### 1. **Start Redirect Flow**
`POST /api/start-redirect-flow`

**Request Body:**
```json
{
  "name": "Test User",
  "email": "test@example.com"
}
```

**Response:**
```json
{
  "redirect_url": "https://pay-sandbox.gocardless.com/billing/static/flow?id=...",
  "redirect_flow_id": "RE...",
  "session_token": "abc123..."
}
```

---

### 2. **Confirm Redirect Flow**
`POST /api/confirm-redirect-flow`

**Request Body:**
```json
{
  "redirect_flow_id": "RE...",
  "session_token": "abc123..."
}
```

**Response:**
```json
{
  "mandate_id": "MD...",
  "customer_id": "CU..."
}
```
- This also saves the mandate and customer to Firestore in the `gocardlessMandates` collection.

---

### 3. **Create Payment**
`POST /api/create-payment`

**Request Body:**
```json
{
  "amount": 1000, // Amount in pence/cents (e.g., 1000 = £10.00)
  "currency": "GBP",
  "mandate_id": "MD..."
}
```

**Response:**
GoCardless payment object (see [API docs](https://developer.gocardless.com/api-reference/#payments-create-a-payment)).

---

## Firestore Data Structure
- Collection: `gocardlessMandates`
- Each document contains:
  - `mandate_id`: GoCardless mandate ID
  - `customer_id`: GoCardless customer ID
  - `createdAt`: Timestamp

---

## How to Test
- Use [Postman](https://www.postman.com/) or cURL to test endpoints.
- Example cURL for starting a redirect flow:
  ```bash
  curl -X POST http://localhost:3000/api/start-redirect-flow \
    -H "Content-Type: application/json" \
    -d '{"name":"Test User","email":"test@example.com"}'
  ```
- Open the `redirect_url` in your browser and complete the GoCardless form with [test bank details](https://developer.gocardless.com/getting-started/sandbox/).
- Use the returned `redirect_flow_id` and `session_token` to confirm the flow.

---

## Troubleshooting
- **CORS errors:** Ensure your backend is running and accessible from your frontend.
- **GoCardless errors:** Check your access token, environment, and request structure.
- **Firebase errors:** Ensure your service account key is correct and Firestore is enabled.
- **npm install errors:** Make sure you are using the correct package (`gocardless-pro` or the latest from GitHub if needed).
- **"Data sent to this endpoint must be wrapped in a 'data' envelope"**: Make sure you are using the official GoCardless SDK and wrapping `session_token` in `{ data: { session_token } }` for `.complete()`.

---

## Extending for Frontend Developers
- The backend is CORS-enabled and ready for frontend integration.
- You can use the provided endpoints with custom React hooks (see `useGoCardless` example in previous messages).
- All endpoints expect and return JSON.
- For mobile apps, use the device's IP address for `API_BASE` if testing on a real device.

---

## Security Notes
- Never commit your `.env` or service account key to version control.
- Use HTTPS and authentication in production.
- Rotate your GoCardless access token regularly.

---

## Resources
- [GoCardless API Reference](https://developer.gocardless.com/api-reference/)
- [GoCardless Sandbox Testing](https://developer.gocardless.com/getting-started/sandbox/)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Express.js Docs](https://expressjs.com/)

---

## Contact
For questions or contributions, please open an issue or pull request on this repository.
