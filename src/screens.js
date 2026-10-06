import { useState } from 'react';
import { Text, View } from 'react-native';
import { Icon } from './icons.js';
import {
  slots, providers, services, getCategory, getService, priceFor, money, billFor, fmtDate, fmtTime, fmtNum,
} from './data.js';
import { TECH_SHARE, PLATFORM_FEE } from './shared.js';
import {
  C, T, Row, RowBetween, Wrap, Stack, Grow, Hr, Screen, Content, TopBar, PageHead, BottomBar, Card, Note, Banner,
  DemoBox, ConfirmBox, Btn, Chip, ChipRow, Switch, Option, Badge, SrcBadge, Avatar, CatIcon, Rating, Meta, BillRow,
  StatGrid, Stat, Bars, ListGroup, ListLink, Timeline, Empty, ProofGrid, Input, TextArea, Select, SyncStatus,
} from './ui.js';

/* ---------- helpers ---------- */

const slotLabel = (start) => (slots.find((x) => x.start === start) || {}).label || '';
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayIso = () => isoOf(new Date());
const dayLabel = (iso) => {
  if (iso === todayIso()) return 'Today';
  const t = new Date(); t.setDate(t.getDate() + 1);
  if (iso === isoOf(t)) return 'Tomorrow';
  return fmtDate(new Date(iso + 'T00:00:00'), { weekday: 'short', day: true, month: 'short' });
};
const timeOf = (iso) => (iso ? fmtTime(new Date(iso)) : '');
const serviceNames = (j) => j.serviceIds.map((id) => getService(j.categoryId, id)?.name).filter(Boolean).join(', ');
const initials = (name) => name.split(' ').map((w) => w[0]).join('').slice(0, 2);
const ACTIVE = ['assigned', 'onway', 'started', 'completed'];
const revenueOf = (j) => { const b = billFor(j); return b.serviceTotal + b.partsTotal - b.discount; };
const lastDays = (n) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return isoOf(d); });
const PAY = { upi: 'UPI', card: 'Card', netbanking: 'Net banking', cash: 'Cash' };

function statusOf(j) {
  if (j.status === 'confirmed') return { label: j.returned ? 'Returned by technician' : 'New request', tone: 'warm' };
  if (j.status === 'assigned') return j.techAccepted ? { label: 'Technician accepted', tone: 'blue' } : { label: 'Waiting for technician', tone: 'warm' };
  return ({
    onway: { label: 'On the way', tone: 'blue' }, started: { label: 'In progress', tone: 'blue' },
    completed: { label: 'Awaiting payment', tone: 'warm' }, paid: { label: 'Paid', tone: 'good' },
    cancelled: { label: j.declined ? 'Declined' : 'Cancelled by customer', tone: 'bad' },
  })[j.status] || { label: j.status, tone: '' };
}

const CustomerBadge = ({ job }) => (job.source === 'customer' ? <SrcBadge source="customer" /> : null);

function JobRow({ job, onOpen }) {
  const cat = getCategory(job.categoryId);
  const st = statusOf(job);
  return (
    <Card onPress={onOpen} gap={12}>
      <RowBetween>
        <T v="jobTime">{dayLabel(job.dateIso)} · {slotLabel(job.slotStart)}</T>
        <Badge tone={st.tone}>{st.label}</Badge>
      </RowBetween>
      <Row>
        <CatIcon name={cat.icon} sm />
        <Grow>
          <T v="cardTitle">{serviceNames(job)}</T>
          <T v="muted">{job.customerName}{job.tech ? ' · ' + job.tech.name : ''}</T>
        </Grow>
        <T v="strong">{money(billFor(job).estimate)}</T>
      </Row>
      <CustomerBadge job={job} />
    </Card>
  );
}

function OtherProvidersBanner({ otherRequests, actions }) {
  if (!otherRequests.length) return null;
  const p = providers.find((x) => x.id === otherRequests[0].providerId);
  return (
    <Banner text={`${otherRequests.length} new ${otherRequests.length === 1 ? 'request' : 'requests'} from the customer app for ${p.name}`}
      action="Switch" onAction={() => actions.switchProvider(p.id)} />
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
    <Screen>
      <PageHead>
        <RowBetween>
          <Stack gap={3} style={{ flex: 1 }}>
            <T v="label">{fmtDate(new Date(), { weekday: 'long', day: true, month: 'long' })}</T>
            <T v="pageTitle">{provider.name}</T>
          </Stack>
          <Avatar text={provider.initials} round={false} />
        </RowBetween>
      </PageHead>
      <Content>
        <OtherProvidersBanner otherRequests={otherRequests} actions={actions} />

        <StatGrid>
          <Stat dark label="Revenue today" value={money(revenueToday)} sub={money(revenueWeek) + ' this week'} />
          <Stat label="Jobs today" value={todayJobs.length} sub={active.length + ' in progress'} />
          <Stat label="New requests" value={requests.length} sub={requests.length ? 'Assign now →' : 'All caught up'} onPress={() => nav.tab('requests')} />
          <Stat label="Rating" value={avg.toFixed(1)} right={<Icon name="star" filled size={18} color={C.star} />} sub={reviews.length + ' reviews →'} onPress={() => nav.go('reviews')} />
        </StatGrid>

        <Stack>
          <RowBetween>
            <T v="sectionSm">New requests</T>
            {requests.length > 2 && <Btn variant="ghost" small onPress={() => nav.tab('requests')}>View all</Btn>}
          </RowBetween>
          {requests.length === 0 && <T v="empty">No new requests. Bookings from the customer app appear here.</T>}
          {requests.slice(0, 2).map((j) => <JobRow key={j.id} job={j} onOpen={() => nav.go('assign', { id: j.id })} />)}
        </Stack>

        <Stack>
          <T v="sectionSm">Active jobs ({active.length})</T>
          {active.length === 0 && <T v="empty">No jobs in progress.</T>}
          {active.map((j) => <JobRow key={j.id} job={j} onOpen={() => nav.go('job', { id: j.id })} />)}
        </Stack>

        <ListGroup>
          <ListLink icon="users" title="Technicians" sub={`${available} of ${team.length} available now`} onPress={() => nav.tab('team')} />
          <ListLink icon="tag" title="Services and pricing" sub={provider.categories.length + ' categories'} onPress={() => nav.go('services')} />
          <ListLink icon="chart" title="Finance" sub="Revenue, payouts and settlements" onPress={() => nav.tab('finance')} />
        </ListGroup>
      </Content>
    </Screen>
  );
}

/* ---------- Incoming requests ---------- */

export function RequestsScreen({ requests, jobs, otherRequests, nav, actions }) {
  const [declining, setDeclining] = useState(null);
  const waiting = jobs.filter((j) => j.status === 'assigned' && !j.techAccepted);

  return (
    <Screen>
      <PageHead><T v="pageTitle">Incoming requests</T></PageHead>
      <Content>
        <OtherProvidersBanner otherRequests={otherRequests} actions={actions} />
        {requests.length === 0 && (
          <Empty icon="inbox" title="No new requests" sub="Book a service in the customer app and it shows up here." />
        )}
        {requests.map((j) => {
          const bill = billFor(j);
          return (
            <Card key={j.id} on={j.source === 'customer'} gap={10}>
              <RowBetween>
                <T v="jobTime">{dayLabel(j.dateIso)} · {slotLabel(j.slotStart)}</T>
                {j.source === 'customer' ? <CustomerBadge job={j} /> : <T v="faint">#{j.id}</T>}
              </RowBetween>
              <Row>
                <CatIcon name={getCategory(j.categoryId).icon} sm />
                <Grow><T v="cardTitle">{serviceNames(j)}</T><T v="muted">{j.customerName} · {j.address?.line}</T></Grow>
              </Row>
              {j.note ? <T v="cardDesc">“{j.note}”</T> : null}
              {j.returned && <Note tone="danger">The technician declined. Assign someone else.</Note>}
              <BillRow label="Estimate (before GST)" value={money(bill.estimate)} />
              {declining === j.id ? (
                <ConfirmBox text={'Decline this request?' + (j.source === 'customer' ? ' The customer is told it was declined.' : '')} confirmLabel="Decline"
                  onKeep={() => setDeclining(null)} onConfirm={() => { actions.decline(j); setDeclining(null); }} />
              ) : (
                <Row gap={8}>
                  <Btn variant="outline" style={{ flex: 1 }} onPress={() => setDeclining(j.id)}>Decline</Btn>
                  <Btn style={{ flex: 2 }} onPress={() => nav.go('assign', { id: j.id })}>Accept and assign</Btn>
                </Row>
              )}
            </Card>
          );
        })}

        {waiting.length > 0 && (
          <Stack>
            <T v="sectionSm">Waiting for technician to accept</T>
            {waiting.map((j) => <JobRow key={j.id} job={j} onOpen={() => nav.go('job', { id: j.id })} />)}
          </Stack>
        )}
      </Content>
    </Screen>
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
    <Screen>
      <TopBar title="Assign a technician" sub={serviceNames(job) + ' · ' + job.customerName} onBack={nav.back} />
      <Content>
        <Card gap={10}>
          <RowBetween><T v="jobTime">{dayLabel(job.dateIso)} · {slotLabel(job.slotStart)}</T><CustomerBadge job={job} /></RowBetween>
          <Row><Icon name="pin" color={C.blue} /><T v="muted" style={{ flex: 1 }}>{job.address?.line}</T></Row>
          <BillRow label="Estimate" value={money(bill.estimate)} />
          <BillRow label="Technician payout (60%)" value={money(Math.round(bill.serviceTotal * TECH_SHARE))} />
        </Card>

        <Stack>
          <T v="sectionSm">Your technicians</T>
          {sorted.map((t) => {
            const off = !!store.off[t.id];
            const busy = busyCount(t);
            const match = t.skills.includes(job.categoryId);
            return (
              <Option key={t.id} on={pick === t.id} disabled={off} onPress={() => setPick(t.id)} left={<Avatar text={t.initials} />} title={t.name}>
                <Wrap gap={12} style={{ alignItems: 'center' }}>
                  <Rating value={t.rating} size={13} />
                  <T v="muted" style={{ color: C.ink2 }}>{off ? 'Off duty' : busy ? `${busy} job${busy > 1 ? 's' : ''} today` : 'Available'}</T>
                  {match && <T v="good" style={{ fontSize: 13 }}>Skill match</T>}
                </Wrap>
              </Option>
            );
          })}
        </Stack>
        <Note>The technician gets the job in the Technician app and accepts it there. Sign in there as the same person to try it.</Note>
      </Content>
      <BottomBar>
        <Btn lg disabled={!chosen} onPress={() => actions.assign(job, pick)}>
          {chosen ? `Assign to ${chosen.name}` : 'No technician available'}
        </Btn>
      </BottomBar>
    </Screen>
  );
}

/* ---------- Job details ---------- */

export function JobScreen({ job, nav, store }) {
  const bill = billFor(job);
  const st = statusOf(job);
  const steps = [
    ['confirmed', 'Booked'], ['assigned', 'Technician assigned'], ['accepted', 'Technician accepted'],
    ['onway', 'On the way'], ['started', 'Started with OTP'], ['completed', 'Completed'], ['paid', 'Paid'],
  ].map(([k, title]) => ({ title, time: timeOf(job.history?.[k]), state: job.history?.[k] ? 'done' : 'todo' }));

  return (
    <Screen>
      <TopBar title={'Job #' + job.id} sub={`${getCategory(job.categoryId).name} · ${dayLabel(job.dateIso)}, ${slotLabel(job.slotStart)}`} onBack={nav.back} />
      <Content>
        <RowBetween><Badge tone={st.tone}>{st.label}</Badge><CustomerBadge job={job} /></RowBetween>

        <Card>
          <Row>
            <Avatar text={initials(job.customerName)} />
            <Grow><T v="strong">{job.customerName}</T><T v="muted">{job.address?.line}</T></Grow>
          </Row>
        </Card>

        {job.tech && (
          <Card>
            <Row>
              <Avatar text={job.tech.initials} />
              <Grow><T v="strong">{job.tech.name}</T><Row gap={6}><Rating value={job.tech.rating} size={13} /><T v="meta">Technician</T></Row></Grow>
            </Row>
          </Card>
        )}

        <Card>
          <T v="sectionSm">Progress</T>
          <Timeline steps={steps} />
        </Card>

        {job.photos?.length > 0 && (
          <Stack>
            <T v="sectionSm">Proof of work</T>
            <ProofGrid photos={job.photos} />
          </Stack>
        )}

        <Card gap={10}>
          <T v="sectionSm">Bill</T>
          {bill.lines.map((l) => <BillRow key={l.name} label={l.name} value={money(l.amount)} />)}
          {bill.parts.map((p, i) => <BillRow key={i} label={p.name} value={money(p.price)} />)}
          {bill.discount > 0 && <BillRow label="First booking offer" value={'−' + money(bill.discount)} good />}
          <BillRow label="GST (18%)" value={money(bill.gst)} />
          <Hr />
          <BillRow total label={job.status === 'paid' ? 'Paid' : 'Total'} value={money(bill.total)} />
          {job.payMethod && <Meta icon="wallet">Paid via {PAY[job.payMethod] || job.payMethod}</Meta>}
        </Card>

        {job.review && (
          <Card gap={10}>
            <T v="sectionSm">Customer review</T>
            <Rating value={job.review.rating} size={16} label={job.review.rating + ' of 5'} />
            {job.review.comment ? <T v="cardDesc">“{job.review.comment}”</T> : null}
            {store.replies[job.id] ? <Reply text={store.replies[job.id]} /> : null}
          </Card>
        )}
      </Content>
    </Screen>
  );
}

function Reply({ text }) {
  return (
    <View style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.bg }}>
      <Text style={{ fontSize: 13, color: C.ink2 }}><Text style={{ fontWeight: '700' }}>Your reply:</Text> {text}</Text>
    </View>
  );
}

/* ---------- Technicians ---------- */

export function TeamScreen({ team, jobs, store, provider, nav, actions }) {
  const today = todayIso();
  const week = lastDays(7);
  return (
    <Screen>
      <PageHead><Stack gap={3}><T v="pageTitle">Technicians</T><T v="muted">{provider.name} · {team.length} people</T></Stack></PageHead>
      <Content>
        {team.map((t) => {
          const mine = jobs.filter((j) => j.techId === t.id);
          const activeJob = mine.find((j) => ['onway', 'started'].includes(j.status)) || mine.find((j) => j.status === 'assigned');
          const doneToday = mine.filter((j) => ['completed', 'paid'].includes(j.status) && j.dateIso === today).length;
          const earned = mine.filter((j) => j.status === 'paid' && week.includes(j.dateIso)).reduce((a, j) => a + Math.round(billFor(j).serviceTotal * TECH_SHARE), 0);
          const off = !!store.off[t.id];
          const [dot, label] = off ? ['#A0A8B5', 'Off duty'] : activeJob ? [C.star, activeJob.status === 'assigned' ? 'Job assigned' : 'On a job'] : [C.green, 'Available'];
          return (
            <Card key={t.id} gap={10}>
              <Row>
                <Avatar text={t.initials} />
                <Grow>
                  <T v="cardTitle">{t.name}</T>
                  <Row gap={12}><Rating value={t.rating} size={13} /><T v="muted" style={{ color: C.ink2 }}>{fmtNum(t.jobs)} jobs</T></Row>
                </Grow>
                <Switch on={!off} onPress={() => actions.toggleTech(t.id)} label={`${t.name} on duty`} />
              </Row>
              <RowBetween>
                <Row gap={6}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} /><T v="meta" style={{ fontWeight: '700', color: C.ink }}>{label}</T></Row>
                <T v="muted">{doneToday} done today · {money(earned)} this week</T>
              </RowBetween>
              <Wrap gap={6}>{t.skills.map((sk) => <Badge key={sk}>{getCategory(sk)?.name}</Badge>)}</Wrap>
              {activeJob && (
                <Card onPress={() => nav.go('job', { id: activeJob.id })} style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14 }}>
                  <Row>
                    <Grow><T v="strong">{serviceNames(activeJob)}</T><T v="muted" style={{ fontSize: 12 }}>{activeJob.customerName} · {slotLabel(activeJob.slotStart)}</T></Grow>
                    <Icon name="chevronRight" size={18} />
                  </Row>
                </Card>
              )}
            </Card>
          );
        })}
        <Note>Turn someone off duty and they can't be assigned new jobs. Each technician can sign in to the Technician app to accept jobs.</Note>
      </Content>
    </Screen>
  );
}

/* ---------- Services and pricing ---------- */

export function ServicesScreen({ provider, store, nav, actions }) {
  const [cat, setCat] = useState(provider.categories[0]);
  const list = services[cat] || [];
  return (
    <Screen>
      <TopBar title="Services and pricing" sub={provider.name} onBack={nav.back} />
      <ChipRow>
        {provider.categories.map((c) => <Chip key={c} on={cat === c} onPress={() => setCat(c)}>{getCategory(c).name}</Chip>)}
      </ChipRow>
      <Content>
        {list.map((s) => {
          const def = priceFor(s, provider);
          const price = store.prices[s.id] ?? def;
          const off = !!store.inactive[s.id];
          return (
            <Card key={s.id} gap={10} style={off ? { opacity: 0.6 } : undefined}>
              <Row>
                <Grow><T v="cardTitle">{s.name}</T><Meta icon="clock">{s.time}</Meta></Grow>
                <Switch on={!off} onPress={() => actions.toggleService(s.id)} label={`Offer ${s.name}`} />
              </Row>
              <RowBetween>
                <T v="muted" style={{ flex: 1 }}>{off ? 'Hidden from customers' : `Market average ${money(priceFor(s, null))}`}</T>
                <Row gap={6}>
                  <T v="muted">₹</T>
                  <Input sm keyboardType="number-pad" accessibilityLabel={`Price for ${s.name}`} value={String(price)}
                    onChangeText={(v) => actions.setPrice(s.id, Number(v.replace(/\D/g, '')) || 0)} />
                </Row>
              </RowBetween>
            </Card>
          );
        })}
        <Note>Prices are saved on this phone. In the live product they update the customer app too.</Note>
      </Content>
    </Screen>
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
  const labels = days.map((d, i) => (i === 6 ? 'Today' : fmtDate(new Date(d + 'T00:00:00'), { weekday: 'short' })));
  const pending = jobs.filter((j) => j.status === 'completed');
  const monday = new Date(); monday.setDate(monday.getDate() + ((8 - monday.getDay()) % 7 || 7));

  return (
    <Screen>
      <PageHead><Stack gap={3}><T v="pageTitle">Finance</T><T v="muted">{provider.name} · last 7 days</T></Stack></PageHead>
      <Content>
        <Card gap={10}>
          <T v="label">Revenue (before GST)</T>
          <T v="big">{money(gross)}</T>
          <Bars values={perDay} labels={labels} fmt={(v) => (v >= 1000 ? '₹' + (v / 1000).toFixed(1) + 'k' : '₹' + v)} label="Daily revenue for the last 7 days" />
        </Card>

        <Card gap={10}>
          <T v="sectionSm">Breakdown</T>
          <BillRow label={`Revenue (${paid.length} paid jobs)`} value={money(gross)} />
          <BillRow label="Technician payouts (60% of services)" value={'−' + money(payouts)} />
          <BillRow label="Servizato platform fee (15%)" value={'−' + money(fee)} />
          <Hr />
          <BillRow total label="Your net earnings" value={money(net)} />
          <Meta icon="info">GST collected {money(gst)} is filed separately.</Meta>
        </Card>

        <StatGrid>
          <Stat dark label="Next settlement" value={money(net)} sub={fmtDate(monday, { weekday: 'short', day: true, month: 'short' }) + ' to your bank'} />
          <Stat label="Awaiting payment" value={money(pending.reduce((a, j) => a + revenueOf(j), 0))} sub={pending.length + ' completed jobs'} subMuted />
        </StatGrid>

        <Stack>
          <T v="sectionSm">Transactions</T>
          {paid.length === 0 && <T v="empty">No paid jobs in the last 7 days.</T>}
          {paid.length > 0 && (
            <ListGroup>
              {paid.map((j) => (
                <ListLink key={j.id} left={<CatIcon name={getCategory(j.categoryId).icon} sm />} title={j.customerName}
                  sub={`${dayLabel(j.dateIso)} · ${serviceNames(j)} · ${PAY[j.payMethod] || 'Paid'}`} right={<T v="strong">{money(revenueOf(j))}</T>} />
              ))}
            </ListGroup>
          )}
        </Stack>
      </Content>
    </Screen>
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
    <Screen>
      <TopBar title="Reviews" sub={provider.name} onBack={nav.back} />
      <Content>
        <Card>
          <Row gap={20}>
            <View style={{ alignItems: 'center', gap: 3 }}>
              <T v="bigRating">{avg.toFixed(1)}</T>
              <Rating value={avg} label={reviewed.length + ' reviews'} />
            </View>
            <Grow gap={4}>
              {[5, 4, 3, 2, 1].map((n, i) => (
                <Row key={n} gap={8}>
                  <T v="meta" style={{ fontWeight: '700' }}>{n}</T>
                  <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: C.line3, overflow: 'hidden' }}>
                    <View style={{ height: '100%', borderRadius: 4, backgroundColor: C.star, width: `${reviewed.length ? (counts[i] / reviewed.length) * 100 : 0}%` }} />
                  </View>
                  <T v="meta" style={{ fontWeight: '700' }}>{counts[i]}</T>
                </Row>
              ))}
            </Grow>
          </Row>
        </Card>

        {reviewed.length === 0 && <T v="empty">No reviews yet.</T>}
        {reviewed.map((j) => (
          <Card key={j.id} gap={10}>
            <RowBetween align="flex-start">
              <Row style={{ flex: 1 }}>
                <Avatar text={initials(j.customerName)} />
                <Grow><T v="strong">{j.customerName}</T><T v="muted">{serviceNames(j)} · {dayLabel(j.dateIso)}</T></Grow>
              </Row>
              <Rating value={j.review.rating} label={String(j.review.rating)} />
            </RowBetween>
            {j.review.comment ? <T v="cardDesc">“{j.review.comment}”</T> : null}
            {j.review.tags?.length > 0 && <Wrap gap={6}>{j.review.tags.map((t) => <Badge key={t}>{t}</Badge>)}</Wrap>}
            <Wrap>{j.tech && <T v="muted">Technician: {j.tech.name}</T>}<CustomerBadge job={j} /></Wrap>
            {store.replies[j.id] ? (
              <Reply text={store.replies[j.id]} />
            ) : replying === j.id ? (
              <Stack>
                <TextArea rows={2} value={text} onChangeText={setText} placeholder="Thank the customer or respond to feedback" autoFocus />
                <Row gap={8}>
                  <Btn variant="ghost" onPress={() => setReplying(null)}>Cancel</Btn>
                  <Btn disabled={!text.trim()} onPress={() => { actions.reply(j.id, text.trim()); setReplying(null); setText(''); }}>Post reply</Btn>
                </Row>
              </Stack>
            ) : (
              <Btn variant="soft" onPress={() => { setReplying(j.id); setText(''); }}><Icon name="chat" size={16} color={C.blueDark} /><Text style={{ color: C.blueDark, fontSize: 15, fontWeight: '700' }}>Reply</Text></Btn>
            )}
          </Card>
        ))}
      </Content>
    </Screen>
  );
}

/* ---------- More ---------- */

export function MoreScreen({ provider, store, nav, actions }) {
  return (
    <Screen>
      <PageHead><T v="pageTitle">More</T></PageHead>
      <Content>
        <ListGroup>
          <ListLink icon="tag" title="Services and pricing" sub="Prices and which services you offer" onPress={() => nav.go('services')} />
          <ListLink icon="star" title="Reviews" sub="See and reply to customer reviews" onPress={() => nav.go('reviews')} />
          <ListLink icon="chart" title="Finance" sub="Revenue, payouts and settlements" onPress={() => nav.tab('finance')} />
        </ListGroup>

        <Select label="Signed in as (demo)" value={store.providerId} onChange={actions.switchProvider}
          groups={[{ label: '', options: providers.map((p) => ({ value: p.id, label: p.name })) }]} />

        <SyncStatus />
        <DemoBox>
          <T v="body" style={{ fontSize: 13, color: C.ink2, lineHeight: 19 }}>
            <Text style={{ fontWeight: '700' }}>Connected demo. </Text>
            Bookings made in the customer app for {provider.name} arrive under Requests. When you assign one, it goes to that technician in the Technician app, and the customer sees the progress.
          </T>
          <Btn variant="outline" onPress={actions.reset}>Reset demo data</Btn>
        </DemoBox>
      </Content>
    </Screen>
  );
}
