const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

// Get all payments
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('createdBy', 'name email') // Optionally populate createdBy for user details
      .sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single payment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('createdBy', 'name email');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(payment);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new payment
router.post('/', auth, async (req, res) => {
  console.log('Received payment data:', req.body);
  console.log('req.user:', req.user);
  const { customerName, amount, date, status, razorpayOrderId, razorpayPaymentId } = req.body;

  // Validate required fields
  if (!customerName || amount == null || !date || !status) {
    return res.status(400).json({ message: 'All required fields (customerName, amount, date, status) must be provided' });
  }

  // Validate amount
  if (typeof amount !== 'number' || amount < 0) {
    return res.status(400).json({ message: 'Amount must be a non-negative number' });
  }

  // Validate date
  if (isNaN(new Date(date).getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  // Validate status
  if (!['Pending', 'Completed', 'Failed'].includes(status)) {
    return res.status(400).json({ message: 'Status must be one of: Pending, Completed, Failed' });
  }

  try {
    const payment = new Payment({
      customerName,
      amount,
      date: new Date(date),
      status,
      razorpayOrderId: razorpayOrderId || null, // Handle optional field
      razorpayPaymentId: razorpayPaymentId || null, // Handle optional field
      createdBy: req.user.userId,
    });
    await payment.save();
    console.log('Payment created:', payment);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error saving payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a payment
router.put('/:id', auth, async (req, res) => {
  console.log('Received update payment data:', req.body);
  const { customerName, amount, date, status, razorpayOrderId, razorpayPaymentId } = req.body;

  // Validate required fields
  if (!customerName || amount == null || !date || !status) {
    return res.status(400).json({ message: 'All required fields (customerName, amount, date, status) must be provided' });
  }

  // Validate amount
  if (typeof amount !== 'number' || amount < 0) {
    return res.status(400).json({ message: 'Amount must be a non-negative number' });
  }

  // Validate date
  if (isNaN(new Date(date).getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  // Validate status
  if (!['Pending', 'Completed', 'Failed'].includes(status)) {
    return res.status(400).json({ message: 'Status must be one of: Pending, Completed, Failed' });
  }

  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update fields
    payment.customerName = customerName;
    payment.amount = amount;
    payment.date = new Date(date);
    payment.status = status;
    payment.razorpayOrderId = razorpayOrderId || null;
    payment.razorpayPaymentId = razorpayPaymentId || null;

    await payment.save();
    res.status(200).json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a payment
router.delete('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;