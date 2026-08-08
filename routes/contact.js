const express = require('express');
const Contact = require('../models/Contact');
const { protect, adminOnly } = require('../middleware/auth');
const { sendMessageNotification } = require('../utils/notificationService');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    
    // Send email notification
    sendMessageNotification(contact).catch(err => console.error('Email error:', err));

    res.status(201).json({ message: 'Message sent successfully', contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const messages = await Contact.find({}).sort('-createdAt');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const msg = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(msg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
