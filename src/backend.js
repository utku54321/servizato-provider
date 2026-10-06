// Cloud sync for the three Servizato apps (Firebase Firestore, realtime).
// Same file in all three repos. If firebase-config.js is empty, everything stays
// on this phone (on-device storage) like the original demo.
//
// Firestore layout:
//   bookings/{bookingId}  - customer bookings (written by the customer app)
//   jobs/{bookingId}      - provider + technician progress (assignment, status, parts, photos)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import * as firestore from 'firebase/firestore';
import * as authMod from 'firebase/auth';
import { firebaseConfig as config } from './firebase-config.js';

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

let db = null;

// Firestore rejects `undefined`; a JSON round trip drops it (all app data is plain JSON).
const clean = (v) => JSON.parse(JSON.stringify(v));

async function start() {
  const app = initializeApp(config);
  // Long polling is the reliable transport inside React Native.
  db = firestore.initializeFirestore(app, { experimentalForceLongPolling: true });

  // Anonymous sign-in so the Firestore rules can require a signed-in app user.
  try {
    let auth;
    try {
      auth = authMod.initializeAuth(app, { persistence: authMod.getReactNativePersistence(AsyncStorage) });
    } catch {
      auth = authMod.getAuth(app);
    }
    await authMod.signInAnonymously(auth);
  } catch (e) {
    console.warn('[servizato] anonymous sign-in failed (enable it in Firebase → Authentication):', e?.code || e);
  }

  const watch = (name) => firestore.onSnapshot(
    firestore.collection(db, name),
    { includeMetadataChanges: true },
    (snap) => {
      remote[name] = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
      if (!snap.metadata.fromCache) status.state = 'live';
      else if (status.state === 'live') status.state = 'offline';
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
  return run(() => firestore.setDoc(firestore.doc(db, 'jobs', id), clean(patch), { merge: true }));
}
export function deleteJob(id) {
  if (remote.jobs) { const { [id]: _, ...rest } = remote.jobs; remote.jobs = rest; }
  return run(() => firestore.deleteDoc(firestore.doc(db, 'jobs', id)));
}
export function saveBooking(id, data) {
  if (remote.bookings) remote.bookings = { ...remote.bookings, [id]: data };
  return run(() => firestore.setDoc(firestore.doc(db, 'bookings', id), clean(data)));
}
export function deleteBooking(id) {
  if (remote.bookings) { const { [id]: _, ...rest } = remote.bookings; remote.bookings = rest; }
  return run(() => firestore.deleteDoc(firestore.doc(db, 'bookings', id)));
}

/** Short label for the UI. */
export function syncLabel() {
  switch (status.state) {
    case 'local': return { tone: 'muted', text: 'This phone only - add Firebase config to sync phones' };
    case 'connecting': return { tone: 'muted', text: 'Connecting to Servizato cloud…' };
    case 'live': return { tone: 'ok', text: 'Live sync on - changes reach every phone' };
    case 'offline': return { tone: 'warn', text: 'Offline - changes will sync when you reconnect' };
    default: return { tone: 'error', text: 'Sync error: ' + status.error };
  }
}
