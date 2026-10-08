const { predictAll } = require('./predictor');

const TARGET = () => +process.env.TARGET_HOURS || 48;

// Haversine distance in km
function km(a, b) {
  const R = 6371, toR = x => x * Math.PI / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Greedy matching per item: most urgent shortage first, take from nearest surplus hospital
// without dropping the donor below TARGET hours of cover.
exports.recommend = (hospitals) => {
  const preds = predictAll(hospitals);
  const loc = Object.fromEntries(hospitals.map(h => [String(h._id), h]));
  const items = [...new Set(preds.flatMap(p => p.resources.map(r => r.item)))];
  const out = [];

  for (const item of items) {
    const needy = [], donors = [];
    for (const p of preds) {
      const r = p.resources.find(x => x.item === item);
      if (!r) continue;
      const base = { hospitalId: String(p.hospitalId), name: p.name, ...r };
      if (r.status === 'shortage') {
        needy.push({ ...base, need: Math.ceil(r.rate * TARGET() - r.stock) });
      } else if (r.status === 'surplus') {
        donors.push({ ...base, give: Math.floor(r.stock - r.rate * TARGET()) });
      }
    }
    needy.sort((a, b) => a.hoursLeft - b.hoursLeft);

    for (const n of needy) {
      const ranked = donors.filter(d => d.give > 0)
        .sort((a, b) => km(loc[a.hospitalId], loc[n.hospitalId]) - km(loc[b.hospitalId], loc[n.hospitalId]));
      for (const d of ranked) {
        if (n.need <= 0) break;
        const qty = Math.min(n.need, d.give);
        d.give -= qty; n.need -= qty;
        out.push({
          item, quantity: qty,
          from: { id: d.hospitalId, name: d.name, hoursLeft: d.hoursLeft },
          to: { id: n.hospitalId, name: n.name, hoursLeft: n.hoursLeft },
          distanceKm: +km(loc[d.hospitalId], loc[n.hospitalId]).toFixed(1),
          urgency: n.hoursLeft < 8 ? 'critical' : n.hoursLeft < 16 ? 'high' : 'medium'
        });
      }
    }
  }
  return out;
};
