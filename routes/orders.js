const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');



router.post(['/', '/create'], protect, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.phone) {
      return res.status(400).json({ success: false, message: 'Shipping address and phone are required' });
    }

    
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
          
        }
      }
    }

    const order = new Order({
      user: req.user._id,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod'
    });

    const createdOrder = await order.save();
    res.status(201).json({ success: true, order: createdOrder });
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
