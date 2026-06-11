const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { protect, adminOnly } = require('../middleware/auth');

// Create a new booking (Protected)
// Accepts POST on both '/' and '/create' for frontend compatibility
router.post(['/', '/create'], protect, async (req, res) => {
  try {
    const { service, date, timeSlot, address, phone, notes } = req.body;

    if (!service) {
      return res.status(400).json({ success: false, message: 'Service is required' });
    }

    // Look up the service to get name and price
    let serviceName = req.body.serviceName || '';
    let price = req.body.price || 0;
    try {
      const serviceDoc = await Service.findById(service);
      if (serviceDoc) {
        serviceName = serviceDoc.name;
        price = serviceDoc.price;
      }
    } catch (e) {
      // Service lookup failed, use provided values
    }

    const booking = new Booking({
      user: req.user._id,
      service,
      serviceName,
      price,
      customerName: req.user.name,
      customerPhone: phone || req.user.phone || '',
      customerEmail: req.user.email,
      customerAddress: address || req.user.address || '',
      preferredDate: date || req.body.preferredDate,
      preferredTime: timeSlot || req.body.preferredTime || '',
      notes: notes || '',
      status: 'pending'
    });

    const createdBooking = await booking.save();
    res.status(201).json({ success: true, booking: createdBooking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Server error creating booking' });
  }
});

// Get logged in user bookings (Protected)
// Supports both '/my-bookings' and '/my'
router.get(['/my-bookings', '/my'], protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching bookings' });
  }
});

// Get all bookings (Admin) — supports both '/all' and '/' GET
router.get(['/', '/all'], protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({}).populate('user', 'id name email phone').sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching all bookings' });
  }
});

// Update booking status (Admin only)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = req.body.status || booking.status;

    const updatedBooking = await booking.save();
    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating booking' });
  }
});

// Cancel booking (User — can only cancel their own pending bookings)
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending bookings can be cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();
    res.json({ success: true, message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error cancelling booking' });
  }
});

module.exports = router;
