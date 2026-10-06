// Sample jobs and reviews so the provider app works on its own. Real bookings from the
// customer app are added on top (see App.jsx).
import { services, getProvider } from './data.js';
import { TEAMS, techCard } from './shared.js';

const CUSTOMERS = [
  ['Rahul Mehta', 'C-114, Sector 50, Noida'], ['Sneha Kapoor', 'Tower 6, Flat 1203, Sector 75, Noida'],
  ['Arjun Nair', 'Plot 7, Sector 63, Noida'], ['Meera Iyer', 'B-22, Sector 41, Noida'],
  ['Karan Malhotra', 'Flat 803, Sector 137, Noida'], ['Ananya Gupta', 'D-9, Sector 27, Noida'],
  ['Vivek Bansal', 'Villa 14, Sector 44, Noida'], ['Ritika Sood', 'Flat 1502, Sector 100, Noida'],
  ['Farhan Qureshi', 'H-31, Sector 55, Noida'], ['Divya Menon', 'Flat 404, Sector 78, Noida'],
];
const COMMENTS = [
  [5, 'Very professional and explained everything clearly.'],
  [5, 'Came on time and finished quickly. Will book again.'],
  [4, 'Good work, slightly late but called ahead.'],
  [5, 'Neat work and fair price.'],
  [3, 'Work was fine but had to wait for a part.'],
  [5, 'Excellent service, very polite.'],
  [4, 'Solved the problem, cleaned up after.'],
  [5, 'Best technician so far.'],
];

const isoDay = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const stamp = (offset, hour) => { const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(hour, 15, 0, 0); return d.toISOString(); };

export function sampleJobsFor(providerId) {
  const provider = getProvider(providerId);
  const team = TEAMS[providerId] || [];
  const cats = provider.categories.filter((c) => services[c]);
  let n = 0;
  const make = (offset, slot, status, extra = {}) => {
    const i = n++;
    const cat = cats[i % cats.length];
    const list = services[cat];
    const [name, line] = CUSTOMERS[i % CUSTOMERS.length];
    return {
      id: `P-${providerId}-${i + 1}`, source: 'sample', providerId, customerName: name,
      address: { label: 'Home', line }, categoryId: cat, serviceIds: [list[i % list.length].id],
      dateIso: isoDay(offset), slotStart: slot, note: '', otp: String(2000 + i * 731).slice(0, 4),
      status, firstBooking: false, parts: [], createdAt: stamp(offset, slot - 2),
      history: { confirmed: stamp(offset, slot - 2) }, ...extra,
    };
  };
  const tech = (k) => team[k % team.length];
  const assigned = (k, upto, offset, slot) => {
    const t = tech(k);
    const h = { confirmed: stamp(offset, slot - 2), assigned: stamp(offset, slot - 1) };
    if (['onway', 'started', 'completed', 'paid'].includes(upto)) h.onway = stamp(offset, slot);
    if (['started', 'completed', 'paid'].includes(upto)) h.started = stamp(offset, slot);
    if (['completed', 'paid'].includes(upto)) h.completed = stamp(offset, slot + 1);
    if (upto === 'paid') h.paid = stamp(offset, slot + 1);
    return { techId: t.id, tech: techCard(t), techAccepted: true, history: h };
  };

  const jobs = [
    make(0, 15, 'confirmed', { note: 'Water leaking from the indoor unit.' }),
    make(1, 11, 'confirmed'),
    make(0, 11, 'onway', assigned(1, 'onway', 0, 11)),
    make(0, 9, 'started', assigned(0, 'started', 0, 9)),
  ];
  // Paid history for the last 7 days (drives revenue, finance and reviews).
  const pattern = [[0, 9], [-1, 11], [-1, 15], [-2, 13], [-3, 9], [-3, 17], [-4, 11], [-5, 15], [-6, 13], [-6, 9]];
  pattern.forEach(([offset, slot], k) => {
    const j = make(offset, slot, 'paid', { ...assigned(k, 'paid', offset, slot), payMethod: ['upi', 'card', 'cash'][k % 3] });
    if (k === 0) j.status = 'paid';
    if (k < COMMENTS.length) {
      const [rating, comment] = COMMENTS[k];
      j.review = { rating, comment, tags: [] };
    }
    if (k % 4 === 1) j.parts = [{ name: 'Replacement part', price: 350 }];
    jobs.push(j);
  });
  return jobs;
}
