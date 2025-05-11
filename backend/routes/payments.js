const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

// GET all payments
router.get('/', auth, async (req, res) => {
  try {
    const paymentCount = await Payment.countDocuments();
    console.log('Total payments in database:', paymentCount);
    const payments = await Payment.find().sort({ createdAt: -1 });
    console.log('Fetched payments:', payments);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST to create a new payment
router.post('/', auth, async (req, res) => {
  try {
    const {
      quotationId,
      customerName,
      companyName,
      address,
      phone,
      quotationNo,
      items,
      subTotal,
      tax,
      total,
      status,
      year,
      currency,
      amount,
      date,
    } = req.body;

    // Validate required fields
    if (!quotationId || !customerName || !amount || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create new payment
    const payment = new Payment({
      quotationId,
      customerName,
      companyName,
      address,
      phone,
      quotationNo,
      items: items || [],
      subTotal: parseFloat(subTotal) || 0,
      tax: parseFloat(tax) || 0,
      total: parseFloat(total) || 0,
      status: status || 'Pending',
      year,
      currency,
      amount: parseFloat(amount),
      date: new Date(date),
      createdBy: req.user.userId,
    });

    await payment.save();
    console.log('Payment created:', payment);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Error creating payment', error: error.message });
  }
});

// Temporary endpoint to create a test payment
router.post('/test', auth, async (req, res) => {
  try {
    const payment = new Payment({
      quotationId: '680d305b2325bb3652334ce6', // Use a valid quotationId or replace with an existing one
      customerName: 'Test Customer',
      amount: 5000,
      date: new Date(),
      status: 'Pending',
      createdBy: req.user.userId,
    });
    await payment.save();
    console.log('Test payment created:', payment);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating test payment:', error);
    res.status(500).json({ message: 'Error creating test payment', error: error.message });
  }
});

// GET a single payment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT to update a payment
router.put('/:id', auth, async (req, res) => {
  try {
    const { customerName, amount, date, status, razorpayPaymentId } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.customerName = customerName || payment.customerName;
    payment.amount = amount || payment.amount;
    payment.date = date || payment.date;
    payment.status = status || payment.status;
    payment.razorpayPaymentId = razorpayPaymentId || payment.razorpayPaymentId;

    await payment.save();
    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE a payment
router.delete('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;