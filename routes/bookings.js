const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');



router.post(['/', '/create'], optionalAuth, async (req, res) => {
  try {
    const { service, date, timeSlot, address, phone, notes, customerName } = req.body;

    if (!service) {
      return res.status(400).json({ success: false, message: 'Service is required' });
    }

    const isGuest = !req.user;

    // Guest validation
    if (isGuest) {
      if (!customerName || !customerName.trim()) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }
      if (!phone || !phone.trim()) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }
    }

    // Fetch service details
    let serviceName = req.body.serviceName || '';
    let price = req.body.price || 0;
    try {
      const serviceDoc = await Service.findById(service);
      if (serviceDoc) {
        serviceName = serviceDoc.name;
        price = serviceDoc.price;
      }
    } catch (e) {
      // Service ID may be from fallback data
    }

    const bookingData = {
      service,
      serviceName,
      price,
      customerName: req.user ? req.user.name : customerName.trim(),
      customerPhone: phone || (req.user ? req.user.phone : '') || '',
      customerEmail: req.user ? req.user.email : '',
      customerAddress: address || (req.user ? req.user.address : '') || '',
      preferredDate: date || req.body.preferredDate,
      preferredTime: timeSlot || req.body.preferredTime || '',
      notes: notes || '',
      status: 'pending',
      isGuest
    };

    if (req.user) {
      bookingData.user = req.user._id;
    }

    const booking = new Booking(bookingData);
    const createdBooking = await booking.save();
    res.status(201).json({ success: true, booking: createdBooking, isGuest });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Server error creating booking' });
  }
});



router.get(['/my-bookings', '/my'], protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching bookings' });
  }
});


router.get(['/', '/all'], protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({}).populate('user', 'id name email phone').sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching all bookings' });
  }
});

// Link guest bookings to user account after registration/login (match by phone)
router.put('/link-guest', protect, async (req, res) => {
  try {
    const phone = req.user.phone;
    if (!phone) {
      return res.json({ success: true, linked: 0 });
    }
    const result = await Booking.updateMany(
      { isGuest: true, customerPhone: phone, user: null },
      { $set: { user: req.user._id, isGuest: false } }
    );
    res.json({ success: true, linked: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error linking guest bookings' });
  }
});


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


router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting booking' });
  }
});


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
