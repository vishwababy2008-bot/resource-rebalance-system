const mongoose = require('mongoose');

module.exports = async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing in .env');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
};
