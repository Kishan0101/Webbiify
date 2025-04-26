const mongoose = require('mongoose');

const QuotationSchema = new mongoose.Schema({
  quotationNo: {
    type: String,
    required: true,
    unique: true,
  },
  number: {
    type: String,
    required: true,
    // No unique constraint
  },
  client: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  expireDate: {
    type: Date,
    required: true,
  },
  items: [
    {
      item: { type: String, required: true },
      hsnSac: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
  ],
  subTotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Accepted', 'Declined'],
    required: true,
  },
  year: {
    type: String,
  },
  currency: {
    type: String,
  },
  note: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Quotation', QuotationSchema);