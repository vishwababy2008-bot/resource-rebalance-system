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

module.exports = router;
