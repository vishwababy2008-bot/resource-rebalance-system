const { GoogleGenerativeAI } = require('@google/generative-ai');

let cache = { key: '', text: '', at: 0 };

// One batched call for all recommendations; cached 30s to protect free-tier quota.
exports.explain = async (recs) => {
  if (!recs.length) return 'No transfers needed right now. All hospitals have adequate cover.';
  if (!process.env.GEMINI_API_KEY) return 'Gemini API key not configured.';

  const key = JSON.stringify(recs.map(r => [r.item, r.from.id, r.to.id, r.quantity]));
  if (cache.key === key && Date.now() - cache.at < 30000) return cache.text;

  const prompt = `You are a hospital logistics assistant. For each transfer below, write ONE plain-language sentence
explaining why it is recommended (mention hours of stock left at both hospitals, quantity, distance).
Return a numbered list in the same order.\n\n` +
    recs.map((r, i) =>
      `${i + 1}. ${r.quantity} x ${r.item} from ${r.from.name} (${r.from.hoursLeft}h cover) to ${r.to.name} (${r.to.hoursLeft}h cover), ${r.distanceKm} km, urgency ${r.urgency}`
    ).join('\n');

  try {
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      .getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
    const res = await model.generateContent(prompt);
    cache = { key, text: res.response.text(), at: Date.now() };
    return cache.text;
  } catch (e) {
    console.error('Gemini error:', e.message);
    return 'Explanation unavailable (Gemini request failed).';
  }
};
