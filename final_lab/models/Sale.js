const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  customerName: {
    type: String,
    default: 'Guest Customer'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', saleSchema);