import { useState } from 'react';
import { Icon } from './icons.jsx';
import {
  slots, providers, services, getCategory, getService, priceFor, money, billFor,
} from './data.js';
import { TECH_SHARE, PLATFORM_FEE } from './shared.js';

/* ---------- helpers ---------- */

const slotLabel = (start) => (slots.find((x) => x.start === start) || {}).label || '';
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayIso = () => isoOf(new Date());
const dayLabel = (iso) => {
  if (iso === todayIso()) return 'Today';
  const t = new Date(); t.setDate(t.getDate() + 1);
  if (iso === isoOf(t)) return 'Tomorrow';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};
const timeOf = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '');
const serviceNames = (j) => j.serviceIds.map((id) => getService(j.categoryId, id)?.name).filter(Boolean).join(', ');
const initials = (name) => name.split(' ').map((w) => w[0]).join('').slice(0, 2);
const ACTIVE = ['assigned', 'onway', 'started', 'completed'];
const revenueOf = (j) => { const b = billFor(j); return b.serviceTotal + b.partsTotal - b.discount; };
const lastDays = (n) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return isoOf(d); });
const PAY = { upi: 'UPI', card: 'Card', netbanking: 'Net banking', cash: 'Cash' };

function statusOf(j) {
  if (j.status === 'confirmed') return { label: j.returned ? 'Returned by technician' : 'New request', cls: 'warm' };
  if (j.status === 'assigned') return j.techAccepted ? { label: 'Technician accepted', cls: 'blue' } : { label: 'Waiting for technician', cls: 'warm' };
  return ({
    onway: { label: 'On the way', cls: 'blue' }, started: { label: 'In progress', cls: 'blue' },
    completed: { label: 'Awaiting payment', cls: 'warm' }, paid: { label: 'Paid', cls: 'good' },
    cancelled: { label: j.declined ? 'Declined' : 'Cancelled by customer', cls: 'bad' },
  })[j.status] || { label: j.status, cls: '' };
}

function TopBar({ title, sub, onBack, right }) {
  return (
    <header className="topbar">
      {onBack && <button type="button" className="icon-btn" aria-label="Back" onClick={onBack}><Icon name="back" size={20} /></button>}
      <div className="topbar-text"><h1 className="topbar-title">{title}</h1>{sub && <p className="topbar-sub">{sub}</p>}</div>
      {right}
    </header>
  );
}

const SourceBadge = ({ job }) => (job.source === 'customer' ? <span className="src-badge"><Icon name="mobile" size={12} />Customer app</span> : null);

function JobRow({ job, onOpen }) {
  const cat = getCategory(job.categoryId);
  const st = statusOf(job);
  return (
    <button type="button" className="card job-card" onClick={onOpen}>
      <div className="row-between">
        <span className="job-time">{dayLabel(job.dateIso)} · {slotLabel(job.slotStart)}</span>
        <span className={'badge ' + st.cls}>{st.label}</span>
      </div>
      <div className="row">
        <span className="cat-icon sm"><Icon name={cat.icon} size={18} /></span>
        <div className="grow stack-xs">
          <strong className="card-title">{serviceNames(job)}</strong>
          <span className="muted">{job.customerName}{job.tech ? ' · ' + job.tech.name : ''}</span>
        </div>
        <strong>{money(billFor(job).estimate)}</strong>
      </div>
      {job.source === 'customer' && <div className="badges"><SourceBadge job={job} /></div>}
    </button>
  );
}

function OtherProvidersBanner({ otherRequests, actions }) {
  if (!otherRequests.length) return null;
  const p = providers.find((x) => x.id === otherRequests[0].providerId);
  return (
    <div className="banner">
      <Icon name="inbox" size={18} />
      <span className="grow">{otherRequests.length} new {otherRequests.length === 1 ? 'request' : 'requests'} from the customer app for {p.name}</span>
      <button type="button" className="btn btn-outline" onClick={() => actions.switchProvider(p.id)}>Switch</button>
    </div>
  );
}

/* ---------- Dashboard ---------- */

export function DashboardScreen({ provider, jobs, requests, otherRequests, team, store, nav, actions }) {
  const today = todayIso();
  const todayJobs = jobs.filter((j) => j.dateIso === today && j.status !== 'cancelled');
  const revenueToday = jobs.filter((j) => j.status === 'paid' && j.dateIso === today).reduce((a, j) => a + revenueOf(j), 0);
  const week = lastDays(7);
  const revenueWeek = jobs.filter((j) => j.status === 'paid' && week.includes(j.dateIso)).reduce((a, j) => a + revenueOf(j), 0);
  const active = jobs.filter((j) => ACTIVE.includes(j.status));
  const reviews = jobs.filter((j) => j.review);
  const avg = reviews.length ? reviews.reduce((a, j) => a + j.review.rating, 0) / reviews.length : provider.rating;
  const available = team.filter((t) => !store.off[t.id] && !active.some((j) => j.techId === t.id && j.status !== 'completed')).length;

  return (
    <div className="screen">
      <header className="page-head">
        <div className="row-between">
          <div className="stack-xs">
            <p className="muted-label">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="page-title">{provider.name}</h1>
          </div>
          <span className="avatar sq">{provider.initials}</span>
        </div>
      </header>
      <div className="content">
        <OtherProvidersBanner otherRequests={otherRequests} actions={actions} />

        <div className="stat-grid">
          <div className="stat dark"><small>Revenue today</small><strong>{money(revenueToday)}</strong><span className="sub">{money(revenueWeek)} this week</span></div>
          <div className="stat"><small>Jobs today</small><strong>{todayJobs.length}</strong><span className="sub">{active.length} in progress</span></div>
          <button type="button" className="stat" onClick={() => nav.tab('requests')}><small>New requests</small><strong>{requests.length}</strong><span className="sub">{requests.length ? 'Assign now →' : 'All caught up'}</span></button>
          <button type="button" className="stat" onClick={() => nav.go('reviews')}><small>Rating</small><strong className="row" style={{ gap: 6 }}>{avg.toFixed(1)} <Icon name="star" filled size={18} className="star-on" /></strong><span className="sub">{reviews.length} reviews →</span></button>
        </div>

        <section className="stack-sm">
          <div className="row-between">
            <h2 className="section-title sm">New requests</h2>
            {requests.length > 2 && <button type="button" className="btn btn-ghost" onClick={() => nav.tab('requests')}>View all</button>}
          </div>
          {requests.length === 0 && <p className="empty-note">No new requests. Bookings from the customer app appear here.</p>}
          {requests.slice(0, 2).map((j) => <JobRow key={j.id} job={j} onOpen={() => nav.go('assign', { id: j.id })} />)}
        </section>

        <section className="stack-sm">
          <h2 className="section-title sm">Active jobs ({active.length})</h2>
          {active.length === 0 && <p className="empty-note">No jobs in progress.</p>}
          {active.map((j) => <JobRow key={j.id} job={j} onOpen={() => nav.go('job', { id: j.id })} />)}
        </section>

        <div className="list-group">
          <button type="button" className="list-link" onClick={() => nav.tab('team')}><Icon name="users" className="accent" /><span className="grow">Technicians<small>{available} of {team.length} available now</small></span><Icon name="chevronRight" size={18} /></button>
          <button type="button" className="list-link" onClick={() => nav.go('services')}><Icon name="tag" className="accent" /><span className="grow">Services and pricing<small>{provider.categories.length} categories</small></span><Icon name="chevronRight" size={18} /></button>
          <button type="button" className="list-link" onClick={() => nav.tab('finance')}><Icon name="chart" className="accent" /><span className="grow">Finance<small>Revenue, payouts and settlements</small></span><Icon name="chevronRight" size={18} /></button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Incoming requests ---------- */

export function RequestsScreen({ requests, jobs, otherRequests, nav, actions }) {
  const [declining, setDeclining] = useState(null);
  const waiting = jobs.filter((j) => j.status === 'assigned' && !j.techAccepted);

  return (
    <div className="screen">
      <header className="page-head"><h1 className="page-title">Incoming requests</h1></header>
      <div className="content">
        <OtherProvidersBanner otherRequests={otherRequests} actions={actions} />
        {requests.length === 0 && (
          <div className="empty">
            <Icon name="inbox" size={32} />
            <p><strong>No new requests</strong></p>
            <p className="muted">Book a service in the customer app and it shows up here.</p>
          </div>
        )}
        {requests.map((j) => {
          const bill = billFor(j);
          return (
            <article key={j.id} className={'card stack-sm' + (j.source === 'customer' ? ' is-on' : '')}>
              <div className="row-between">
                <span className="job-time">{dayLabel(j.dateIso)} · {slotLabel(j.slotStart)}</span>
                {j.source === 'customer' ? <SourceBadge job={j} /> : <span className="faint">#{j.id}</span>}
              </div>
              <div className="row">
                <span className="cat-icon sm"><Icon name={getCategory(j.categoryId).icon} size={18} /></span>
                <div className="grow stack-xs"><strong className="card-title">{serviceNames(j)}</strong><span className="muted">{j.customerName} · {j.address?.line}</span></div>
              </div>
              {j.note && <p className="card-desc">“{j.note}”</p>}
              {j.returned && <p className="note danger"><Icon name="info" size={18} />The technician declined. Assign someone else.</p>}
              <div className="bill-row"><span>Estimate (before GST)</span><span>{money(bill.estimate)}</span></div>
              {declining === j.id ? (
                <div className="confirm-box">
                  <p>Decline this request? {j.source === 'customer' ? 'The customer is told it was declined.' : ''}</p>
                  <div className="row-gap">
                    <button type="button" className="btn btn-outline" onClick={() => setDeclining(null)}>Keep</button>
                    <button type="button" className="btn btn-danger" onClick={() => { actions.decline(j); setDeclining(null); }}>Decline</button>
                  </div>
                </div>
              ) : (
                <div className="row-gap">
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeclining(j.id)}>Decline</button>
                  <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={() => nav.go('assign', { id: j.id })}>Accept and assign</button>
                </div>
              )}
            </article>
          );
        })}

        {waiting.length > 0 && (
          <section className="stack-sm">
            <h2 className="section-title sm">Waiting for technician to accept</h2>
            {waiting.map((j) => <JobRow key={j.id} job={j} onOpen={() => nav.go('job', { id: j.id })} />)}
          </section>
        )}
      </div>
    </div>
  );
}

/* ---------- Assign a technician ---------- */

export function AssignScreen({ job, team, jobs, store, nav, actions }) {
  const busyCount = (t) => jobs.filter((j) => j.techId === t.id && ['assigned', 'onway', 'started'].includes(j.status)).length;
  const sorted = [...team].sort((a, b) => Number(b.skills.includes(job.categoryId)) - Number(a.skills.includes(job.categoryId)));
  const firstOk = sorted.find((t) => !store.off[t.id]);
  const [pick, setPick] = useState(firstOk?.id || null);
  const bill = billFor(job);
  const chosen = team.find((t) => t.id === pick);

  return (
    <div className="screen">
      <TopBar title="Assign a technician" sub={serviceNames(job) + ' · ' + job.customerName} onBack={nav.back} />
      <div className="content">
        <section className="card stack-sm">
          <div className="row-between"><span className="job-time">{dayLabel(job.dateIso)} · {slotLabel(job.slotStart)}</span><SourceBadge job={job} /></div>
          <div className="row"><Icon name="pin" className="accent" /><span className="muted grow">{job.address?.line}</span></div>
          <div className="bill-row"><span>Estimate</span><span>{money(bill.estimate)}</span></div>
          <div className="bill-row"><span>Technician payout (60%)</span><span>{money(Math.round(bill.serviceTotal * TECH_SHARE))}</span></div>
        </section>

        <fieldset className="stack-sm methods">
          <legend className="section-title sm">Your technicians</legend>
          {sorted.map((t) => {
            const off = !!store.off[t.id];
            const busy = busyCount(t);
            const match = t.skills.includes(job.categoryId);
            return (
              <label key={t.id} className={'method' + (pick === t.id ? ' is-on' : '')} style={off ? { opacity: 0.55 } : undefined}>
                <input type="radio" name="tech" value={t.id} disabled={off} checked={pick === t.id} onChange={() => setPick(t.id)} />
                <span className="avatar round">{t.initials}</span>
                <span className="grow stack-xs">
                  <strong>{t.name}</strong>
                  <span className="meta-row">
                    <span className="rating"><Icon name="star" filled size={13} className="star-on" />{t.rating.toFixed(1)}</span>
                    <span>{off ? 'Off duty' : busy ? `${busy} job${busy > 1 ? 's' : ''} today` : 'Available'}</span>
                    {match && <span className="good-text">Skill match</span>}
                  </span>
                </span>
                <span className="radio" aria-hidden="true" />
              </label>
            );
          })}
        </fieldset>
        <p className="note"><Icon name="info" size={18} />The technician gets the job in the Technician app and accepts it there. Sign in there as the same person to try it.</p>
      </div>
      <footer className="bottombar">
        <button type="button" className="btn btn-primary btn-lg" disabled={!chosen} onClick={() => actions.assign(job, pick)}>
          {chosen ? `Assign to ${chosen.name}` : 'No technician available'}
        </button>
      </footer>
    </div>
  );
}

/* ---------- Job details ---------- */

export function JobScreen({ job, nav, store }) {
  const bill = billFor(job);
  const st = statusOf(job);
  const steps = [
    ['confirmed', 'Booked'], ['assigned', 'Technician assigned'], ['accepted', 'Technician accepted'],
    ['onway', 'On the way'], ['started', 'Started with OTP'], ['completed', 'Completed'], ['paid', 'Paid'],
  ];
  return (
    <div className="screen">
      <TopBar title={'Job #' + job.id} sub={`${getCategory(job.categoryId).name} · ${dayLabel(job.dateIso)}, ${slotLabel(job.slotStart)}`} onBack={nav.back} />
      <div className="content">
        <div className="row-between"><span className={'badge ' + st.cls}>{st.label}</span><SourceBadge job={job} /></div>

        <section className="card row">
          <span className="avatar round">{initials(job.customerName)}</span>
          <div className="grow stack-xs"><strong>{job.customerName}</strong><span className="muted">{job.address?.line}</span></div>
        </section>

        {job.tech && (
          <section className="card row">
            <span className="avatar round">{job.tech.initials}</span>
            <div className="grow stack-xs"><strong>{job.tech.name}</strong><span className="meta"><Icon name="star" filled size={13} className="star-on" />{job.tech.rating.toFixed(1)} · Technician</span></div>
          </section>
        )}

        <section className="card">
          <h2 className="section-title sm">Progress</h2>
          <ol className="timeline">
            {steps.map(([k, label]) => {
              const at = job.history?.[k];
              return (
                <li key={k} className={'tl-item ' + (at ? 'done' : 'todo')}>
                  <span className="tl-dot">{at && <Icon name="check" size={12} />}</span>
                  <div className="grow"><strong>{label}</strong></div>
                  <span className="tl-time">{timeOf(at)}</span>
                </li>
              );
            })}
          </ol>
        </section>

        {job.photos?.length > 0 && (
          <section className="stack-sm">
            <h2 className="section-title sm">Proof of work</h2>
            <div className="proof-grid">{job.photos.map((p) => <div key={p.label} className="proof"><img src={p.src} alt={p.label} /></div>)}</div>
          </section>
        )}

        <section className="card stack-sm">
          <h2 className="section-title sm">Bill</h2>
          {bill.lines.map((l) => <div key={l.name} className="bill-row"><span>{l.name}</span><span>{money(l.amount)}</span></div>)}
          {bill.parts.map((p, i) => <div key={i} className="bill-row"><span>{p.name}</span><span>{money(p.price)}</span></div>)}
          {bill.discount > 0 && <div className="bill-row"><span>First booking offer</span><span className="good-text">−{money(bill.discount)}</span></div>}
          <div className="bill-row"><span>GST (18%)</span><span>{money(bill.gst)}</span></div>
          <hr />
          <div className="bill-row total"><span>{job.status === 'paid' ? 'Paid' : 'Total'}</span><span>{money(bill.total)}</span></div>
          {job.payMethod && <p className="meta"><Icon name="wallet" size={14} />Paid via {PAY[job.payMethod] || job.payMethod}</p>}
        </section>

        {job.review && (
          <section className="card stack-sm">
            <h2 className="section-title sm">Customer review</h2>
            <span className="rating"><Icon name="star" filled size={16} className="star-on" />{job.review.rating} of 5</span>
            {job.review.comment && <p className="card-desc">“{job.review.comment}”</p>}
            {store.replies[job.id] && <p className="reply"><strong>Your reply:</strong> {store.replies[job.id]}</p>}
          </section>
        )}
      </div>
    </div>
  );
}

/* ---------- Technicians ---------- */

export function TeamScreen({ team, jobs, store, provider, nav, actions }) {
  const today = todayIso();
  return (
    <div className="screen">
      <header className="page-head"><h1 className="page-title">Technicians</h1><p className="muted">{provider.name} · {team.length} people</p></header>
      <div className="content">
        {team.map((t) => {
          const mine = jobs.filter((j) => j.techId === t.id);
          const activeJob = mine.find((j) => ['onway', 'started'].includes(j.status)) || mine.find((j) => j.status === 'assigned');
          const doneToday = mine.filter((j) => ['completed', 'paid'].includes(j.status) && j.dateIso === today).length;
          const earned = mine.filter((j) => j.status === 'paid' && lastDays(7).includes(j.dateIso)).reduce((a, j) => a + Math.round(billFor(j).serviceTotal * TECH_SHARE), 0);
          const off = !!store.off[t.id];
          const state = off ? ['grey', 'Off duty'] : activeJob ? ['amber', activeJob.status === 'assigned' ? 'Job assigned' : 'On a job'] : ['green', 'Available'];
          return (
            <article key={t.id} className="card stack-sm">
              <div className="row">
                <span className="avatar round">{t.initials}</span>
                <div className="grow stack-xs">
                  <strong className="card-title">{t.name}</strong>
                  <span className="meta-row"><span className="rating"><Icon name="star" filled size={13} className="star-on" />{t.rating.toFixed(1)}</span><span>{t.jobs.toLocaleString('en-IN')} jobs</span></span>
                </div>
                <button type="button" className={'switch' + (off ? '' : ' is-on')} role="switch" aria-checked={!off} aria-label={`${t.name} on duty`} onClick={() => actions.toggleTech(t.id)} />
              </div>
              <div className="row-between">
                <span className="status-chip"><span className={'dot ' + state[0]} />{state[1]}</span>
                <span className="muted">{doneToday} done today · {money(earned)} this week</span>
              </div>
              <div className="badges">{t.skills.map((s) => <span key={s} className="badge">{getCategory(s)?.name}</span>)}</div>
              {activeJob && (
                <button type="button" className="result-row" onClick={() => nav.go('job', { id: activeJob.id })}>
                  <span className="grow"><strong>{serviceNames(activeJob)}</strong><small>{activeJob.customerName} · {slotLabel(activeJob.slotStart)}</small></span>
                  <Icon name="chevronRight" size={18} />
                </button>
              )}
            </article>
          );
        })}
        <p className="note"><Icon name="info" size={18} />Turn someone off duty and they can't be assigned new jobs. Each technician can sign in to the Technician app to accept jobs.</p>
      </div>
    </div>
  );
}

/* ---------- Services and pricing ---------- */

export function ServicesScreen({ provider, store, nav, actions }) {
  const [cat, setCat] = useState(provider.categories[0]);
  const list = services[cat] || [];
  return (
    <div className="screen">
      <TopBar title="Services and pricing" sub={provider.name} onBack={nav.back} />
      <div className="chip-row" role="group" aria-label="Category">
        {provider.categories.map((c) => (
          <button key={c} type="button" aria-pressed={cat === c} className={'chip' + (cat === c ? ' is-on' : '')} onClick={() => setCat(c)}>{getCategory(c).name}</button>
        ))}
      </div>
      <div className="content">
        {list.map((s) => {
          const def = priceFor(s, provider);
          const price = store.prices[s.id] ?? def;
          const off = !!store.inactive[s.id];
          return (
            <article key={s.id} className="card stack-sm" style={off ? { opacity: 0.6 } : undefined}>
              <div className="row">
                <div className="grow stack-xs"><strong className="card-title">{s.name}</strong><span className="meta"><Icon name="clock" size={14} />{s.time}</span></div>
                <button type="button" className={'switch' + (off ? '' : ' is-on')} role="switch" aria-checked={!off} aria-label={`Offer ${s.name}`} onClick={() => actions.toggleService(s.id)} />
              </div>
              <div className="row-between">
                <span className="muted">{off ? 'Hidden from customers' : `Market average ${money(priceFor(s, null))}`}</span>
                <label className="row" style={{ gap: 6 }}>
                  <span className="muted">₹</span>
                  <input className="input sm" inputMode="numeric" aria-label={`Price for ${s.name}`} value={price}
                    onChange={(e) => actions.setPrice(s.id, Number(e.target.value.replace(/\D/g, '')) || 0)} />
                </label>
              </div>
            </article>
          );
        })}
        <p className="note"><Icon name="info" size={18} />Prices are saved on this device. In the live product they update the customer app too.</p>
      </div>
    </div>
  );
}

/* ---------- Finance ---------- */

export function FinanceScreen({ jobs, provider }) {
  const days = lastDays(7);
  const paid = jobs.filter((j) => j.status === 'paid' && days.includes(j.dateIso));
  const sum = (f) => paid.reduce((a, j) => a + f(j), 0);
  const gross = sum(revenueOf);
  const servicesTotal = sum((j) => billFor(j).serviceTotal);
  const fee = Math.round(servicesTotal * PLATFORM_FEE);
  const payouts = Math.round(servicesTotal * TECH_SHARE);
  const gst = Math.round(sum((j) => billFor(j).gst));
  const net = gross - fee - payouts;
  const perDay = days.map((d) => paid.filter((j) => j.dateIso === d).reduce((a, j) => a + revenueOf(j), 0));
  const max = Math.max(...perDay, 1);
  const pending = jobs.filter((j) => j.status === 'completed');
  const monday = new Date(); monday.setDate(monday.getDate() + ((8 - monday.getDay()) % 7 || 7));

  return (
    <div className="screen">
      <header className="page-head"><h1 className="page-title">Finance</h1><p className="muted">{provider.name} · last 7 days</p></header>
      <div className="content">
        <section className="card stack-sm">
          <small className="muted-label">Revenue (before GST)</small>
          <span className="big-amount">{money(gross)}</span>
          <div className="bars" role="img" aria-label="Daily revenue for the last 7 days">
            {perDay.map((v, i) => (
              <div key={days[i]} className={'bar' + (i === 6 ? ' today' : '')}>
                <span className="val">{v ? (v >= 1000 ? '₹' + (v / 1000).toFixed(1) + 'k' : '₹' + v) : ''}</span>
                <span className="fill" style={{ height: `${(v / max) * 100}%` }} />
                <small>{i === 6 ? 'Today' : new Date(days[i] + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card stack-sm">
          <h2 className="section-title sm">Breakdown</h2>
          <div className="bill-row"><span>Revenue ({paid.length} paid jobs)</span><span>{money(gross)}</span></div>
          <div className="bill-row"><span>Technician payouts (60% of services)</span><span>−{money(payouts)}</span></div>
          <div className="bill-row"><span>Servizato platform fee (15%)</span><span>−{money(fee)}</span></div>
          <hr />
          <div className="bill-row total"><span>Your net earnings</span><span>{money(net)}</span></div>
          <p className="meta"><Icon name="info" size={14} />GST collected {money(gst)} is filed separately.</p>
        </section>

        <div className="stat-grid">
          <div className="stat dark"><small>Next settlement</small><strong>{money(net)}</strong><span className="sub">{monday.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} to your bank</span></div>
          <div className="stat"><small>Awaiting payment</small><strong>{money(pending.reduce((a, j) => a + revenueOf(j), 0))}</strong><span className="muted">{pending.length} completed jobs</span></div>
        </div>

        <section className="stack-sm">
          <h2 className="section-title sm">Transactions</h2>
          {paid.length === 0 && <p className="empty-note">No paid jobs in the last 7 days.</p>}
          <div className="list-group">
            {paid.map((j) => (
              <div key={j.id} className="list-link">
                <span className="cat-icon sm"><Icon name={getCategory(j.categoryId).icon} size={18} /></span>
                <span className="grow">{j.customerName}<small>{dayLabel(j.dateIso)} · {serviceNames(j)} · {PAY[j.payMethod] || 'Paid'}</small></span>
                <strong>{money(revenueOf(j))}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- Reviews ---------- */

export function ReviewsScreen({ jobs, store, provider, nav, actions }) {
  const reviewed = jobs.filter((j) => j.review);
  const avg = reviewed.length ? reviewed.reduce((a, j) => a + j.review.rating, 0) / reviewed.length : 0;
  const counts = [5, 4, 3, 2, 1].map((n) => reviewed.filter((j) => j.review.rating === n).length);
  const [replying, setReplying] = useState(null);
  const [text, setText] = useState('');

  return (
    <div className="screen">
      <TopBar title="Reviews" sub={provider.name} onBack={nav.back} />
      <div className="content">
        <section className="card row" style={{ alignItems: 'center', gap: 20 }}>
          <div className="stack-xs" style={{ alignItems: 'center' }}>
            <span className="big-rating">{avg.toFixed(1)}</span>
            <span className="rating"><Icon name="star" filled size={14} className="star-on" />{reviewed.length} reviews</span>
          </div>
          <div className="grow stack-xs">
            {[5, 4, 3, 2, 1].map((n, i) => (
              <div key={n} className="rb"><span>{n}</span><div className="rb-track"><div className="rb-fill" style={{ width: `${reviewed.length ? (counts[i] / reviewed.length) * 100 : 0}%` }} /></div><span>{counts[i]}</span></div>
            ))}
          </div>
        </section>

        {reviewed.length === 0 && <p className="empty-note">No reviews yet.</p>}
        {reviewed.map((j) => (
          <article key={j.id} className="card stack-sm">
            <div className="row-between top">
              <div className="row">
                <span className="avatar round">{initials(j.customerName)}</span>
                <div className="stack-xs"><strong>{j.customerName}</strong><span className="muted">{serviceNames(j)} · {dayLabel(j.dateIso)}</span></div>
              </div>
              <span className="rating"><Icon name="star" filled size={14} className="star-on" />{j.review.rating}</span>
            </div>
            {j.review.comment && <p className="card-desc">“{j.review.comment}”</p>}
            {j.review.tags?.length > 0 && <div className="badges">{j.review.tags.map((t) => <span key={t} className="badge">{t}</span>)}</div>}
            <div className="row-gap">{j.tech && <span className="muted">Technician: {j.tech.name}</span>}<SourceBadge job={j} /></div>
            {store.replies[j.id] ? (
              <p className="reply"><strong>Your reply:</strong> {store.replies[j.id]}</p>
            ) : replying === j.id ? (
              <div className="stack-sm">
                <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Thank the customer or respond to feedback" autoFocus />
                <div className="row-gap">
                  <button type="button" className="btn btn-ghost" onClick={() => setReplying(null)}>Cancel</button>
                  <button type="button" className="btn btn-primary" disabled={!text.trim()} onClick={() => { actions.reply(j.id, text.trim()); setReplying(null); setText(''); }}>Post reply</button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-soft" onClick={() => { setReplying(j.id); setText(''); }}><Icon name="chat" size={16} />Reply</button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

/* ---------- More ---------- */

export function MoreScreen({ provider, store, nav, actions, install }) {
  return (
    <div className="screen">
      <header className="page-head"><h1 className="page-title">More</h1></header>
      <div className="content">
        <div className="list-group">
          <button type="button" className="list-link" onClick={() => nav.go('services')}><Icon name="tag" className="accent" /><span className="grow">Services and pricing<small>Prices and which services you offer</small></span><Icon name="chevronRight" size={18} /></button>
          <button type="button" className="list-link" onClick={() => nav.go('reviews')}><Icon name="star" className="accent" /><span className="grow">Reviews<small>See and reply to customer reviews</small></span><Icon name="chevronRight" size={18} /></button>
          <button type="button" className="list-link" onClick={() => nav.tab('finance')}><Icon name="chart" className="accent" /><span className="grow">Finance<small>Revenue, payouts and settlements</small></span><Icon name="chevronRight" size={18} /></button>
        </div>

        <label className="field">
          Signed in as (demo)
          <select className="input" value={store.providerId} onChange={(e) => actions.switchProvider(e.target.value)}>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>

        {!install.installed && (
          <section className="card stack-sm">
            <h2 className="section-title sm">Install the app</h2>
            {install.canPrompt ? (
              <>
                <p className="muted">Add the partner app to your home screen. It opens full screen and works offline.</p>
                <button type="button" className="btn btn-primary" onClick={install.prompt}><Icon name="download" size={18} />Install app</button>
              </>
            ) : install.isIos ? (
              <p className="muted">In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</p>
            ) : (
              <p className="muted">Open your browser menu (⋮) and tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
            )}
          </section>
        )}

        <section className="demo-box">
          <p><strong>Connected demo.</strong> Bookings made in the customer app for {provider.name} arrive under Requests. When you assign one, it goes to that technician in the Technician app, and the customer sees the progress.</p>
          <button type="button" className="btn btn-outline" onClick={actions.reset}>Reset demo data</button>
        </section>
      </div>
    </div>
  );
}
