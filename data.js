// Sample marketplace data. Replace with API calls once backend access is available.

export const categories = [
  { id: 'ac', name: 'AC Repair', title: 'AC repair & service', icon: 'snow' },
  { id: 'plumbing', name: 'Plumbing', title: 'Plumbing', icon: 'drop' },
  { id: 'electrical', name: 'Electrical', title: 'Electrical', icon: 'bolt' },
  { id: 'cleaning', name: 'Cleaning', title: 'Home cleaning', icon: 'sparkle' },
  { id: 'appliances', name: 'Appliances', title: 'Appliance repair', icon: 'washer' },
  { id: 'carpentry', name: 'Carpentry', title: 'Carpentry', icon: 'wrench' },
  { id: 'painting', name: 'Painting', title: 'Painting', icon: 'roller' },
  { id: 'pest', name: 'Pest control', title: 'Pest control', icon: 'bug' },
];

export const services = {
  ac: [
    { id: 'ac-general', name: 'AC general service', desc: 'Filter and coil cleaning, drain check, gas pressure check', time: '45–60 min', price: 500 },
    { id: 'ac-diagnosis', name: 'Not cooling: diagnosis', desc: 'Technician inspects the unit and quotes before any repair', time: '30 min', price: 300 },
    { id: 'ac-gas', name: 'Gas refill (split AC)', desc: 'Leak test, leak fix and full gas refill', time: '90 min', price: 2500 },
    { id: 'ac-install', name: 'AC installation', desc: 'Indoor and outdoor unit, up to 3 m copper pipe', time: '2–3 hrs', price: 1500 },
  ],
  plumbing: [
    { id: 'pl-leak', name: 'Leak repair', desc: 'Tap, sink or pipe leak fixed on the spot', time: '30–45 min', price: 300 },
    { id: 'pl-block', name: 'Drain unblocking', desc: 'Kitchen sink, wash basin or bathroom drain', time: '45 min', price: 400 },
    { id: 'pl-fitting', name: 'Tap or shower fitting', desc: 'Install or replace one fitting', time: '30 min', price: 250 },
  ],
  electrical: [
    { id: 'el-fan', name: 'Ceiling fan installation', desc: 'Mounting, wiring and testing', time: '45 min', price: 300 },
    { id: 'el-switch', name: 'Switchboard repair', desc: 'Faulty switch or socket replaced', time: '30 min', price: 200 },
    { id: 'el-wiring', name: 'Wiring fault check', desc: 'Trips, sparks or power loss diagnosed', time: '60 min', price: 400 },
  ],
  cleaning: [
    { id: 'cl-deep2', name: '2 BHK deep cleaning', desc: 'All rooms, kitchen and bathrooms', time: '5–6 hrs', price: 2200 },
    { id: 'cl-bath', name: 'Bathroom cleaning', desc: 'Tiles, fittings and floor descaling', time: '60 min', price: 500 },
    { id: 'cl-sofa', name: 'Sofa shampoo', desc: 'Up to 5 seats, fabric safe', time: '90 min', price: 800 },
  ],
  appliances: [
    { id: 'ap-wm', name: 'Washing machine repair', desc: 'Diagnosis and repair quote', time: '45 min', price: 400 },
    { id: 'ap-fridge', name: 'Refrigerator repair', desc: 'Not cooling, noise or leakage', time: '60 min', price: 450 },
    { id: 'ap-ro', name: 'RO water purifier service', desc: 'Filter check and cleaning', time: '45 min', price: 350 },
  ],
  carpentry: [
    { id: 'cp-door', name: 'Door repair', desc: 'Hinges, lock or alignment fixed', time: '45 min', price: 350 },
    { id: 'cp-furniture', name: 'Furniture assembly', desc: 'Bed, wardrobe or table assembly', time: '1–2 hrs', price: 600 },
  ],
  painting: [
    { id: 'pt-room', name: 'Single room painting', desc: 'Up to 120 sq ft walls, two coats', time: '1 day', price: 3500 },
    { id: 'pt-touch', name: 'Touch-up and patch work', desc: 'Cracks and stains on one wall', time: '3 hrs', price: 900 },
  ],
  pest: [
    { id: 'ps-cockroach', name: 'Cockroach control', desc: 'Gel treatment for kitchen and bathrooms', time: '60 min', price: 900 },
    { id: 'ps-termite', name: 'Termite inspection', desc: 'Inspection with treatment quote', time: '45 min', price: 500 },
  ],
};

const allCats = categories.map((c) => c.id);

export const providers = [
  { id: 'coolcare', name: 'CoolCare Services', initials: 'CC', rating: 4.8, reviews: 2140, km: 1.2, jobs: '3,200+', factor: 1.0, offer: '', categories: ['ac', 'appliances', 'electrical'], technician: { name: 'Aman Kumar', initials: 'AK', rating: 4.9 }, earliest: 13 },
  { id: 'airpro', name: 'AirPro Technicians', initials: 'AP', rating: 4.9, reviews: 980, km: 3.1, jobs: '1,100+', factor: 1.1, offer: '', categories: ['ac', 'appliances'], technician: { name: 'Rohit Singh', initials: 'RS', rating: 4.8 }, earliest: 15 },
  { id: 'quickfix', name: 'QuickFix Home', initials: 'QF', rating: 4.4, reviews: 610, km: 0.8, jobs: '700+', factor: 0.8, offer: '', categories: allCats, technician: { name: 'Vikas Yadav', initials: 'VY', rating: 4.5 }, earliest: 11 },
  { id: 'frostline', name: 'FrostLine Appliances', initials: 'FL', rating: 4.6, reviews: 1320, km: 2.5, jobs: '1,800+', factor: 0.9, offer: '', categories: ['ac', 'appliances'], technician: { name: 'Sandeep Rawat', initials: 'SR', rating: 4.7 }, earliest: 9 },
  { id: 'sparkle', name: 'SparkleCare', initials: 'SC', rating: 4.7, reviews: 1560, km: 1.9, jobs: '2,400+', factor: 1.0, offer: '', categories: ['cleaning', 'pest', 'painting'], technician: { name: 'Neha Sharma', initials: 'NS', rating: 4.9 }, earliest: 11 },
  { id: 'brightwire', name: 'BrightWire Electricals', initials: 'BW', rating: 4.6, reviews: 870, km: 2.2, jobs: '1,300+', factor: 0.95, offer: '', categories: ['electrical', 'plumbing', 'carpentry'], technician: { name: 'Imran Khan', initials: 'IK', rating: 4.8 }, earliest: 13 },
];

// A part the technician may add during the job (shown after completion, approved by the customer).
export const demoParts = {
  ac: { name: 'Capacitor replacement', price: 350 },
  appliances: { name: 'Inlet valve replacement', price: 450 },
  plumbing: { name: 'Tap cartridge', price: 180 },
  electrical: { name: 'Modular switch', price: 120 },
};

export const slots = [
  { start: 9, label: '9 – 11 AM' },
  { start: 11, label: '11 AM – 1 PM' },
  { start: 13, label: '1 – 3 PM' },
  { start: 15, label: '3 – 5 PM' },
  { start: 17, label: '5 – 7 PM' },
  { start: 19, label: '7 – 9 PM' },
];

export const STATUS_FLOW = ['confirmed', 'assigned', 'onway', 'started', 'completed'];

export const statusText = {
  confirmed: 'Booking confirmed',
  assigned: 'Technician assigned',
  onway: 'On the way',
  started: 'Job in progress',
  completed: 'Job completed',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const getCategory = (id) => categories.find((c) => c.id === id);
export const getProvider = (id) => providers.find((p) => p.id === id);
export const getService = (catId, id) => (services[catId] || []).find((s) => s.id === id);

export const priceFor = (service, provider) =>
  Math.round((service.price * (provider ? provider.factor : 1)) / 10) * 10 - 1;

export const money = (n) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

export function upcomingDates(count = 5) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    out.push({
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      day: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      num: d.getDate(),
      long: d.toLocaleDateString('en-IN', { weekday: i === 0 ? undefined : 'short', day: 'numeric', month: 'short' }),
      isToday: i === 0,
    });
  }
  return out;
}

export function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return sameDay ? 'Today, ' + label : label;
}

export function billFor(booking) {
  const provider = getProvider(booking.providerId);
  const lines = booking.serviceIds.map((id) => {
    const s = getService(booking.categoryId, id);
    return { name: s.name, amount: priceFor(s, provider) };
  });
  const serviceTotal = lines.reduce((a, l) => a + l.amount, 0);
  const parts = booking.parts || [];
  const partsTotal = parts.reduce((a, p) => a + p.price, 0);
  const discount = booking.firstBooking ? Math.min(Math.round(serviceTotal * 0.1), 100) : 0;
  const taxable = serviceTotal + partsTotal - discount;
  const gst = Math.round(taxable * 0.18 * 100) / 100;
  const total = Math.round((taxable + gst) * 100) / 100;
  return { lines, parts, serviceTotal, partsTotal, discount, gst, total, estimate: serviceTotal - discount };
}
