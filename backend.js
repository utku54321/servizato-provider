// Cloud sync for the three Servizato apps (Firebase Firestore, realtime).
// Same file in all three repos. If firebase-config.js is empty, everything stays
// on this device (browser storage) exactly like the original demo.
//
// Firestore layout:
//   bookings/{bookingId}  - customer bookings (written by the customer app)
//   jobs/{bookingId}      - provider + technician progress (assignment, status, parts, photos)

import { firebaseConfig } from './firebase-config.js';

// Local testing against the Firestore emulator: VITE_FIRESTORE_EMULATOR=localhost:8080
const EMULATOR = import.meta.env?.VITE_FIRESTORE_EMULATOR || '';
const config = EMULATOR && !firebaseConfig.projectId
  ? { apiKey: 'demo-key', projectId: 'demo-servizato', appId: 'demo' }
  : firebaseConfig;

export const enabled = !!(config && config.apiKey && config.projectId);

/** Latest data from the cloud. `null` until the first snapshot arrives. */
export const remote = { jobs: null, bookings: null };
/** 'local' (no backend), 'connecting', 'live', 'offline' or 'error'. */
export const status = { state: enabled ? 'connecting' : 'local', error: '' };

const listeners = new Set();
export function onRemoteChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const emit = () => listeners.forEach((cb) => { try { cb(); } catch { /* ignore */ } });

let fs = null; // firestore module
let db = null;

// Firestore rejects `undefined`; a JSON round trip drops it (all app data is plain JSON).
const clean = (v) => JSON.parse(JSON.stringify(v));

async function start() {
  const [{ initializeApp }, firestore, authMod] = await Promise.all([
    import('firebase/app'), import('firebase/firestore'), import('firebase/auth'),
  ]);
  const app = initializeApp(config);
  fs = firestore;
  try {
    db = firestore.initializeFirestore(app, {
      localCache: firestore.persistentLocalCache({ tabManager: firestore.persistentMultipleTabManager() }),
    });
  } catch {
    db = firestore.getFirestore(app); // private mode / old browser: memory cache only
  }
  if (EMULATOR) {
    const [host, port] = EMULATOR.split(':');
    firestore.connectFirestoreEmulator(db, host, Number(port || 8080));
  } else {
    // Anonymous sign-in so the Firestore rules can require a signed-in app user.
    try { await authMod.signInAnonymously(authMod.getAuth(app)); } catch (e) {
      console.warn('[servizato] anonymous sign-in failed (enable it in Firebase → Authentication):', e?.code || e);
    }
  }

  const watch = (name) => firestore.onSnapshot(
    firestore.collection(db, name),
    { includeMetadataChanges: true },
    (snap) => {
      remote[name] = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
      status.state = snap.metadata.fromCache && !navigator.onLine ? 'offline' : 'live';
      status.error = '';
      emit();
    },
    (err) => {
      status.state = 'error';
      status.error = err?.code === 'permission-denied'
        ? 'Permission denied - check firestore.rules and that Anonymous sign-in is enabled'
        : String(err?.message || err);
      console.error('[servizato] sync error:', err);
      emit();
    },
  );
  watch('jobs');
  watch('bookings');
}

const ready = enabled
  ? start().catch((e) => { status.state = 'error'; status.error = String(e?.message || e); console.error(e); emit(); })
  : Promise.resolve();

async function run(op) {
  await ready;
  if (!db) return;
  try { await op(); } catch (e) {
    console.error('[servizato] write failed:', e);
    status.state = 'error';
    status.error = String(e?.message || e);
    emit();
  }
}

/** Deep-merge a patch into jobs/{id} (maps like `history` merge; arrays are replaced). */
export function saveJob(id, patch) {
  if (remote.jobs) {
    // Optimistic local copy so the UI updates before the server confirms.
    const prev = remote.jobs[id] || {};
    remote.jobs = { ...remote.jobs, [id]: { ...prev, ...patch, history: { ...(prev.history || {}), ...(patch.history || {}) } } };
  }
  return run(() => fs.setDoc(fs.doc(db, 'jobs', id), clean(patch), { merge: true }));
}
export function deleteJob(id) {
  if (remote.jobs) { const { [id]: _, ...rest } = remote.jobs; remote.jobs = rest; }
  return run(() => fs.deleteDoc(fs.doc(db, 'jobs', id)));
}
export function saveBooking(id, data) {
  if (remote.bookings) remote.bookings = { ...remote.bookings, [id]: data };
  return run(() => fs.setDoc(fs.doc(db, 'bookings', id), clean(data)));
}
export function deleteBooking(id) {
  if (remote.bookings) { const { [id]: _, ...rest } = remote.bookings; remote.bookings = rest; }
  return run(() => fs.deleteDoc(fs.doc(db, 'bookings', id)));
}

/** Short label for the UI. */
export function syncLabel() {
  switch (status.state) {
    case 'local': return { tone: 'muted', text: 'This device only - add Firebase config to sync phones' };
    case 'connecting': return { tone: 'muted', text: 'Connecting to Servizato cloud…' };
    case 'live': return { tone: 'ok', text: 'Live sync on - changes reach every phone' };
    case 'offline': return { tone: 'warn', text: 'Offline - changes will sync when you reconnect' };
    default: return { tone: 'error', text: 'Sync error: ' + status.error };
  }
}
