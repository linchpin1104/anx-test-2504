import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

let firestoreInstance: admin.firestore.Firestore | null = null;
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

// If initialized, use actual Firestore, otherwise stub with no-op methods
const dummyFirestore = {
  collection: (_: string) => ({
    doc: (_id: string) => ({
      set: async (_data: any) => {},
      update: async (_data: any) => {},
      get: async () => ({ exists: false, data: () => ({}) }),
      delete: async () => {},
    }),
  }),
};
export const firestore: any = firestoreInstance || dummyFirestore; 