// Firebase project used to sync the three Servizato apps across phones.
// Paste the config from Firebase console → Project settings → Your apps → Web app.
// The same values go in all three repos (customer, provider, technician).
// Leave apiKey empty to run in "this device only" mode (browser storage, no backend).
//
// These web keys are not secret: Firebase identifies the project with them, and
// access is controlled by the Firestore rules in firestore.rules.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};
