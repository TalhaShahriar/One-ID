import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let adminApp = null;

export function getFirebaseAdmin() {
  if (!adminApp) {
    let serviceAccount;
    // Check if the service account JSON is passed via environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      } catch (e) {
        console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY is invalid JSON. Falling back to default app.');
      }
    }
    
    // Check for firebase-applet-config.json
    if (!serviceAccount) {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        console.log('Using firebase-applet-config.json for Firebase Admin (default credentials)');
      }
    }

    if (serviceAccount) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Use application default credentials or just initialize app
      // In dev environment with AI Studio, we don't have the private key easily accessible,
      // so if we need to verify tokens we can just initialize without credentials for token verification.
      adminApp = admin.initializeApp();
    }
  }
  return adminApp;
}
