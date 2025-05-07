const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const quotations = await Quotation.find().sort({ createdAt: -1 });
    res.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    res.json(quotation);
  } catch (error) {
    console.error('Error fetching quotation details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  console.log('Received quotation data:', req.body);
  console.log('req.user:', req.user);
  const {
    number,
    client,
    date,
    expireDate,
    items,
    subTotal,
    tax,
    total,
    status,
    year,
    currency,
    note,
  } = req.body;

  if (!number || !client || !date || !expireDate || !items || !subTotal || !total || !status) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items must be a non-empty array' });
  }
  for (const item of items) {
    if (!item.item || typeof item.quantity !== 'number' || typeof item.price !== 'number' || typeof item.total !== 'number') {
      return res.status(400).json({ message: 'Each item must have a valid item name, quantity, price, and total' });
    }
  }
  if (!['Draft', 'Sent', 'Accepted', 'Declined'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const lastQuotation = await Quotation.findOne().sort({ createdAt: -1 });
    let newQuotationNo = 'WI0001';
    if (lastQuotation && lastQuotation.quotationNo) {
      const lastNum = parseInt(lastQuotation.quotationNo.replace('WI', ''), 10);
      newQuotationNo = `WI${String(lastNum + 1).padStart(4, '0')}`;
    }

    const quotation = new Quotation({
      quotationNo: newQuotationNo,
      number,
      client,
      date,
      expireDate,
      items,
      subTotal,
      tax,
      total,
      status,
      year,
      currency,
      note,
      createdBy: req.user.userId,
    });
    await quotation.save();

    // If status is "Accepted", auto-generate a payment
    if (status === 'Accepted') {
      console.log('Status is Accepted, creating payment for quotation:', quotation._id);
      console.log('Creating payment with customerName:', client, 'amount:', total, 'createdBy:', req.user.userId);
      const payment = new Payment({
        quotationId: quotation._id,
        customerName: client,
        amount: total,
        date: new Date(),
        status: 'Pending',
        createdBy: req.user.userId,
      });
      try {
        await payment.save();
        console.log('Payment created:', payment);
      } catch (paymentError) {
        console.error('Error saving payment:', paymentError);
      }
    }

    res.status(201).json(quotation);
  } catch (error) {
    console.error('Error saving quotation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  console.log('Received update quotation data:', req.body);
  const {
    number,
    client,
    date,
    expireDate,
    items,
    subTotal,
    tax,
    total,
    status,
    year,
    currency,
    note,
  } = req.body;

  if (!number || !client || !date || !expireDate || !items || !subTotal || !total || !status) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items must be a non-empty array' });
  }
  for (const item of items) {
    if (!item.item || typeof item.quantity !== 'number' || typeof item.price !== 'number' || typeof item.total !== 'number') {
      return res.status(400).json({ message: 'Each item must have a valid item name, quantity, price, and total' });
    }
  }
  if (!['Draft', 'Sent', 'Accepted', 'Declined'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // Check if status is changing to "Accepted"
    const wasAccepted = quotation.status === 'Accepted';
    const isNowAccepted = status === 'Accepted';
    console.log('Previous status:', quotation.status, 'New status:', status);

    // Update fields
    quotation.number = number;
    quotation.client = client;
    quotation.date = date;
    quotation.expireDate = expireDate;
    quotation.items = items;
    quotation.subTotal = subTotal;
    quotation.tax = tax;
    quotation.total = total;
    quotation.status = status;
    quotation.year = year;
    quotation.currency = currency;
    quotation.note = note;

    await quotation.save();

    // If status changed to "Accepted" and wasn't previously "Accepted", create a payment
    if (isNowAccepted && !wasAccepted) {
      console.log('Status changed to Accepted, checking for existing payment for quotation:', quotation._id);
      const existingPayment = await Payment.findOne({ quotationId: quotation._id });
      if (!existingPayment) {
        console.log('Creating payment with customerName:', client, 'amount:', total, 'createdBy:', req.user.userId);
        const payment = new Payment({
          quotationId: quotation._id,
          customerName: client,
          amount: total,
          date: new Date(),
          status: 'Pending',
          createdBy: req.user.userId,
        });
        try {
          await payment.save();
          console.log('Payment created:', payment);
        } catch (paymentError) {
          console.error('Error saving payment:', paymentError);
        }
      } else {
        console.log('Payment already exists for this quotation:', existingPayment);
      }
    }

    res.json(quotation);
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // Delete associated payments
    await Payment.deleteMany({ quotationId: req.params.id });
    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quotation and associated payments deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;