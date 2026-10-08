const Hospital = require('../models/Hospital');

const ITEMS = [
  { item: 'Oxygen Cylinders', base: 120, rate: 4 },
  { item: 'Blood Units (O+)', base: 80, rate: 3 },
  { item: 'Ventilators', base: 25, rate: 0.3 },
  { item: 'IV Fluids', base: 600, rate: 20 }
];

const HOSPITALS = [
  { name: 'Apollo Greams Road', city: 'Chennai', lat: 13.0604, lng: 80.2496 },
  { name: 'Rajiv Gandhi Govt General', city: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'MIOT International', city: 'Chennai', lat: 13.0220, lng: 80.1850 },
  { name: 'Stanley Medical College', city: 'Chennai', lat: 13.1067, lng: 80.2847 },
  { name: 'Fortis Malar', city: 'Chennai', lat: 13.0067, lng: 80.2570 },
  { name: 'Kauvery Hospital', city: 'Chennai', lat: 13.0358, lng: 80.2590 }
];

const rnd = (a, b) => a + Math.random() * (b - a);

module.exports = async function seedIfEmpty() {
  if (await Hospital.countDocuments() > 0) return;
  const docs = HOSPITALS.map(h => ({
    ...h,
    resources: ITEMS.map(i => {
      const capacity = Math.round(i.base * 2);
      return {
        item: i.item,
        capacity,
        // varied stock levels and consumption rates per hospital
        stock: Math.round(rnd(0.15, 0.95) * capacity),
        ratePerHour: +(i.rate * rnd(0.6, 1.5)).toFixed(2),
        history: []
      };
    })
  }));
  await Hospital.insertMany(docs);
  console.log(`Seeded ${docs.length} hospitals`);
};
