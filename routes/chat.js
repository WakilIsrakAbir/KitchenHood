const express = require('express');
const Message = require('../models/Message');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', protect, adminOnly, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $sort: { createdAt: 1 } },
      { $group: {
          _id: '$conversationId',
          lastMessage: { $last: '$message' },
          senderName: { $first: '$senderName' },
          senderRole: { $first: '$senderRole' },
          updatedAt: { $last: '$createdAt' },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
      }},
      { $sort: { updatedAt: -1 } }
    ]);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/chat/history — user gets their own chat history
router.get('/history', protect, async (req, res) => {
  try {
    const conversationId = req.user._id.toString();
    const messages = await Message.find({ conversationId }).sort('createdAt');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:conversationId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId
    }).sort('createdAt');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const message = await Message.create({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      message: req.body.message,
      conversationId: req.body.conversationId
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/guest', async (req, res) => {
  try {
    const message = await Message.create({
      senderName: req.body.name || 'Guest',
      senderRole: 'user',
      message: req.body.message,
      conversationId: req.body.conversationId
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/read/:conversationId', protect, adminOnly, async (req, res) => {
  try {
    await Message.updateMany(
      { conversationId: req.params.conversationId, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
