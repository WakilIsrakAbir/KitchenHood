const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const { sendOrderNotification } = require('../utils/notificationService');



router.post(['/', '/create'], optionalAuth, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod, guestName, guestPhone } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.phone) {
      return res.status(400).json({ success: false, message: 'Shipping address and phone are required' });
    }

    // Guest validation
    const isGuest = !req.user;
    if (isGuest) {
      if (!guestName || !guestName.trim()) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }
      if (!guestPhone || !guestPhone.trim()) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }
    }

    // Stock check
    for (const item of items) {
      if (item.product) {
        try {
          const product = await Product.findById(item.product);
          if (product) {
            if (product.stock < (item.quantity || 1)) {
              return res.status(400).json({
                success: false,
                message: `Insufficient stock for "${product.name}". Available: ${product.stock}`
              });
            }
            product.stock -= (item.quantity || 1);
            await product.save();
          }
        } catch (e) {
          // Product ID may be from fallback data
        }
      }
    }

    const orderData = {
      items,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      isGuest
    };

    if (req.user) {
      orderData.user = req.user._id;
    } else {
      orderData.guestName = guestName.trim();
      orderData.guestPhone = guestPhone.trim();
      orderData.guestAddress = shippingAddress.address || '';
    }

    const order = new Order(orderData);
    const createdOrder = await order.save();
    
    // Send email notification
    const userEmail = req.user ? req.user.email : null;
    const customerName = req.user ? req.user.name : (guestName || 'Customer');
    sendOrderNotification(createdOrder, userEmail, customerName).catch(err => console.error('Email error:', err));

    res.status(201).json({ success: true, order: createdOrder, isGuest });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Server error creating order' });
  }
});



router.get(['/my-orders', '/my'], protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
});


router.get(['/', '/all'], protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email phone').sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching all orders' });
  }
});

// Link guest orders to user account after registration/login (match by phone)
router.put('/link-guest', protect, async (req, res) => {
  try {
    const phone = req.user.phone;
    if (!phone) {
      return res.json({ success: true, linked: 0 });
    }
    const result = await Order.updateMany(
      { isGuest: true, guestPhone: phone, user: null },
      { $set: { user: req.user._id, isGuest: false } }
    );
    res.json({ success: true, linked: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error linking guest orders' });
  }
});


router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.body.status) order.orderStatus = req.body.status;
    if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;

    const updatedOrder = await order.save();
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating order' });
  }
});


router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting order' });
  }
});


router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled' });
    }

    
    for (const item of order.items) {
      if (item.product) {
        try {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity || 1 }
          });
        } catch (e) {  }
      }
    }

    order.orderStatus = 'cancelled';
    await order.save();
    res.json({ success: true, message: 'Order cancelled', order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error cancelling order' });
  }
});

module.exports = router;
