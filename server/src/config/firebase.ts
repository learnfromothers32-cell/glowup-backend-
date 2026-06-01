import admin from 'firebase-admin';
import { appConfig } from './app';

const initializeFirebase = () => {
  if (admin.apps.length > 0) return;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized (service account)');
  } else {
    // Dev fallback: init with project ID so verifyIdToken works
    // using Firebase's public key endpoints
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'startup-16d5b';
    admin.initializeApp({ projectId });
    console.log('Firebase Admin initialized (dev mode - project ID only)');
  }
};

export { admin, initializeFirebase };
