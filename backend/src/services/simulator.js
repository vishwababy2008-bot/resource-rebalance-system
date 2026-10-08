const Hospital = require('../models/Hospital');

const TICK_MS = +process.env.TICK_MS || 5000;
const HOURS = +process.env.SIM_HOURS_PER_TICK || 1;
const HISTORY_MAX = 48;

async function tick() {
  const hospitals = await Hospital.find();
  const now = new Date();
  for (const h of hospitals) {
    for (const r of h.resources) {
      const noise = 1 + (Math.random() - 0.5) * 0.3;            // +/-15% randomness
      const used = r.ratePerHour * HOURS * noise;
      const restock = Math.random() < 0.03 ? r.capacity * 0.3 : 0; // occasional delivery
      r.stock = Math.max(0, Math.min(r.capacity, r.stock - used + restock));
      r.history.push({ t: now, stock: +r.stock.toFixed(2) });
      if (r.history.length > HISTORY_MAX) r.history.shift();
    }
    await h.save();
  }
}

let timer;
exports.start = () => {
  timer = setInterval(() => tick().catch(e => console.error('tick error', e.message)), TICK_MS);
  console.log(`Simulator running every ${TICK_MS}ms (${HOURS}h simulated per tick)`);
};
exports.stop = () => clearInterval(timer);

// Demo helper: multiply a hospital's consumption rate (e.g. outbreak)
exports.spike = async (hospitalId, item, factor = 3) => {
  const h = await Hospital.findById(hospitalId);
  const r = h && h.resources.find(x => x.item === item);
  if (!r) return null;
  r.ratePerHour = +(r.ratePerHour * factor).toFixed(2);
  await h.save();
  return r;
};
