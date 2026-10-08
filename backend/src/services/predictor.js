const SHORTAGE = () => +process.env.SHORTAGE_HOURS || 24;
const SURPLUS = () => +process.env.SURPLUS_HOURS || 96;

// Observed consumption per reading step from recent history (ignores restock jumps),
// blended with the configured baseline rate.
function estimateRate(r) {
  const h = r.history || [];
  const drops = [];
  for (let i = 1; i < h.length; i++) {
    const d = h[i - 1].stock - h[i].stock;
    if (d >= 0) drops.push(d);
  }
  if (drops.length < 3) return r.ratePerHour;
  const observed = drops.reduce((a, b) => a + b, 0) / drops.length /
    (+process.env.SIM_HOURS_PER_TICK || 1);
  return 0.5 * observed + 0.5 * r.ratePerHour;
}

function predictResource(r) {
  const rate = Math.max(estimateRate(r), 0.001);
  const hoursLeft = r.stock / rate;
  let status = 'ok';
  if (hoursLeft < SHORTAGE()) status = 'shortage';
  else if (hoursLeft > SURPLUS()) status = 'surplus';
  return { item: r.item, stock: +r.stock.toFixed(1), rate: +rate.toFixed(2),
           hoursLeft: +hoursLeft.toFixed(1), status };
}

exports.predictAll = (hospitals) =>
  hospitals.map(h => ({
    hospitalId: h._id, name: h.name, city: h.city,
    resources: h.resources.map(predictResource)
  }));
