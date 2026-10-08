require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const seedIfEmpty = require('./src/services/seed');
const simulator = require('./src/services/simulator');

const app = express();
app.use(cors());           // lets Laptop 2's frontend call this API
app.use(express.json());
app.use('/api', require('./src/routes/api'));

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  await seedIfEmpty();
  simulator.start();
  app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
})().catch(e => { console.error(e); process.exit(1); });
