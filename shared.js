// Shared link between the three Servizato apps (customer, provider, technician).
// With Firebase configured (firebase-config.js) the data lives in Firestore and syncs
// live across phones. Without it, the apps fall back to shared browser storage on one
// device (same site: utku54321.github.io), like the original demo.

import * as cloud from './backend.js';

export { syncLabel } from './backend.js';
export const cloudEnabled = cloud.enabled;

export const KEYS = {
  customer: 'servizato-customer-v2', // written by the customer app (bookings, payments, reviews)
  jobs: 'servizato-jobs-v1', // written by the provider + technician apps (assignment, progress)
};

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
};

/**
 * Customer bookings as seen by the provider and technician apps.
 * Cloud mode: every customer's bookings (each carries customerName + address).
 * Local mode: the one customer using this browser.
 */
export function readCustomer() {
  if (cloud.enabled && cloud.remote.bookings) {
    return { name: 'Customer', bookings: Object.values(cloud.remote.bookings) };
  }
  return read(KEYS.customer, null);
}
export const readJobs = () => (cloud.enabled && cloud.remote.jobs ? cloud.remote.jobs : read(KEYS.jobs, {}));

/** Anonymous id for this customer device, so bookings from different phones stay apart. */
function customerId() {
  let id = read('servizato-customer-id', '');
  if (!id) { id = 'c' + Math.random().toString(36).slice(2, 10); write('servizato-customer-id', id); }
  return id;
}

const SYNCED = 'servizato-synced-bookings-v1';
/**
 * Customer app: publish this customer's bookings to the cloud (only the ones that changed).
 * Bookings removed from the store (e.g. "Clear demo data") are deleted from the cloud too.
 */
export function syncBookings(store) {
  if (!cloud.enabled) return;
  const prev = read(SYNCED, {});
  const next = {};
  const cid = customerId();
  (store.bookings || []).forEach((b) => {
    const doc = { ...b, customerId: cid, customerName: store.name, address: b.address || store.address };
    const sig = JSON.stringify(doc);
    next[b.id] = sig.length + ':' + hash(sig);
    if (prev[b.id] !== next[b.id]) cloud.saveBooking(b.id, doc);
  });
  Object.keys(prev).forEach((id) => { if (!next[id]) cloud.deleteBooking(id); });
  write(SYNCED, next);
}
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h.toString(36);
}

/** Merge a patch into the shared record for one job. */
export function patchJob(id, patch) {
  const all = { ...readJobs() };
  const prev = all[id] || {};
  all[id] = {
    ...prev,
    ...patch,
    history: { ...(prev.history || {}), ...(patch.history || {}) },
    updatedAt: new Date().toISOString(),
  };
  if (cloud.enabled) cloud.saveJob(id, { ...patch, updatedAt: all[id].updatedAt });
  else write(KEYS.jobs, all);
  return all[id];
}

/** Remove shared records that match `test(id, record)` (used by "reset demo"). */
export function removeJobs(test) {
  const all = { ...readJobs() };
  Object.keys(all).forEach((id) => {
    if (test(id, all[id])) { delete all[id]; if (cloud.enabled) cloud.deleteJob(id); }
  });
  if (!cloud.enabled) write(KEYS.jobs, all);
}

export function clearSharedJobs() {
  try { localStorage.removeItem(KEYS.jobs); } catch { /* ignore */ }
}

/** Call `cb` whenever another app (tab, window or installed app) changes shared data. */
export function subscribe(cb) {
  const onStorage = (e) => { if (!e.key || e.key === KEYS.customer || e.key === KEYS.jobs) cb(); };
  const onVisible = () => { if (document.visibilityState === 'visible') cb(); };
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', cb);
  document.addEventListener('visibilitychange', onVisible);
  const timer = setInterval(cb, 4000);
  const offRemote = cloud.onRemoteChange(cb);
  return () => {
    offRemote();
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('focus', cb);
    document.removeEventListener('visibilitychange', onVisible);
    clearInterval(timer);
  };
}

export const FLOW = ['confirmed', 'assigned', 'onway', 'started', 'completed', 'paid'];

/** Apply shared progress on top of a booking/job. Status only ever moves forward. */
export function mergeJob(base, u) {
  if (!u) return base;
  const out = { ...base, history: { ...(base.history || {}), ...(u.history || {}) } };
  ['techId', 'tech', 'techAccepted', 'photos', 'workNote', 'returned'].forEach((k) => {
    if (u[k] !== undefined) out[k] = u[k];
  });
  if (u.parts) out.parts = u.parts;
  if (u.payMethod && !base.payMethod) out.payMethod = u.payMethod;
  if (base.status === 'cancelled') return out;
  if (u.status === 'declined' || u.status === 'cancelled') {
    return { ...out, status: 'cancelled', declined: u.status === 'declined' };
  }
  if (FLOW.indexOf(u.status) > FLOW.indexOf(base.status)) out.status = u.status;
  return out;
}

/** Turn a customer-app booking into the job shape the provider and technician apps use. */
export function jobFromBooking(b, customer) {
  return {
    ...b,
    source: 'customer',
    customerName: b.customerName || (customer && customer.name) || 'Customer',
    address: b.address || (customer && customer.address),
  };
}

/** The fields a provider sends along when it assigns a job (so the technician app can show it). */
export const snapshot = (j) => ({
  id: j.id, categoryId: j.categoryId, serviceIds: j.serviceIds, providerId: j.providerId,
  dateIso: j.dateIso, slotStart: j.slotStart, note: j.note || '', otp: j.otp,
  customerName: j.customerName, address: j.address, firstBooking: !!j.firstBooking,
  status: 'confirmed', history: j.history || {}, parts: j.parts || [], createdAt: j.createdAt,
});

/** Technician teams for each sample provider. The first person matches the customer app. */
export const TEAMS = {
  coolcare: [
    { id: 'aman', name: 'Aman Kumar', initials: 'AK', rating: 4.9, jobs: 1240, skills: ['ac', 'appliances'] },
    { id: 'deepak', name: 'Deepak Verma', initials: 'DV', rating: 4.7, jobs: 860, skills: ['ac', 'electrical'] },
    { id: 'salman', name: 'Salman Ali', initials: 'SA', rating: 4.6, jobs: 530, skills: ['appliances', 'electrical'] },
  ],
  airpro: [
    { id: 'rohit', name: 'Rohit Singh', initials: 'RS', rating: 4.8, jobs: 940, skills: ['ac', 'appliances'] },
    { id: 'arjun', name: 'Arjun Mehta', initials: 'AM', rating: 4.6, jobs: 410, skills: ['ac'] },
  ],
  quickfix: [
    { id: 'vikas', name: 'Vikas Yadav', initials: 'VY', rating: 4.5, jobs: 620, skills: ['plumbing', 'electrical', 'carpentry', 'ac'] },
    { id: 'manoj', name: 'Manoj Kumar', initials: 'MK', rating: 4.4, jobs: 380, skills: ['cleaning', 'painting', 'pest', 'appliances'] },
  ],
  frostline: [
    { id: 'sandeep', name: 'Sandeep Rawat', initials: 'SR', rating: 4.7, jobs: 780, skills: ['ac', 'appliances'] },
    { id: 'pankaj', name: 'Pankaj Negi', initials: 'PN', rating: 4.5, jobs: 300, skills: ['appliances'] },
  ],
  sparkle: [
    { id: 'neha', name: 'Neha Sharma', initials: 'NS', rating: 4.9, jobs: 1100, skills: ['cleaning', 'pest'] },
    { id: 'pooja', name: 'Pooja Rani', initials: 'PR', rating: 4.7, jobs: 640, skills: ['cleaning', 'painting'] },
    { id: 'kavita', name: 'Kavita Joshi', initials: 'KJ', rating: 4.6, jobs: 350, skills: ['pest', 'cleaning'] },
  ],
  brightwire: [
    { id: 'imran', name: 'Imran Khan', initials: 'IK', rating: 4.8, jobs: 900, skills: ['electrical', 'plumbing'] },
    { id: 'ravi', name: 'Ravi Prakash', initials: 'RP', rating: 4.5, jobs: 420, skills: ['carpentry', 'plumbing'] },
  ],
};

export function findTech(techId) {
  for (const [providerId, team] of Object.entries(TEAMS)) {
    const t = team.find((x) => x.id === techId);
    if (t) return { ...t, providerId };
  }
  return null;
}

export const techCard = (t) => ({ name: t.name, initials: t.initials, rating: t.rating });

/** Technician payout: 60% of service charges. Parts are passed through at cost. */
export const TECH_SHARE = 0.6;
/** Platform fee charged to the provider on service charges. */
export const PLATFORM_FEE = 0.15;
