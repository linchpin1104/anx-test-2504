import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Removed unused db and auth variables
let firestoreInstance: admin.firestore.Firestore | null = null;
try {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyRaw) {
      console.warn('[firebaseAdmin] Missing Firebase env vars, skipping initialization.');
      console.warn('[firebaseAdmin] Available env vars:', {
        hasProjectId: !!projectId,
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKeyRaw
      });
    } else {
      try {
        // private key 처리 개선
        let privateKey = privateKeyRaw;
        
        // 따옴표 제거
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        }
        
        // 줄바꿈 문자 처리
        if (privateKey.includes('\\n')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
        
        // private key 형식 검증
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || 
            !privateKey.includes('-----END PRIVATE KEY-----')) {
          throw new Error('Invalid private key format');
        }

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        
        firestoreInstance = admin.firestore();
        console.log('[firebaseAdmin] Successfully initialized Firebase Admin');
      } catch (initError) {
        console.error('[firebaseAdmin] Failed to initialize:', initError);
        throw initError;
      }
    }
  } else {
    firestoreInstance = admin.firestore();
  }
} catch (e) {
  console.error('[firebaseAdmin] Initialization error:', e);
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