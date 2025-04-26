const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['People', 'Company'] },
  name: { type: String, required: true },
  address: { type: String },
  email: { type: String },
  phone: { type: String, required: true },
  country: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Customer', customerSchema);