// Firebase project used to sync the three Servizato apps across phones.
// Paste the config from Firebase console → Project settings → Your apps → Web app.
// The same values go in all three repos (customer, provider, technician).
// Leave apiKey empty to run in "this device only" mode (on-phone storage, no backend).
//
// These web keys are not secret: Firebase identifies the project with them, and
// access is controlled by the Firestore rules in firestore.rules.
export const firebaseConfig = {
  apiKey: 'AIzaSyCYS0BMqnyJKKYJgySxS3XiDxaPPf0JSx8',
  authDomain: 'utku4221.firebaseapp.com',
  projectId: 'utku4221',
  storageBucket: 'utku4221.firebasestorage.app',
  messagingSenderId: '436833160080',
  appId: '1:436833160080:web:86cb909cb1f0b144a28115',
};
