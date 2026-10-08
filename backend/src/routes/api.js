const router = require('express').Router();
const Hospital = require('../models/Hospital');
const { predictAll } = require('../services/predictor');
const { recommend } = require('../services/optimizer');
const { explain } = require('../services/gemini');
const sim = require('../services/simulator');

router.get('/health', (req, res) => res.json({ ok: true, time: new Date() }));

// Raw hospitals (without history to keep payload small)
router.get('/hospitals', async (req, res) => {
  res.json(await Hospital.find().select('-resources.history'));
});

// Per-hospital, per-resource forecast and status
router.get('/predictions', async (req, res) => {
  res.json(predictAll(await Hospital.find()));
});

// Transfer recommendations; add ?explain=true for Gemini explanations
router.get('/recommendations', async (req, res) => {
  const recs = recommend(await Hospital.find());
  const explanation = req.query.explain === 'true' ? await explain(recs) : undefined;
  res.json({ count: recs.length, recommendations: recs, explanation });
});

// Demo: simulate an outbreak/spike. Body: { hospitalId, item, factor }
router.post('/simulate/spike', async (req, res) => {
  const { hospitalId, item, factor } = req.body;
  const r = await sim.spike(hospitalId, item, factor);
  r ? res.json(r) : res.status(404).json({ error: 'Hospital or item not found' });
});
// Demo: force one clear shortage + one surplus for an item (just open in browser)
router.get('/demo/shortage', async (req, res) => {
  const item = req.query.item || 'Oxygen Cylinders';
  const hospitals = await Hospital.find();
  if (hospitals.length < 2) return res.status(400).json({ error: 'Need at least 2 hospitals' });
  const [donor, needy] = hospitals;
  const d = donor.resources.find(r => r.item === item);
  const n = needy.resources.find(r => r.item === item);
  if (!d || !n) return res.status(404).json({ error: 'Item not found' });
  d.stock = d.capacity; d.ratePerHour = 1; d.history = [];
  n.stock = 3; n.history = [];
  await donor.save();
  await needy.save();
  res.json({ item, donor: donor.name, needy: needy.name });
});
module.exports = router;
