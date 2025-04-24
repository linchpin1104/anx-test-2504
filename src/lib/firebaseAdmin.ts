import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Removed unused db and auth variables
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
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
const dummyFirestore = {
  collection: (collectionName: string) => ({
    doc: (docId: string) => ({
      set: async (data: any): Promise<void> => {},
      update: async (data: any): Promise<void> => {},
      get: async () => ({ exists: false, data: () => ({}) }),
      delete: async (): Promise<void> => {},
    }),
  }),
};
/* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

// Export Firestore: real instance or dummy stub
export const firestore: admin.firestore.Firestore =
  firestoreInstance || (dummyFirestore as unknown as admin.firestore.Firestore); 