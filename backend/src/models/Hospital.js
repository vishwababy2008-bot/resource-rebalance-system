const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  item: { type: String, required: true },        // e.g. "Oxygen Cylinders"
  stock: { type: Number, required: true },       // units on hand
  ratePerHour: { type: Number, required: true }, // baseline consumption
  capacity: { type: Number, required: true },    // storage max
  history: [{ t: Date, stock: Number, _id: false }] // recent readings for prediction
}, { _id: false });

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  city: String,
  lat: Number,
  lng: Number,
  resources: [resourceSchema]
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
