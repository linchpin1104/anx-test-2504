import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

let firestoreInstance: any = null;
try {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    if (projectId && clientEmail && privateKeyRaw) {
      const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
      firestoreInstance = admin.firestore();
    } else {
      console.warn('[firebaseAdmin] Missing Firebase env vars, skipping initialization.');
    }
  } else {
    firestoreInstance = admin.firestore();
  }
} catch (e) {
  console.warn('[firebaseAdmin] Initialization error:', e);
}

export const firestore = firestoreInstance; 