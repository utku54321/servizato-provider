import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './icons.jsx';
import { getProvider } from './data.js';
import {
  readCustomer, readJobs, patchJob, removeJobs, subscribe, mergeJob, jobFromBooking, snapshot, techCard, TEAMS,
} from './shared.js';
import { sampleJobsFor } from './samples.js';
import {
  DashboardScreen, RequestsScreen, AssignScreen, JobScreen, TeamScreen, ServicesScreen,
  FinanceScreen, ReviewsScreen, MoreScreen,
} from './screens.jsx';

const STORAGE_KEY = 'servizato-provider-v1';
const initialStore = { providerId: 'coolcare', prices: {}, inactive: {}, off: {}, replies: {} };

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? { ...initialStore, ...JSON.parse(raw) } : initialStore;
    return getProvider(saved.providerId) ? saved : initialStore;
  } catch {
    return initialStore;
  }
}

const TABS = ['home', 'requests', 'team', 'finance', 'more'];
const now = () => new Date().toISOString();

export default function App() {
  const [store, setStore] = useState(loadStore);
  const [stack, setStack] = useState([{ name: 'home' }]);
  const [toast, setToast] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* storage unavailable */ }
  }, [store]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  // Re-read shared data whenever the customer or technician app changes something.
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  // Back button support (same pattern as the customer app).
  const depth = useRef(1);
  useEffect(() => { depth.current = stack.length; }, [stack]);
  useEffect(() => {
    const onPop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const nav = useMemo(() => ({
    go: (name, params = {}) => {
      setStack((s) => [...s, { name, ...params }]);
      window.history.pushState({ servizato: true }, '');
      window.scrollTo(0, 0);
    },
    back: () => { if (depth.current > 1) window.history.back(); },
    tab: (name) => setStack([{ name }]),
    replace: (entries) => setStack(entries),
  }), []);

  // Install prompt (Android / desktop Chrome).
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(
    () => !!window.Capacitor?.isNativePlatform?.() || window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const install = {
    installed, canPrompt: !!installPrompt, isIos: /iphone|ipad|ipod/i.test(window.navigator.userAgent),
    prompt: async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice.catch(() => null); setInstallPrompt(null); },
  };

  const provider = getProvider(store.providerId);
  const team = TEAMS[store.providerId] || [];

  // Sample jobs + real bookings from the customer app, with shared progress applied.
  const { jobs, otherRequests } = useMemo(() => {
    const shared = readJobs();
    const customer = readCustomer();
    const bookings = (customer?.bookings || []).map((b) => mergeJob(jobFromBooking(b, customer), shared[b.id]));
    const mine = bookings.filter((b) => b.providerId === store.providerId);
    const others = bookings.filter((b) => b.providerId !== store.providerId && b.status === 'confirmed');
    const samples = sampleJobsFor(store.providerId).map((j) => mergeJob(j, shared[j.id]));
    const sortKey = (j) => j.dateIso + String(j.slotStart).padStart(2, '0');
    return { jobs: [...mine, ...samples].sort((a, b) => sortKey(b).localeCompare(sortKey(a))), otherRequests: others };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.providerId, tick]);

  const actions = {
    assign: (job, techId) => {
      const t = team.find((x) => x.id === techId);
      patchJob(job.id, {
        status: 'assigned', techId, tech: techCard(t), techAccepted: false, returned: false,
        providerId: store.providerId, job: snapshot(job), history: { assigned: now() },
      });
      setTick((x) => x + 1);
      setToast(`Assigned to ${t.name}`);
      nav.replace([{ name: 'requests' }]);
    },
    decline: (job) => {
      patchJob(job.id, { status: 'declined', providerId: store.providerId, job: snapshot(job), history: { declined: now() } });
      setTick((x) => x + 1);
      setToast('Request declined');
    },
    setPrice: (serviceId, price) => setStore((s) => ({ ...s, prices: { ...s.prices, [serviceId]: price } })),
    toggleService: (serviceId) => setStore((s) => ({ ...s, inactive: { ...s.inactive, [serviceId]: !s.inactive[serviceId] } })),
    toggleTech: (techId) => setStore((s) => ({ ...s, off: { ...s.off, [techId]: !s.off[techId] } })),
    reply: (jobId, text) => { setStore((s) => ({ ...s, replies: { ...s.replies, [jobId]: text } })); setToast('Reply posted'); },
    switchProvider: (providerId) => { setStore((s) => ({ ...s, providerId })); setToast('Switched to ' + getProvider(providerId).name); nav.tab('home'); },
    reset: () => {
      removeJobs((id, r) => r.providerId === store.providerId);
      setStore((s) => ({ ...initialStore, providerId: s.providerId }));
      setTick((x) => x + 1);
      setToast('Demo data reset');
      nav.tab('home');
    },
  };

  const current = stack[stack.length - 1];
  const job = current.id ? jobs.find((j) => j.id === current.id) : null;
  const requests = jobs.filter((j) => j.status === 'confirmed');
  const props = { store, provider, team, jobs, requests, otherRequests, job, nav, actions, install, notify: setToast };

  let screen;
  if (['assign', 'job'].includes(current.name) && !job) screen = <DashboardScreen {...props} />;
  else {
    switch (current.name) {
      case 'requests': screen = <RequestsScreen {...props} />; break;
      case 'assign': screen = <AssignScreen {...props} />; break;
      case 'job': screen = <JobScreen {...props} />; break;
      case 'team': screen = <TeamScreen {...props} />; break;
      case 'services': screen = <ServicesScreen {...props} />; break;
      case 'finance': screen = <FinanceScreen {...props} />; break;
      case 'reviews': screen = <ReviewsScreen {...props} />; break;
      case 'more': screen = <MoreScreen {...props} />; break;
      default: screen = <DashboardScreen {...props} />;
    }
  }

  return (
    <div className="app">
      <main className="app-main" key={stack.length + current.name}>{screen}</main>
      {TABS.includes(current.name) && (
        <nav className="tabbar" aria-label="Main">
          {[
            { id: 'home', label: 'Home', icon: 'home' },
            { id: 'requests', label: 'Requests', icon: 'inbox', badge: requests.length },
            { id: 'team', label: 'Team', icon: 'users' },
            { id: 'finance', label: 'Finance', icon: 'chart' },
            { id: 'more', label: 'More', icon: 'grid' },
          ].map((t) => (
            <button key={t.id} type="button" className={'tab' + (current.name === t.id ? ' is-active' : '')}
              aria-current={current.name === t.id ? 'page' : undefined} onClick={() => nav.tab(t.id)}>
              <Icon name={t.icon} />{t.label}
              {t.badge > 0 && <span className="tab-badge" aria-label={t.badge + ' new'}>{t.badge}</span>}
            </button>
          ))}
        </nav>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
